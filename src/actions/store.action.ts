"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/database";
import { addresses, Store, stores } from "@/database/schema";
import { generateUniqueStoreSlug } from "@/lib/generate-slug";
import { getCurrentUserId } from "@/lib/get-current-userid";
import { saveLocalImage } from "@/lib/save-image";
import { revalidatePath } from "next/cache";
import { deleteLocalLogoFile } from "./storage.action";
import { connection } from "next/server";
export type CreateStoreActionState = {
    error?: string;
    fieldErrors?: {
        name?: string[];
        description?: string[];
        logoUrl?: string[];
        activeAddressId?: string[];
    };
    data?: {
        id: number;
        publicId: string | null;
        slug: string;
        activeAddressId: number | null;
    };
};

const optionalAddressIdFromForm = z.preprocess((val) => {
    if (val === null || val === undefined || val === "") return undefined;
    const num = Number(val);
    return Number.isInteger(num) && num > 0 ? num : NaN;
}, z.number().int().positive("Alamat toko tidak valid").optional());

const createStoreSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Nama toko minimal 2 karakter")
        .max(100, "Nama toko maksimal 100 karakter"),
    description: z
        .string()
        .trim()
        .max(500, "Deskripsi maksimal 500 karakter")
        .optional()
        .or(z.literal("")),
    activeAddressId: optionalAddressIdFromForm,
});

export async function createStoreAction(
    _prevState: CreateStoreActionState | unknown,
    formData: FormData
): Promise<CreateStoreActionState> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { error: "Kamu harus login terlebih dahulu untuk membuat toko." };
        }

        const existingStore = await db
            .select({ id: stores.id, slug: stores.slug })
            .from(stores)
            .where(eq(stores.userId, userId))
            .limit(1);

        if (existingStore.length > 0) {
            return { error: "Akun kamu sudah memiliki toko." };
        }

        const parsed = createStoreSchema.safeParse({
            name: formData.get("name"),
            description: formData.get("description"),
            activeAddressId: formData.get("activeAddressId"),
        });

        if (!parsed.success) {
            return {
                error: "Periksa kembali isian form kamu.",
                fieldErrors: parsed.error.flatten().fieldErrors,
            };
        }

        const {
            name,
            description,
            activeAddressId,
        } = parsed.data;

        if (activeAddressId !== undefined) {
            const [ownedAddress] = await db
                .select({ id: addresses.id })
                .from(addresses)
                .where(and(eq(addresses.id, activeAddressId), eq(addresses.userId, userId)))
                .limit(1);

            if (!ownedAddress) {
                return {
                    error: "Alamat yang dipilih tidak valid atau bukan milik akun kamu.",
                    fieldErrors: {
                        activeAddressId: ["Pilih alamat yang terdaftar di akun kamu."],
                    },
                };
            }
        }

        const slug = await generateUniqueStoreSlug(db, name);

        let logoUrl: string | null = null;
        const logoFile = formData.get("logo");

        if (logoFile instanceof File && logoFile.size > 0) {
            const saved = await saveLocalImage(logoFile, "");
            if ("error" in saved) {
                return {
                    error: saved.error,
                    fieldErrors: { logoUrl: [saved.error] },
                };
            }
            logoUrl = saved.url;
        }

        const [created] = await db
            .insert(stores)
            .values({
                userId,
                name,
                slug,
                description: description ? description : null,
                logoUrl: logoUrl ? logoUrl : null,
                activeAddressId: activeAddressId ?? null,
                isActive: true,
            })
            .returning({
                id: stores.id,
                publicId: stores.publicId,
                slug: stores.slug,
                activeAddressId: stores.activeAddressId,
            });

        revalidatePath("/profile/store");
        revalidatePath("/profile/store/create");
        revalidatePath("/");

        return {
            data: created,
        };
    } catch (err: unknown) {
        const pgCode =
            (err as { code?: string; cause?: { code?: string } })?.code ??
            (err as { cause?: { code?: string } })?.cause?.code;

        if (pgCode === "23505") {
            return {
                error: "Toko sudah terdaftar atau slug duplikat. Silakan coba lagi.",
            };
        }

        console.error("createStoreAction error:", err);
        return {
            error:
                "Terjadi kesalahan saat membuat toko. Silakan coba beberapa saat lagi.",
        };
    }
}

export type GetStoreActionResult = {
    error?: string;
    data?: Store | null;
};

export async function getCurrentUserStoreAction(): Promise<GetStoreActionResult> {
    await connection();
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return {
                error: "Kamu harus login terlebih dahulu untuk melihat data toko.",
                data: null,
            };
        }

        const [store] = await db
            .select()
            .from(stores)
            .where(eq(stores.userId, userId))
            .limit(1);

        return {
            data: store ?? null,
        };
    } catch (err: unknown) {
        console.error("getCurrentUserStoreAction error:", err);
        return {
            error: "Terjadi kesalahan saat memuat data toko.",
            data: null,
        };
    }
}


export async function getStoreBySlugAction(
    slug: string,
    options?: { includeInactive?: boolean }
): Promise<GetStoreActionResult> {
    try {
        const cleanSlug = slug.trim().toLowerCase();
        if (!cleanSlug) {
            return {
                error: "Slug toko tidak valid.",
                data: null,
            };
        }

        const condition = options?.includeInactive
            ? eq(stores.slug, cleanSlug)
            : and(eq(stores.slug, cleanSlug), eq(stores.isActive, true));

        const [store] = await db
            .select()
            .from(stores)
            .where(condition)
            .limit(1);

        return {
            data: store ?? null,
        };
    } catch (err: unknown) {
        console.error("getStoreBySlugAction error:", err);
        return {
            error: "Terjadi kesalahan saat mencari toko.",
            data: null,
        };
    }
}

export type DeleteStoreActionResult = {
    error?: string;
    success?: boolean;
};

export async function deleteStoreAction(
    storeId?: number
): Promise<DeleteStoreActionResult> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return {
                error: "Kamu harus login terlebih dahulu untuk menghapus toko.",
            };
        }

        const condition =
            typeof storeId === "number" && Number.isInteger(storeId) && storeId > 0
                ? and(eq(stores.id, storeId), eq(stores.userId, userId))
                : eq(stores.userId, userId);

        const [deleted] = await db
            .delete(stores)
            .where(condition)
            .returning({
                id: stores.id,
                slug: stores.slug,
                logoUrl: stores.logoUrl,
            });

        if (!deleted) {
            return {
                error: "Toko tidak ditemukan atau kamu tidak memiliki akses untuk menghapusnya.",
            };
        }

        await deleteLocalLogoFile(deleted.logoUrl);

        revalidatePath("/store");
        revalidatePath("/profile/store/create");
        revalidatePath(`/profile/store/${deleted.slug}`);
        revalidatePath("/");
        return {
            success: true,
        };
    } catch (err: unknown) {
        console.error("deleteStoreAction error:", err);
        return {
            error: "Terjadi kesalahan saat menghapus toko. Silakan coba beberapa saat lagi.",
        };
    }
}


export async function isUserStoreOwner(userId?: number | null): Promise<boolean> {
    if (!userId) {
        return false;
    }

    const [store] = await db
        .select({ id: stores.id })
        .from(stores)
        .where(eq(stores.userId, userId))
        .limit(1);

    return Boolean(store);
}