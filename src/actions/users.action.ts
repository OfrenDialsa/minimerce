"use server";

import { eq, and } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/database";
import { addresses, users } from "@/database/schema";
import { getCurrentUserId } from "@/lib/get-current-userid";
import { UserProfile } from "@/types/user.types";
import { saveLocalImage } from "@/lib/save-image";
import { revalidatePath } from "next/cache";

export type GetProfileActionResult = {
    error?: string;
    data?: UserProfile | null;
};

export async function getUserProfileAction(): Promise<GetProfileActionResult> {
    await connection();
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return {
                error: "Kamu harus login terlebih dahulu untuk melihat profil.",
                data: null,
            };
        }

        const [row] = await db
            .select({
                id: users.id,
                publicId: users.publicId,
                name: users.name,
                email: users.email,
                phone: users.phone,
                avatarUrl: users.avatarUrl,
                role: users.role,
                defaultAddressId: users.defaultAddressId,
                emailVerified: users.emailVerified,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
                defaultAddress: addresses,
            })
            .from(users)
            .leftJoin(addresses, eq(users.defaultAddressId, addresses.id))
            .where(eq(users.id, userId))
            .limit(1);

        if (!row) {
            return {
                error: "Data profil pengguna tidak ditemukan.",
                data: null,
            };
        }

        return {
            data: {
                id: row.id,
                publicId: row.publicId,
                name: row.name,
                email: row.email,
                phone: row.phone,
                avatarUrl: row.avatarUrl,
                role: row.role,
                defaultAddressId: row.defaultAddressId,
                emailVerified: row.emailVerified,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
                defaultAddress: row.defaultAddress ?? null,
            },
        };
    } catch (err: unknown) {
        console.error("getUserProfileAction error:", err);
        return {
            error: "Terjadi kesalahan saat memuat data profil.",
            data: null,
        };
    }
}

export type UpdateProfileActionResult = {
    error?: string;
    message?: string;
    data?: UserProfile | null;
};

export async function updateUserProfileAction(
    formData: FormData,
): Promise<UpdateProfileActionResult> {
    await connection();

    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return {
                error: "Kamu harus login terlebih dahulu untuk mengubah profil.",
                data: null,
            };
        }

        const [existingUser] = await db
            .select({
                id: users.id,
                name: users.name,
                phone: users.phone,
                avatarUrl: users.avatarUrl,
                defaultAddressId: users.defaultAddressId,
            })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!existingUser) {
            return {
                error: "Data profil pengguna tidak ditemukan.",
                data: null,
            };
        }

        const rawName = formData.get("name");
        const name = typeof rawName === "string" ? rawName.trim() : "";

        if (!name) {
            return {
                error: "Nama lengkap wajib diisi.",
                data: null,
            };
        }

        if (name.length > 120) {
            return {
                error: "Nama lengkap maksimal 120 karakter.",
                data: null,
            };
        }

        const rawPhone = formData.get("phone");
        const phone =
            typeof rawPhone === "string" && rawPhone.trim().length > 0
                ? rawPhone.trim()
                : null;

        let nextDefaultAddressId = existingUser.defaultAddressId;
        if (formData.has("defaultAddressId")) {
            const rawAddressId = String(formData.get("defaultAddressId") ?? "").trim();
            if (!rawAddressId) {
                nextDefaultAddressId = null;
            } else {
                const parsedAddressId = Number(rawAddressId);
                if (!Number.isSafeInteger(parsedAddressId) || parsedAddressId <= 0) {
                    return {
                        error: "ID alamat utama tidak valid.",
                        data: null,
                    };
                }

                const [ownedAddress] = await db
                    .select({ id: addresses.id })
                    .from(addresses)
                    .where(
                        and(
                            eq(addresses.id, parsedAddressId),
                            eq(addresses.userId, userId),
                        ),
                    )
                    .limit(1);

                if (!ownedAddress) {
                    return {
                        error: "Alamat utama tidak ditemukan atau bukan milik akun ini.",
                        data: null,
                    };
                }

                nextDefaultAddressId = ownedAddress.id;
            }
        }

        let nextAvatarUrl = existingUser.avatarUrl;
        const avatarFile = formData.get("avatar");
        if (avatarFile instanceof File && avatarFile.size > 0) {
            const saved = await saveLocalImage(avatarFile, "avatars");
            if ("error" in saved) {
                return {
                    error: saved.error,
                    data: null,
                };
            }
            nextAvatarUrl = saved.url;
        }

        const now = new Date();

        await db
            .update(users)
            .set({
                name,
                phone,
                avatarUrl: nextAvatarUrl,
                defaultAddressId: nextDefaultAddressId,
                updatedAt: now,
            })
            .where(eq(users.id, userId));

        const [updatedRow] = await db
            .select({
                id: users.id,
                publicId: users.publicId,
                name: users.name,
                email: users.email,
                phone: users.phone,
                avatarUrl: users.avatarUrl,
                role: users.role,
                defaultAddressId: users.defaultAddressId,
                emailVerified: users.emailVerified,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
                defaultAddress: addresses,
            })
            .from(users)
            .leftJoin(addresses, eq(users.defaultAddressId, addresses.id))
            .where(eq(users.id, userId))
            .limit(1);

        revalidatePath("/profile");

        return {
            message: "Profil berhasil diperbarui.",
            data: updatedRow
                ? {
                    id: updatedRow.id,
                    publicId: updatedRow.publicId,
                    name: updatedRow.name,
                    email: updatedRow.email,
                    phone: updatedRow.phone,
                    avatarUrl: updatedRow.avatarUrl,
                    role: updatedRow.role,
                    defaultAddressId: updatedRow.defaultAddressId,
                    emailVerified: updatedRow.emailVerified,
                    createdAt: updatedRow.createdAt,
                    updatedAt: updatedRow.updatedAt,
                    defaultAddress: updatedRow.defaultAddress ?? null,
                }
                : null,
        };
    } catch (err: unknown) {
        console.error("updateUserProfileAction error:", err);
        return {
            error: "Terjadi kesalahan saat memperbarui data profil.",
            data: null,
        };
    }
}