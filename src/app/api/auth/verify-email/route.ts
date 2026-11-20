import { NextResponse } from "next/server";
import { db } from "@/database";
import { users, verificationTokens } from "@/database/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
        return NextResponse.redirect(new URL("/error?message=Token tidak ditemukan", request.url));
    }

    try {
        const existingToken = await db.query.verificationTokens.findFirst({ where: eq(verificationTokens.token, token) });

        if (!existingToken) {
            return NextResponse.redirect(new URL("/error?message=Token verifikasi tidak valid", request.url));
        }

        const hasExpired = new Date() > new Date(existingToken.expires);
        if (hasExpired) {
            return NextResponse.redirect(new URL("/error?message=Token verifikasi sudah kedaluwarsa", request.url));
        }

        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, existingToken.identifier),
        });

        if (!existingUser) {
            return NextResponse.redirect(new URL("/error?message=Email tidak terdaftar", request.url));
        }

        await db.update(users)
            .set({ emailVerified: new Date() })
            .where(eq(users.email, existingUser.email));

        await db.delete(verificationTokens)
            .where(and(
                eq(verificationTokens.identifier, existingToken.identifier),
                eq(verificationTokens.token, token)
            ));

        return NextResponse.redirect(new URL("/verified-success", request.url));
    } catch (error) {
        console.error("Verification Error:", error);
        return NextResponse.redirect(new URL("/error?message=Terjadi kesalahan pada server", request.url));
    }
}