"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { connection } from "next/server";
import { addressSchema } from "@/lib/validation/address.schema";
import { db } from "@/database";
import { addresses, stores, users, Address } from "@/database/schema";
import { getCurrentUserId } from "@/lib/get-current-userid";

export type AddressActionState = {
    error?: string;
    fieldErrors?: {
        label?: string[];
        recipientName?: string[];
        phone?: string[];
        addressLine?: string[];
        postalCode?: string[];
        province?: string[];
        city?: string[];
        district?: string[];
        village?: string[];
        latitude?: string[];
        longitude?: string[];
        isDefault?: string[];
    };
    data?: Address;
};

export type GetAddressesActionResult = {
    error?: string;
    data: Address[];
};

function revalidateAddressPaths() {
    revalidatePath("/addresses");
    revalidatePath("/store");
    revalidatePath("/store/create");
    revalidatePath("/store/edit");
    revalidatePath("/profile");
}

/**
 * Mengambil seluruh alamat milik user yang sedang login.
 */
export async function getUserAddressesAction(): Promise<GetAddressesActionResult> {
    await connection();
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return {
                error: "Kamu harus login terlebih dahulu untuk melihat daftar alamat.",
                data: [],
            };
        }

        const rows = await db
            .select()
            .from(addresses)
            .where(eq(addresses.userId, userId))
            .orderBy(desc(addresses.isDefault), desc(addresses.id));

        return { data: rows };
    } catch (err: unknown) {
        console.error("getUserAddressesAction error:", err);
        return {
            error: "Terjadi kesalahan saat memuat daftar alamat.",
            data: [],
        };
    }
}

/**
 * Input / tambah alamat baru ke tabel `addresses`.
 * Jika `isDefault` true atau user belum punya alamat sama sekali, otomatis dijadikan default user.
 */
export async function createAddressAction(
    _prevState: AddressActionState | unknown,
    formData: FormData
): Promise<AddressActionState> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { error: "Kamu harus login terlebih dahulu untuk menambah alamat." };
        }

        const parsed = addressSchema.safeParse({
            label: formData.get("label"),
            recipientName: formData.get("recipientName"),
            phone: formData.get("phone"),
            addressLine: formData.get("addressLine"),
            postalCode: formData.get("postalCode"),
            province: formData.get("province"),
            city: formData.get("city"),
            district: formData.get("district"),
            village: formData.get("village"),
            latitude: formData.get("latitude"),
            longitude: formData.get("longitude"),
            isDefault: formData.get("isDefault"),
        });

        if (!parsed.success) {
            return {
                error: "Periksa kembali isian form alamat kamu.",
                fieldErrors: parsed.error.flatten().fieldErrors,
            };
        }

        const existingCount = await db
            .select({ id: addresses.id })
            .from(addresses)
            .where(eq(addresses.userId, userId))
            .limit(1);

        const shouldBeDefault = Boolean(parsed.data.isDefault) || existingCount.length === 0;

        const created = await db.transaction(async (tx) => {
            if (shouldBeDefault) {
                await tx
                    .update(addresses)
                    .set({ isDefault: false })
                    .where(eq(addresses.userId, userId));
            }

            const [inserted] = await tx
                .insert(addresses)
                .values({
                    userId,
                    label: parsed.data.label,
                    recipientName: parsed.data.recipientName,
                    phone: parsed.data.phone,
                    addressLine: parsed.data.addressLine,
                    postalCode: parsed.data.postalCode,
                    province: parsed.data.province,
                    city: parsed.data.city,
                    district: parsed.data.district ? parsed.data.district : null,
                    village: parsed.data.village ? parsed.data.village : null,
                    latitude: parsed.data.latitude ?? null,
                    longitude: parsed.data.longitude ?? null,
                    isDefault: shouldBeDefault,
                })
                .returning();

            if (shouldBeDefault) {
                await tx
                    .update(users)
                    .set({ defaultAddressId: inserted.id })
                    .where(eq(users.id, userId));
            }

            return inserted;
        });

        revalidateAddressPaths();
        return { data: created };
    } catch (err: unknown) {
        console.error("createAddressAction error:", err);
        return {
            error: "Terjadi kesalahan saat menyimpan alamat. Silakan coba lagi.",
        };
    }
}

/**
 * Mengatur salah satu alamat milik user sebagai alamat utama (`users.defaultAddressId` & `isDefault`).
 */
export async function setDefaultUserAddressAction(
    addressId: number
): Promise<{ error?: string; success?: boolean }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { error: "Kamu harus login terlebih dahulu." };
        }

        if (!Number.isInteger(addressId) || addressId <= 0) {
            return { error: "ID alamat tidak valid." };
        }

        const [target] = await db
            .select({ id: addresses.id })
            .from(addresses)
            .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
            .limit(1);

        if (!target) {
            return { error: "Alamat tidak ditemukan atau bukan milik akun kamu." };
        }

        await db.transaction(async (tx) => {
            await tx
                .update(addresses)
                .set({ isDefault: false })
                .where(eq(addresses.userId, userId));

            await tx
                .update(addresses)
                .set({ isDefault: true })
                .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)));

            await tx
                .update(users)
                .set({ defaultAddressId: addressId })
                .where(eq(users.id, userId));
        });

        revalidateAddressPaths();
        return { success: true };
    } catch (err: unknown) {
        console.error("setDefaultUserAddressAction error:", err);
        return { error: "Gagal mengatur alamat utama." };
    }
}

/**
 * Menghapus alamat milik user.
 */
export async function deleteAddressAction(
    addressId: number
): Promise<{ error?: string; success?: boolean }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { error: "Kamu harus login terlebih dahulu." };
        }

        if (!Number.isInteger(addressId) || addressId <= 0) {
            return { error: "ID alamat tidak valid." };
        }

        const [deleted] = await db
            .delete(addresses)
            .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
            .returning({ id: addresses.id, isDefault: addresses.isDefault });

        if (!deleted) {
            return { error: "Alamat tidak ditemukan atau kamu tidak memiliki akses." };
        }

        // Jika yang dihapus adalah alamat default, pindahkan default ke alamat lain jika masih ada
        if (deleted.isDefault) {
            const [nextAddr] = await db
                .select({ id: addresses.id })
                .from(addresses)
                .where(eq(addresses.userId, userId))
                .orderBy(desc(addresses.id))
                .limit(1);

            if (nextAddr) {
                await db
                    .update(addresses)
                    .set({ isDefault: true })
                    .where(eq(addresses.id, nextAddr.id));
                await db
                    .update(users)
                    .set({ defaultAddressId: nextAddr.id })
                    .where(eq(users.id, userId));
            } else {
                await db
                    .update(users)
                    .set({ defaultAddressId: null })
                    .where(eq(users.id, userId));
            }
        }

        // Pastikan jika toko memakai addressId yang dihapus, kolomnya tidak menyisakan id mati
        await db
            .update(stores)
            .set({ activeAddressId: null })
            .where(and(eq(stores.userId, userId), eq(stores.activeAddressId, addressId)));

        revalidateAddressPaths();
        return { success: true };
    } catch (err: unknown) {
        console.error("deleteAddressAction error:", err);
        return { error: "Gagal menghapus alamat." };
    }
}

export async function setStoreActiveAddressAction(
    addressId: number
): Promise<{ error?: string; success?: boolean }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { error: "Kamu harus login terlebih dahulu." };
        }

        if (!Number.isInteger(addressId) || addressId <= 0) {
            return { error: "ID alamat tidak valid." };
        }

        const [[userStore], [ownedAddress]] = await Promise.all([
            db
                .select({ id: stores.id })
                .from(stores)
                .where(eq(stores.userId, userId))
                .limit(1),
            db
                .select({ id: addresses.id })
                .from(addresses)
                .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
                .limit(1),
        ]);

        if (!userStore) {
            return { error: "Kamu belum memiliki toko." };
        }

        if (!ownedAddress) {
            return { error: "Alamat tidak ditemukan atau bukan milik akun kamu." };
        }

        await db
            .update(stores)
            .set({ activeAddressId: addressId, updatedAt: new Date() })
            .where(eq(stores.id, userStore.id));

        revalidatePath("/addresses");
        revalidatePath("/store");
        revalidatePath("/store/edit");

        return { success: true };
    } catch (err: unknown) {
        console.error("setStoreActiveAddressAction error:", err);
        return { error: "Gagal mengatur alamat toko." };
    }
}