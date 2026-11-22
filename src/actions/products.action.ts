"use server";

import { and, asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { connection } from "next/server";
import { ulid } from "ulid";
import { db } from "@/database";
import { products, stores, type Product } from "@/database/schema";
import { getCurrentUserId } from "@/lib/get-current-userid";
import {
    createProductSchema,
    updateProductSchema,
} from "@/lib/validation/products.schema";
import { saveLocalImage } from "@/lib/save-image";

export type ProductActionState = {
    success?: boolean;
    error?: string;
    fieldErrors?: {
        name?: string[];
        description?: string[];
        price?: string[];
        stock?: string[];
        categoryId?: string[];
        imageUrl?: string[];
        isArchived?: string[];
    };
    data?: Product;
};

export type GetProductsActionResult = {
    error?: string;
    data: Product[];
};

function slugifyProductName(name: string): string {
    const base = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    return base || "produk";
}

async function generateUniqueProductSlug(
    storeId: number,
    name: string,
    excludeProductId?: number
): Promise<string> {
    const baseSlug = slugifyProductName(name);
    let candidate = baseSlug;
    let counter = 1;

    while (true) {
        const rows = await db
            .select({ id: products.id })
            .from(products)
            .where(and(eq(products.storeId, storeId), eq(products.slug, candidate)))
            .limit(2);

        const conflict = rows.some((row) => row.id !== excludeProductId);
        if (!conflict) {
            return candidate;
        }

        counter += 1;
        candidate = `${baseSlug}-${counter}`;
    }
}

async function getOwnedStoreByUserId(userId: number) {
    const [store] = await db
        .select()
        .from(stores)
        .where(eq(stores.userId, userId))
        .limit(1);

    return store ?? null;
}

function revalidateProductPaths(storeSlug?: string | null) {
    revalidatePath("/store");
    revalidatePath("/store/products");
    revalidatePath("/products");
    if (storeSlug) {
        revalidatePath(`/toko/${storeSlug}`);
    }
}

/**
 * Mengambil seluruh produk milik toko user yang sedang login.
 */
export async function getStoreProductsAction(options?: {
    includeArchived?: boolean;
}): Promise<GetProductsActionResult> {
    await connection();
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return {
                error: "Kamu harus login terlebih dahulu untuk melihat produk toko.",
                data: [],
            };
        }

        const store = await getOwnedStoreByUserId(userId);
        if (!store) {
            return {
                error: "Kamu belum memiliki toko.",
                data: [],
            };
        }

        const whereClause = options?.includeArchived
            ? eq(products.storeId, store.id)
            : and(eq(products.storeId, store.id), eq(products.isArchived, false));

        const rows = await db
            .select()
            .from(products)
            .where(whereClause)
            .orderBy(desc(products.createdAt), desc(products.id));

        return { data: rows };
    } catch (err: unknown) {
        console.error("getStoreProductsAction error:", err);
        return {
            error: "Terjadi kesalahan saat memuat daftar produk toko.",
            data: [],
        };
    }
}

/**
 * Mengambil produk aktif (non-arsip) berdasarkan slug toko untuk halaman publik.
 */
export async function getPublicStoreProductsAction(
    storeSlug: string
): Promise<GetProductsActionResult> {
    await connection();
    try {
        const cleanSlug = storeSlug.trim();
        if (!cleanSlug) {
            return { error: "Slug toko tidak valid.", data: [] };
        }

        const [store] = await db
            .select({ id: stores.id, isActive: stores.isActive })
            .from(stores)
            .where(eq(stores.slug, cleanSlug))
            .limit(1);

        if (!store || !store.isActive) {
            return { data: [] };
        }

        const rows = await db
            .select()
            .from(products)
            .where(and(eq(products.storeId, store.id), eq(products.isArchived, false)))
            .orderBy(asc(products.id));

        return { data: rows };
    } catch (err: unknown) {
        console.error("getPublicStoreProductsAction error:", err);
        return {
            error: "Gagal memuat katalog produk toko.",
            data: [],
        };
    }
}

/**
 * Mengambil detail satu produk berdasarkan ID (memastikan milik toko user).
 */
export async function getProductByIdAction(
    productId: number
): Promise<{ error?: string; data: Product | null }> {
    await connection();
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { error: "Kamu harus login terlebih dahulu.", data: null };
        }

        if (!Number.isInteger(productId) || productId <= 0) {
            return { error: "ID produk tidak valid.", data: null };
        }

        const store = await getOwnedStoreByUserId(userId);
        if (!store) {
            return { error: "Kamu belum memiliki toko.", data: null };
        }

        const [product] = await db
            .select()
            .from(products)
            .where(and(eq(products.id, productId), eq(products.storeId, store.id)))
            .limit(1);

        if (!product) {
            return { error: "Produk tidak ditemukan.", data: null };
        }

        return { data: product };
    } catch (err: unknown) {
        console.error("getProductByIdAction error:", err);
        return { error: "Gagal memuat detail produk.", data: null };
    }
}

export async function createProductAction(
    _prevState: ProductActionState | unknown,
    formData: FormData
): Promise<ProductActionState> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: "Kamu harus login terlebih dahulu untuk menambah produk." };
        }

        const store = await getOwnedStoreByUserId(userId);
        if (!store) {
            return { success: false, error: "Buat toko terlebih dahulu sebelum menambahkan produk." };
        }

        const parsed = createProductSchema.safeParse({
            name: formData.get("name"),
            description: formData.get("description"),
            price: formData.get("price"),
            stock: formData.get("stock"),
            category: formData.get("category"),
            isArchived: formData.get("isArchived"),
        });

        if (!parsed.success) {
            return {
                success: false,
                error: "Periksa kembali isian form produk kamu.",
                fieldErrors: parsed.error.flatten().fieldErrors,
            };
        }

        let imageUrl: string | null = null;
        const imageFile = formData.get("image");

        if (imageFile instanceof File && imageFile.size > 0) {
            const saved = await saveLocalImage(imageFile, "uploads/products");
            if ("error" in saved) {
                return {
                    success: false,
                    error: saved.error,
                    fieldErrors: { imageUrl: [saved.error] },
                };
            }
            imageUrl = saved.url;
        }

        const slug = await generateUniqueProductSlug(store.id, parsed.data.name);

        const [created] = await db
            .insert(products)
            .values({
                publicId: ulid(),
                storeId: store.id,
                category: parsed.data.category ?? null,
                name: parsed.data.name,
                slug,
                description: parsed.data.description ? parsed.data.description : null,
                price: parsed.data.price,
                stock: parsed.data.stock,
                imageUrl,
                isArchived: Boolean(parsed.data.isArchived),
            })
            .returning();

        revalidateProductPaths(store.slug);
        return { success: true, data: created };
    } catch (err: unknown) {
        console.error("createProductAction error:", err);
        return {
            success: false,
            error: "Terjadi kesalahan saat menyimpan produk baru.",
        };
    }
}

/**
 * Memperbarui data produk milik toko user.
 */
export async function updateProductAction(
    productId: number,
    _prevState: ProductActionState | unknown,
    formData: FormData
): Promise<ProductActionState> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { success: false, error: "Kamu harus login terlebih dahulu." };
        }

        if (!Number.isInteger(productId) || productId <= 0) {
            return { success: false, error: "ID produk tidak valid." };
        }

        const store = await getOwnedStoreByUserId(userId);
        if (!store) {
            return { success: false, error: "Kamu belum memiliki toko." };
        }

        const [existing] = await db
            .select()
            .from(products)
            .where(and(eq(products.id, productId), eq(products.storeId, store.id)))
            .limit(1);

        if (!existing) {
            return { success: false, error: "Produk tidak ditemukan atau bukan milik toko kamu." };
        }

        const rawIsArchived = formData.get("isArchived");
        const nextIsArchived =
            rawIsArchived === "true" ||
            rawIsArchived === "on" ||
            rawIsArchived === "1";

        const parsed = updateProductSchema.safeParse({
            id: productId,
            name: formData.get("name"),
            description: formData.get("description"),
            price: formData.get("price"),
            stock: formData.get("stock"),
            category: formData.get("category"),
            isArchived: nextIsArchived,
        });

        if (!parsed.success) {
            return {
                success: false,
                error: "Periksa kembali perubahan data produk kamu.",
                fieldErrors: parsed.error.flatten().fieldErrors,
            };
        }

        let nextImageUrl: string | null = existing.imageUrl;
        const imageFile = formData.get("image");

        if (imageFile instanceof File && imageFile.size > 0) {
            const saved = await saveLocalImage(imageFile, "uploads/products");
            if ("error" in saved) {
                return {
                    success: false,
                    error: saved.error,
                    fieldErrors: { imageUrl: [saved.error] },
                };
            }
            nextImageUrl = saved.url;
        }

        const nextName = parsed.data.name ?? existing.name;
        const nextSlug =
            parsed.data.name && parsed.data.name !== existing.name
                ? await generateUniqueProductSlug(store.id, parsed.data.name, existing.id)
                : existing.slug;

        const [updated] = await db
            .update(products)
            .set({
                name: nextName,
                slug: nextSlug,
                description:
                    parsed.data.description !== undefined
                        ? parsed.data.description || null
                        : existing.description,
                price: parsed.data.price ?? existing.price,
                stock: parsed.data.stock ?? existing.stock,
                category:
                    parsed.data.category !== undefined
                        ? parsed.data.category ?? null
                        : existing.category,
                imageUrl: nextImageUrl,
                isArchived:
                    parsed.data.isArchived !== undefined
                        ? parsed.data.isArchived
                        : nextIsArchived,
                updatedAt: new Date(),
            })
            .where(and(eq(products.id, productId), eq(products.storeId, store.id)))
            .returning();

        revalidateProductPaths(store.slug);
        return { success: true, data: updated };
    } catch (err: unknown) {
        console.error("updateProductAction error:", err);
        return {
            success: false,
            error: "Gagal memperbarui data produk.",
        };
    }
}

/**
 * Mengarsipkan atau mengaktifkan kembali produk (`isArchived`).
 */
export async function toggleArchiveProductAction(
    productId: number,
    isArchived: boolean
): Promise<{ error?: string; success?: boolean }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { error: "Kamu harus login terlebih dahulu." };
        }

        if (!Number.isInteger(productId) || productId <= 0) {
            return { error: "ID produk tidak valid." };
        }

        const store = await getOwnedStoreByUserId(userId);
        if (!store) {
            return { error: "Kamu belum memiliki toko." };
        }

        const [updated] = await db
            .update(products)
            .set({ isArchived, updatedAt: new Date() })
            .where(and(eq(products.id, productId), eq(products.storeId, store.id)))
            .returning({ id: products.id });

        if (!updated) {
            return { error: "Produk tidak ditemukan atau bukan milik toko kamu." };
        }

        revalidateProductPaths(store.slug);
        return { success: true };
    } catch (err: unknown) {
        console.error("toggleArchiveProductAction error:", err);
        return { error: "Gagal mengubah status arsip produk." };
    }
}

/**
 * Menghapus produk secara permanen dari toko milik user.
 */
export async function deleteProductAction(
    productId: number
): Promise<{ error?: string; success?: boolean }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { error: "Kamu harus login terlebih dahulu." };
        }

        if (!Number.isInteger(productId) || productId <= 0) {
            return { error: "ID produk tidak valid." };
        }

        const store = await getOwnedStoreByUserId(userId);
        if (!store) {
            return { error: "Kamu belum memiliki toko." };
        }

        const [deleted] = await db
            .delete(products)
            .where(and(eq(products.id, productId), eq(products.storeId, store.id)))
            .returning({ id: products.id });

        if (!deleted) {
            return { error: "Produk tidak ditemukan atau kamu tidak memiliki akses." };
        }

        revalidateProductPaths(store.slug);
        return { success: true };
    } catch (err: unknown) {
        console.error("deleteProductAction error:", err);
        return { error: "Gagal menghapus produk." };
    }
}