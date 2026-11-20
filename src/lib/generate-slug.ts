import { eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import type { db as database } from "@/database";
import { stores } from "@/database/schema";

const randomSuffix = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 4);

export function slugify(input: string, fallback = "store"): string {
    const normalized = input
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-{2,}/g, "-");

    return normalized || fallback;
}

export async function generateUniqueStoreSlug(
    db: typeof database,
    name: string,
    excludeStoreId?: number
): Promise<string> {
    const baseSlug = slugify(name, "toko");

    const existing = await db
        .select({ id: stores.id, slug: stores.slug })
        .from(stores)
        .where(eq(stores.slug, baseSlug));

    const isTakenByOther = existing.some((row) => row.id !== excludeStoreId);

    if (!isTakenByOther) {
        return baseSlug;
    }

    for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = `${baseSlug}-${randomSuffix()}`;
        const conflict = await db
            .select({ id: stores.id })
            .from(stores)
            .where(eq(stores.slug, candidate));

        if (conflict.length === 0) {
            return candidate;
        }
    }

    return `${baseSlug}-${Date.now().toString(36)}`;
}