"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/database";
import {
    addresses,
    cartItems,
    orderItems,
    orders,
    products,
    stores,
    users,
} from "@/database/schema";
import { saveLocalImage } from "@/lib/save-image";
import { ORDER_STATUS_OPTIONS } from "@/lib/order-status";
import { sendOrderCompletedEmail, sendOrderConfirmedEmail, sendOrderShippedEmail } from "@/lib/mail";
import { alias } from "drizzle-orm/pg-core";

export async function createOrderFromCartAction(formData: FormData) {
    const session = await auth();
    const buyerId = Number(session?.user?.id);

    if (!Number.isSafeInteger(buyerId) || buyerId <= 0) {
        redirect("/login");
    }

    const rawAddressId = formData.get("addressId");
    const addressId = Number(rawAddressId);

    if (!Number.isSafeInteger(addressId) || addressId <= 0) {
        throw new Error("Alamat pengiriman wajib dipilih");
    }

    const selectedCartItemIds = formData
        .getAll("cartItemIds")
        .map((v) => Number(v))
        .filter((n) => Number.isSafeInteger(n) && n > 0);

    if (selectedCartItemIds.length === 0) {
        throw new Error("Pilih minimal satu produk di keranjang untuk dipesan");
    }

    const createdOrder = await db.transaction(async (tx) => {
        const [address] = await tx
            .select({ id: addresses.id })
            .from(addresses)
            .where(and(eq(addresses.id, addressId), eq(addresses.userId, buyerId)))
            .limit(1);

        if (!address) {
            throw new Error("Alamat tidak ditemukan atau bukan milik akun ini");
        }

        const selectedRows = await tx
            .select({
                cartItemId: cartItems.id,
                productId: cartItems.productId,
                storeId: cartItems.storeId,
                quantity: cartItems.quantity,
            })
            .from(cartItems)
            .where(
                and(
                    eq(cartItems.userId, buyerId),
                    inArray(cartItems.id, selectedCartItemIds),
                ),
            );

        if (selectedRows.length === 0) {
            throw new Error("Item keranjang tidak ditemukan");
        }

        const targetStoreId = selectedRows[0].storeId;
        if (selectedRows.some((row) => row.storeId !== targetStoreId)) {
            throw new Error("Pilih produk dari satu toko yang sama dalam satu pesanan");
        }

        let totalAmount = 0;
        const preparedOrderItems: {
            productId: number;
            quantity: number;
            priceAtPurchase: number;
        }[] = [];

        for (const row of selectedRows) {
            const [product] = await tx
                .select()
                .from(products)
                .where(eq(products.id, row.productId))
                .limit(1);

            if (!product) {
                throw new Error("Produk tidak ditemukan");
            }

            if ("stock" in product && typeof product.stock === "number") {
                const [updated] = await tx
                    .update(products)
                    .set({ stock: sql`${products.stock} - ${row.quantity}` })
                    .where(eq(products.id, product.id))
                    .returning();

                if (!updated || updated.stock < 0) {
                    throw new Error(`Stok ${product.name} tidak mencukupi`);
                }
            }

            totalAmount += product.price * row.quantity;
            preparedOrderItems.push({
                productId: product.id,
                quantity: row.quantity,
                priceAtPurchase: product.price,
            });
        }

        const [order] = await tx
            .insert(orders)
            .values({
                buyerId,
                storeId: targetStoreId,
                totalAmount,
                status: "PENDING",
                addressId: address.id,
            })
            .returning();

        await tx.insert(orderItems).values(
            preparedOrderItems.map((entry) => ({
                orderId: order.id,
                productId: entry.productId,
                quantity: entry.quantity,
                priceAtPurchase: entry.priceAtPurchase,
            })),
        );

        await tx
            .delete(cartItems)
            .where(
                and(
                    eq(cartItems.userId, buyerId),
                    inArray(cartItems.id, selectedCartItemIds),
                ),
            );

        return order;
    });

    revalidatePath("/cart");
    revalidatePath("/orders");
    redirect(`/orders/${createdOrder.publicId}`);
}
export type GetOrderByPublicIdResult =
    | {
        ok: true;
        role: "buyer" | "seller";
        order: {
            id: number;
            publicId: string;
            buyerId: number;
            storeId: number;
            storeName: string;
            storeSlug: string;
            storeOwnerId: number;
            totalAmount: number;
            paymentProofUrl: string | null;
            paymentNotes: string | null;
            paymentUploadedAt: Date | null;
            status: string;
            addressId: number | null;
            createdAt: Date;
            updatedAt: Date;
        };
        shippingAddress: {
            id: number;
            label: string;
            recipientName: string;
            phone: string;
            addressLine: string;
            village: string | null;
            district: string | null;
            city: string;
            province: string;
            postalCode: string;
        } | null;
        items: {
            id: number;
            productId: number;
            productName: string;
            productSlug: string;
            imageUrl: string | null;
            quantity: number;
            priceAtPurchase: number;
            subtotal: number;
        }[];
    }
    | {
        ok: false;
        reason: "UNAUTHENTICATED" | "NOT_FOUND" | "FORBIDDEN";
        message: string;
    };

export async function getOrderByPublicId(
    publicId: string,
): Promise<GetOrderByPublicIdResult> {
    const session = await auth();
    const currentUserId = Number(session?.user?.id);

    if (!Number.isSafeInteger(currentUserId) || currentUserId <= 0) {
        return {
            ok: false,
            reason: "UNAUTHENTICATED",
            message: "Silakan login terlebih dahulu untuk melihat pesanan.",
        };
    }

    const cleanPublicId = publicId.trim();
    if (!cleanPublicId) {
        return {
            ok: false,
            reason: "NOT_FOUND",
            message: "Pesanan tidak ditemukan.",
        };
    }

    const [orderRow] = await db
        .select({
            id: orders.id,
            publicId: orders.publicId,
            buyerId: orders.buyerId,
            storeId: orders.storeId,
            storeName: stores.name,
            storeSlug: stores.slug,
            storeOwnerId: stores.userId,
            totalAmount: orders.totalAmount,
            status: orders.status,
            paymentProofUrl: orders.paymentProofUrl,
            paymentNotes: orders.paymentNotes,
            paymentUploadedAt: orders.paymentUploadedAt,
            addressId: orders.addressId,
            createdAt: orders.createdAt,
            updatedAt: orders.updatedAt,
        })
        .from(orders)
        .innerJoin(stores, eq(orders.storeId, stores.id))
        .where(eq(orders.publicId, cleanPublicId))
        .limit(1);

    if (!orderRow) {
        return {
            ok: false,
            reason: "NOT_FOUND",
            message: "Pesanan tidak ditemukan.",
        };
    }

    const isBuyer = Number(orderRow.buyerId) === currentUserId;
    const isStoreOwner = Number(orderRow.storeOwnerId) === currentUserId;

    if (!isBuyer && !isStoreOwner) {
        return {
            ok: false,
            reason: "FORBIDDEN",
            message: "Kamu tidak memiliki akses ke pesanan ini.",
        };
    }

    const [shippingAddressRow, itemRows] = await Promise.all([
        orderRow.addressId
            ? db
                .select({
                    id: addresses.id,
                    label: addresses.label,
                    recipientName: addresses.recipientName,
                    phone: addresses.phone,
                    addressLine: addresses.addressLine,
                    village: addresses.village,
                    district: addresses.district,
                    city: addresses.city,
                    province: addresses.province,
                    postalCode: addresses.postalCode,
                })
                .from(addresses)
                .where(eq(addresses.id, orderRow.addressId))
                .limit(1)
            : Promise.resolve([]),
        db
            .select({
                id: orderItems.id,
                productId: orderItems.productId,
                productName: products.name,
                productSlug: products.slug,
                imageUrl: products.imageUrl,
                quantity: orderItems.quantity,
                priceAtPurchase: orderItems.priceAtPurchase,
            })
            .from(orderItems)
            .innerJoin(products, eq(orderItems.productId, products.id))
            .where(eq(orderItems.orderId, orderRow.id))
            .orderBy(asc(orderItems.id)),
    ]);

    return {
        ok: true,
        role: isBuyer ? "buyer" : "seller",
        order: {
            id: orderRow.id,
            publicId: orderRow.publicId,
            buyerId: orderRow.buyerId,
            storeId: orderRow.storeId,
            storeName: orderRow.storeName,
            storeSlug: orderRow.storeSlug,
            storeOwnerId: orderRow.storeOwnerId,
            totalAmount: orderRow.totalAmount,
            paymentProofUrl: orderRow.paymentProofUrl,
            paymentNotes: orderRow.paymentNotes,
            paymentUploadedAt: orderRow.paymentUploadedAt,
            status: orderRow.status,
            addressId: orderRow.addressId,
            createdAt: orderRow.createdAt,
            updatedAt: orderRow.updatedAt,
        },
        shippingAddress: shippingAddressRow[0] ?? null,
        items: itemRows.map((row) => ({
            ...row,
            subtotal: row.priceAtPurchase * row.quantity,
        })),
    };
}

export interface OrderSummaryItem {
    id: number;
    publicId: string;
    buyerId: number;
    storeId: number;
    storeName: string;
    storeSlug: string;
    totalAmount: number;
    status: string;
    addressId: number | null;
    itemCount: number;
    totalQuantity: number;
    firstProductName: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export type GetMyOrdersResult =
    | {
        ok: true;
        orders: OrderSummaryItem[];
    }
    | {
        ok: false;
        reason: "UNAUTHENTICATED";
        message: string;
    };

export async function getMyOrdersAction(): Promise<GetMyOrdersResult> {
    const session = await auth();
    const currentUserId = Number(session?.user?.id);

    if (!Number.isSafeInteger(currentUserId) || currentUserId <= 0) {
        return {
            ok: false,
            reason: "UNAUTHENTICATED",
            message: "Silakan login terlebih dahulu untuk melihat daftar pesanan.",
        };
    }

    const orderRows = await db
        .select({
            id: orders.id,
            publicId: orders.publicId,
            buyerId: orders.buyerId,
            storeId: orders.storeId,
            storeName: stores.name,
            storeSlug: stores.slug,
            totalAmount: orders.totalAmount,
            status: orders.status,
            addressId: orders.addressId,
            createdAt: orders.createdAt,
            updatedAt: orders.updatedAt,
        })
        .from(orders)
        .innerJoin(stores, eq(orders.storeId, stores.id))
        .where(eq(orders.buyerId, currentUserId))
        .orderBy(desc(orders.createdAt), desc(orders.id));

    if (orderRows.length === 0) {
        return { ok: true, orders: [] };
    }

    const orderIds = orderRows.map((row) => row.id);

    const itemRows = await db
        .select({
            orderId: orderItems.orderId,
            quantity: orderItems.quantity,
            productName: products.name,
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(inArray(orderItems.orderId, orderIds))
        .orderBy(asc(orderItems.id));

    const itemStatsByOrderId = new Map<
        number,
        { itemCount: number; totalQuantity: number; firstProductName: string | null }
    >();

    for (const row of itemRows) {
        const existing = itemStatsByOrderId.get(row.orderId);
        if (!existing) {
            itemStatsByOrderId.set(row.orderId, {
                itemCount: 1,
                totalQuantity: row.quantity,
                firstProductName: row.productName,
            });
        } else {
            existing.itemCount += 1;
            existing.totalQuantity += row.quantity;
        }
    }

    const formattedOrders: OrderSummaryItem[] = orderRows.map((row) => {
        const stats = itemStatsByOrderId.get(row.id) ?? {
            itemCount: 0,
            totalQuantity: 0,
            firstProductName: null,
        };

        return {
            ...row,
            itemCount: stats.itemCount,
            totalQuantity: stats.totalQuantity,
            firstProductName: stats.firstProductName,
        };
    });

    return {
        ok: true,
        orders: formattedOrders,
    };
}
export type SubmitPaymentProofResult =
    | { ok: true; paymentProofUrl: string; message: string }
    | { ok: false; error: string };

export async function submitPaymentProofAction(
    formData: FormData,
): Promise<SubmitPaymentProofResult> {
    const session = await auth();
    const buyerId = Number(session?.user?.id);

    if (!Number.isSafeInteger(buyerId) || buyerId <= 0) {
        return {
            ok: false,
            error: "Silakan login terlebih dahulu untuk mengunggah bukti pembayaran.",
        };
    }

    const publicId = String(formData.get("publicId") ?? "").trim();
    const rawNotes = formData.get("paymentNotes");
    const paymentNotes =
        typeof rawNotes === "string" && rawNotes.trim().length > 0
            ? rawNotes.trim()
            : null;
    const file = formData.get("paymentProof");

    if (!publicId) {
        return { ok: false, error: "ID pesanan tidak valid." };
    }

    if (!(file instanceof File) || file.size === 0) {
        return {
            ok: false,
            error: "Silakan pilih gambar bukti pembayaran terlebih dahulu.",
        };
    }

    const [orderRow] = await db
        .select({
            id: orders.id,
            publicId: orders.publicId,
            buyerId: orders.buyerId,
            status: orders.status,
        })
        .from(orders)
        .where(eq(orders.publicId, publicId))
        .limit(1);

    if (!orderRow) {
        return { ok: false, error: "Pesanan tidak ditemukan." };
    }

    if (Number(orderRow.buyerId) !== buyerId) {
        return {
            ok: false,
            error: "Kamu tidak berhak mengunggah bukti pembayaran untuk pesanan ini.",
        };
    }

    if (orderRow.status.trim().toUpperCase() !== "PENDING") {
        return {
            ok: false,
            error: `Bukti pembayaran hanya bisa diunggah saat status pesanan masih PENDING (status saat ini: ${orderRow.status}).`,
        };
    }

    const saved = await saveLocalImage(file, "/uploads/payment-proof");
    if ("error" in saved) {
        return { ok: false, error: saved.error };
    }

    const now = new Date();

    await db
        .update(orders)
        .set({
            paymentProofUrl: saved.url,
            paymentNotes,
            paymentUploadedAt: now,
            updatedAt: now,
        })
        .where(
            and(
                eq(orders.id, orderRow.id),
                eq(orders.buyerId, buyerId),
                eq(orders.status, "PENDING"),
            ),
        );

    revalidatePath(`/orders/${orderRow.publicId}`);
    revalidatePath("/orders");

    return {
        ok: true,
        paymentProofUrl: saved.url,
        message: "Bukti pembayaran dan catatan berhasil disimpan.",
    };
}

export interface StoreOrderSummaryItem extends OrderSummaryItem {
    buyerName: string | null;
    buyerEmail: string | null;
    paymentProofUrl: string | null;
}

export type GetStoreOrdersResult =
    | {
        ok: true;
        store: {
            id: number;
            name: string;
            slug: string;
        } | null;
        orders: StoreOrderSummaryItem[];
    }
    | {
        ok: false;
        reason: "UNAUTHENTICATED";
        message: string;
    };

export async function getStoreOrdersAction(): Promise<GetStoreOrdersResult> {
    const session = await auth();
    const currentUserId = Number(session?.user?.id);

    if (!Number.isSafeInteger(currentUserId) || currentUserId <= 0) {
        return {
            ok: false,
            reason: "UNAUTHENTICATED",
            message: "Silakan login terlebih dahulu untuk melihat pesanan toko.",
        };
    }

    const [ownedStore] = await db
        .select({
            id: stores.id,
            name: stores.name,
            slug: stores.slug,
        })
        .from(stores)
        .where(eq(stores.userId, currentUserId))
        .limit(1);

    if (!ownedStore) {
        return {
            ok: true,
            store: null,
            orders: [],
        };
    }

    const orderRows = await db
        .select({
            id: orders.id,
            publicId: orders.publicId,
            buyerId: orders.buyerId,
            buyerName: users.name,
            buyerEmail: users.email,
            storeId: orders.storeId,
            storeName: stores.name,
            storeSlug: stores.slug,
            totalAmount: orders.totalAmount,
            status: orders.status,
            addressId: orders.addressId,
            paymentProofUrl: orders.paymentProofUrl,
            createdAt: orders.createdAt,
            updatedAt: orders.updatedAt,
        })
        .from(orders)
        .innerJoin(stores, eq(orders.storeId, stores.id))
        .innerJoin(users, eq(orders.buyerId, users.id))
        .where(
            and(
                eq(orders.storeId, ownedStore.id),
                eq(stores.userId, currentUserId),
            ),
        )
        .orderBy(desc(orders.createdAt), desc(orders.id));

    if (orderRows.length === 0) {
        return {
            ok: true,
            store: ownedStore,
            orders: [],
        };
    }

    const orderIds = orderRows.map((row) => row.id);

    const itemRows = await db
        .select({
            orderId: orderItems.orderId,
            quantity: orderItems.quantity,
            productName: products.name,
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(inArray(orderItems.orderId, orderIds))
        .orderBy(asc(orderItems.id));

    const itemStatsByOrderId = new Map<
        number,
        { itemCount: number; totalQuantity: number; firstProductName: string | null }
    >();

    for (const row of itemRows) {
        const existing = itemStatsByOrderId.get(row.orderId);
        if (!existing) {
            itemStatsByOrderId.set(row.orderId, {
                itemCount: 1,
                totalQuantity: row.quantity,
                firstProductName: row.productName,
            });
        } else {
            existing.itemCount += 1;
            existing.totalQuantity += row.quantity;
        }
    }

    const formattedOrders: StoreOrderSummaryItem[] = orderRows.map((row) => {
        const stats = itemStatsByOrderId.get(row.id) ?? {
            itemCount: 0,
            totalQuantity: 0,
            firstProductName: null,
        };

        return {
            ...row,
            itemCount: stats.itemCount,
            totalQuantity: stats.totalQuantity,
            firstProductName: stats.firstProductName,
        };
    });

    return {
        ok: true,
        store: ownedStore,
        orders: formattedOrders,
    };
}

export type OrderStatusValue = (typeof ORDER_STATUS_OPTIONS)[number];

export type UpdateOrderStatusResult =
    | { ok: true; status: OrderStatusValue; message: string }
    | { ok: false; error: string };

export async function updateOrderStatusAction(
    publicId: string,
    nextStatusRaw: string,
): Promise<UpdateOrderStatusResult> {
    const session = await auth();
    const currentUserId = Number(session?.user?.id);

    if (!Number.isSafeInteger(currentUserId) || currentUserId <= 0) {
        return { ok: false, error: "Silakan login terlebih dahulu." };
    }

    const cleanPublicId = publicId.trim();
    const normalizedStatus = nextStatusRaw.trim().toUpperCase() as OrderStatusValue;

    if (!cleanPublicId) {
        return { ok: false, error: "ID pesanan tidak valid." };
    }

    if (!ORDER_STATUS_OPTIONS.includes(normalizedStatus)) {
        return { ok: false, error: "Status pesanan tidak valid." };
    }

    const [targetOrder] = await db
        .select({
            id: orders.id,
            publicId: orders.publicId,
            buyerId: orders.buyerId,
            buyerEmail: users.email,
            buyerName: users.name,
            storeOwnerId: stores.userId,
            storeName: stores.name,
            totalAmount: orders.totalAmount,
            status: orders.status,
        })
        .from(orders)
        .innerJoin(stores, eq(orders.storeId, stores.id))
        .leftJoin(users, eq(orders.buyerId, users.id))
        .where(eq(orders.publicId, cleanPublicId))
        .limit(1);

    if (!targetOrder) {
        return { ok: false, error: "Pesanan tidak ditemukan." };
    }

    if (Number(targetOrder.storeOwnerId) !== currentUserId) {
        return {
            ok: false,
            error: "Hanya pemilik toko yang dapat memperbarui status pesanan ini.",
        };
    }

    const shouldSendConfirmedEmail =
        normalizedStatus === "CONFIRMED" &&
        targetOrder.status !== "CONFIRMED" &&
        Boolean(targetOrder.buyerEmail);

    const shouldSendShippedEmail =
        normalizedStatus === "SHIPPED" &&
        targetOrder.status !== "SHIPPED" &&
        Boolean(targetOrder.buyerEmail);

    const now = new Date();

    await db
        .update(orders)
        .set({
            status: normalizedStatus,
            updatedAt: now,
        })
        .where(eq(orders.id, targetOrder.id));

    if (shouldSendConfirmedEmail && targetOrder.buyerEmail) {
        try {
            await sendOrderConfirmedEmail({
                to: targetOrder.buyerEmail,
                buyerName: targetOrder.buyerName,
                orderPublicId: targetOrder.publicId ?? cleanPublicId,
                storeName: targetOrder.storeName,
                totalAmount: targetOrder.totalAmount,
            });
        } catch (mailError) {
            console.error("Notifikasi email konfirmasi pesanan gagal:", mailError);
        }
    }

    if (shouldSendShippedEmail && targetOrder.buyerEmail) {
        try {
            await sendOrderShippedEmail({
                to: targetOrder.buyerEmail,
                buyerName: targetOrder.buyerName,
                orderPublicId: targetOrder.publicId ?? cleanPublicId,
                storeName: targetOrder.storeName,
                totalAmount: targetOrder.totalAmount,
            });
        } catch (mailError) {
            console.error("Notifikasi email pengiriman pesanan gagal:", mailError);
        }
    }

    revalidatePath("/store/orders");
    revalidatePath(`/store/orders/${targetOrder.publicId ?? cleanPublicId}`);
    revalidatePath(`/orders/${targetOrder.publicId ?? cleanPublicId}`);
    revalidatePath("/orders");

    return {
        ok: true,
        status: normalizedStatus,
        message: `Status pesanan berhasil diubah menjadi ${normalizedStatus}.`,
    };
}
export async function confirmOrderReceivedAction(
    publicId: string,
): Promise<UpdateOrderStatusResult> {
    const session = await auth();
    const currentUserId = Number(session?.user?.id);

    if (!Number.isSafeInteger(currentUserId) || currentUserId <= 0) {
        return { ok: false, error: "Silakan login terlebih dahulu." };
    }

    const cleanPublicId = publicId.trim();
    if (!cleanPublicId) {
        return { ok: false, error: "ID pesanan tidak valid." };
    }

    const buyerUser = alias(users, "buyer");
    const sellerUser = alias(users, "seller");

    const [targetOrder] = await db
        .select({
            id: orders.id,
            publicId: orders.publicId,
            buyerId: orders.buyerId,
            buyerName: buyerUser.name,
            storeName: stores.name,
            sellerEmail: sellerUser.email,
            sellerName: sellerUser.name,
            totalAmount: orders.totalAmount,
            status: orders.status,
        })
        .from(orders)
        .innerJoin(stores, eq(orders.storeId, stores.id))
        .leftJoin(buyerUser, eq(orders.buyerId, buyerUser.id))
        .leftJoin(sellerUser, eq(stores.userId, sellerUser.id))
        .where(eq(orders.publicId, cleanPublicId))
        .limit(1);

    if (!targetOrder) {
        return { ok: false, error: "Pesanan tidak ditemukan." };
    }

    if (Number(targetOrder.buyerId) !== currentUserId) {
        return {
            ok: false,
            error: "Hanya pembeli yang dapat mengonfirmasi penerimaan pesanan ini.",
        };
    }

    if (targetOrder.status.trim().toUpperCase() !== "SHIPPED") {
        return {
            ok: false,
            error: "Pesanan hanya dapat dikonfirmasi diterima saat berstatus Dikirim.",
        };
    }

    const resolvedPublicId = targetOrder.publicId ?? cleanPublicId;

    await db
        .update(orders)
        .set({
            status: "COMPLETED",
            updatedAt: new Date(),
        })
        .where(eq(orders.id, targetOrder.id));

    if (targetOrder.sellerEmail) {
        try {
            await sendOrderCompletedEmail({
                to: targetOrder.sellerEmail,
                storeOwnerName: targetOrder.sellerName,
                buyerName: targetOrder.buyerName,
                orderPublicId: resolvedPublicId,
                storeName: targetOrder.storeName,
                totalAmount: targetOrder.totalAmount,
            });
        } catch (mailError) {
            console.error("Notifikasi email pesanan selesai ke toko gagal:", mailError);
        }
    }

    revalidatePath("/orders");
    revalidatePath(`/orders/${resolvedPublicId}`);
    revalidatePath("/store/orders");
    revalidatePath(`/store/orders/${resolvedPublicId}`);

    return {
        ok: true,
        status: "COMPLETED",
        message: "Pesanan berhasil ditandai sudah diterima (Selesai).",
    };
}