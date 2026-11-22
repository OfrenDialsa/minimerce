"use server";

import { eq } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/database";
import { addresses, users } from "@/database/schema";
import { getCurrentUserId } from "@/lib/get-current-userid";
import { UserProfile } from "@/types/user.types";

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