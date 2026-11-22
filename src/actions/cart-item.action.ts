"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, desc, eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/database";
import { cartItems, products, stores } from "@/database/schema";

export async function getCartItemsByUserId(userId: number) {
    if (!Number.isSafeInteger(userId) || userId <= 0) {
        return [];
    }

    return await db
        .select({
            id: cartItems.id,
            publicId: cartItems.publicId,
            userId: cartItems.userId,
            storeId: stores.id,
            storeName: stores.name,
            storeSlug: stores.slug,
            productId: products.id,
            productName: products.name,
            price: products.price,
            quantity: cartItems.quantity,
            updatedAt: cartItems.updatedAt,
        })
        .from(cartItems)
        .innerJoin(products, eq(cartItems.productId, products.id))
        .innerJoin(stores, eq(cartItems.storeId, stores.id))
        .where(eq(cartItems.userId, userId))
        .orderBy(desc(cartItems.updatedAt), desc(cartItems.id));
}


export type AddToCartResult =
    | { ok: true; message: string }
    | { ok: false; error: string };

export async function addToCartAction(
    productId: number,
    quantity = 1,
): Promise<AddToCartResult> {
    const session = await auth();
    const userId = Number(session?.user?.id);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
        redirect("/login");
    }

    const safeQty = Math.max(1, Math.floor(Number(quantity) || 1));

    const [item] = await db
        .select({
            productId: products.id,
            storeId: products.storeId,
            storeOwnerId: stores.userId,
            stock: products.stock,
        })
        .from(products)
        .innerJoin(stores, eq(products.storeId, stores.id))
        .where(eq(products.id, productId))
        .limit(1);

    if (!item) {
        return { ok: false, error: "Produk tidak ditemukan." };
    }

    console.log("[addToCartAction]", {
        sessionUserIdRaw: session?.user?.id,
        userId,
        productId: item.productId,
        storeId: item.storeId,
        storeOwnerIdRaw: item.storeOwnerId,
        storeOwnerIdNum: Number(item.storeOwnerId),
    });

    if (Number(item.storeOwnerId) === userId) {
        return {
            ok: false,
            error:
                "Kamu tidak bisa memasukkan produk dari tokomu sendiri ke keranjang.",
        };
    }

    if (item.stock <= 0 || safeQty > item.stock) {
        return { ok: false, error: "Stok produk tidak mencukupi." };
    }

    const [existing] = await db
        .select({ id: cartItems.id, quantity: cartItems.quantity })
        .from(cartItems)
        .where(
            and(eq(cartItems.userId, userId), eq(cartItems.productId, item.productId)),
        )
        .limit(1);

    if (existing) {
        const nextQty = existing.quantity + safeQty;
        if (nextQty > item.stock) {
            return {
                ok: false,
                error: `Jumlah di keranjang melebihi stok (${item.stock} unit).`,
            };
        }

        await db
            .update(cartItems)
            .set({
                quantity: sql`${cartItems.quantity} + ${safeQty}`,
                updatedAt: new Date(),
            })
            .where(eq(cartItems.id, existing.id));
    } else {
        await db.insert(cartItems).values({
            userId,
            storeId: item.storeId,
            productId: item.productId,
            quantity: safeQty,
        });
    }

    revalidatePath("/cart");

    return {
        ok: true,
        message: `${safeQty} produk berhasil dimasukkan ke keranjang.`,
    };
}