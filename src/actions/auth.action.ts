"use server";

import { db } from "@/database";
import { passwordResetTokens, users, verificationTokens } from "@/database/schema";
import { and, eq, gt, isNull, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendForgotPasswordEmail, sendVerificationEmail } from "@/lib/mail";
import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function registerAction(prevState: unknown, formData: FormData) {
    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;

    if (!name || !email || !password) {
        return { error: "Semua kolom wajib diisi!" };
    }

    if (password.length < 6) {
        return { error: "Password minimal harus 6 karakter." };
    }

    let shouldRedirect = false;

    try {
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (existingUser) {
            return { error: "Email sudah terdaftar. Silakan gunakan email lain atau masuk." };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.insert(users).values({ name, email, password: hashedPassword });

        const token = crypto.randomUUID();
        const expires = new Date(Date.now() + 3600 * 1000);

        await db.insert(verificationTokens).values({ identifier: email, token, expires });
        await sendVerificationEmail(email, token);

        shouldRedirect = true;
    } catch (error) {
        console.error("Register Error:", error);
        return { error: "Terjadi kesalahan pada server. Coba beberapa saat lagi." };
    }

    if (shouldRedirect) {
        redirect(`/register/verification-sent?email=${encodeURIComponent(email)}`);
    }
}

export async function loginAction(prevState: unknown, formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Semua kolom wajib diisi!" };
    }

    try {
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!existingUser) {
            return { error: "Email tidak terdaftar!" };
        }

        if (!existingUser.password) {
            return {
                error:
                    "Akun ini terdaftar menggunakan login Google. Silakan masuk dengan Google.",
            };
        }

        if (!existingUser.emailVerified) {
            return {
                error: "Email belum diverifikasi. Silakan cek kotak masuk email Anda.",
            };
        }

        const isPasswordValid = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordValid) {
            return { error: "Email atau password salah!" };
        }

        await signIn("credentials", { email, password, redirectTo: "/" });

        return { success: true };
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Email atau password salah!" };
                default:
                    return { error: "Terjadi kesalahan saat autentikasi." };
            }
        }

        throw error;
    }
}

export async function logoutAction(redirectTo = "/login") {
    try {
        await signOut({ redirectTo });
    } catch (error) {
        if (error instanceof AuthError) {
            return { error: "Gagal keluar dari sesi. Silakan coba lagi." };
        }
        throw error;
    }
}

export type ForgotPasswordState = {
    error?: string;
    success?: string;
} | null;

export async function forgotPasswordAction(
    _prevState: ForgotPasswordState,
    formData: FormData
): Promise<ForgotPasswordState> {
    const email = (formData.get("email") as string)?.trim().toLowerCase();

    if (!email) {
        return { error: "Email wajib diisi!" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { error: "Format email tidak valid!" };
    }

    try {
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        const genericSuccessMessage =
            "Jika email terdaftar, tautan untuk mengatur ulang password telah dikirim.";

        if (!existingUser) {
            return { success: genericSuccessMessage };
        }

        if (!existingUser.password) {
            return {
                error:
                    "Akun ini menggunakan login Google dan tidak memiliki password lokal.",
            };
        }

        const now = new Date();

        await db
            .update(passwordResetTokens)
            .set({ usedAt: now })
            .where(
                and(
                    eq(passwordResetTokens.userId, existingUser.id),
                    isNull(passwordResetTokens.usedAt),
                    gt(passwordResetTokens.expiresAt, now)
                )
            );

        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = await bcrypt.hash(rawToken, 10);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await db.insert(passwordResetTokens).values({ userId: existingUser.id, token: hashedToken, expiresAt });

        const baseUrl =
            process.env.AUTH_URL ||
            process.env.NEXT_PUBLIC_APP_URL ||
            "http://localhost:3000";
        const resetUrl = `${baseUrl}/reset-password?token=${rawToken}&uid=${existingUser.publicId}`;

        if (process.env.NODE_ENV !== "production") {
            console.log("[DEV ONLY] Password reset URL:", resetUrl);
        }

        await sendForgotPasswordEmail(existingUser.email, rawToken, existingUser.publicId);

        return { success: genericSuccessMessage };
    } catch {
        return {
            error: "Terjadi kesalahan saat memproses permintaan lupa password.",
        };
    }
}

export type ResetPasswordState = {
    error?: string;
    success?: string;
} | null;

export async function resetPasswordAction(
    _prevState: ResetPasswordState,
    formData: FormData
): Promise<ResetPasswordState> {
    const token = (formData.get("token") as string)?.trim();
    const uid = (formData.get("uid") as string)?.trim();
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!token || !uid) {
        return {
            error: "Tautan reset password tidak valid atau tidak lengkap.",
        };
    }

    if (!password || !confirmPassword) {
        return { error: "Password baru dan konfirmasi password wajib diisi!" };
    }

    if (password.length < 8) {
        return { error: "Password baru minimal 8 karakter!" };
    }

    if (password !== confirmPassword) {
        return { error: "Konfirmasi password tidak cocok!" };
    }

    try {
        const targetUser = await db.query.users.findFirst({
            where: eq(users.publicId, uid),
        });

        if (!targetUser) {
            return {
                error: "Tautan reset password tidak valid atau sudah kedaluwarsa.",
            };
        }

        const now = new Date();

        const activeTokens = await db
            .select()
            .from(passwordResetTokens)
            .where(
                and(
                    eq(passwordResetTokens.userId, targetUser.id),
                    isNull(passwordResetTokens.usedAt),
                    gt(passwordResetTokens.expiresAt, now)
                )
            )
            .orderBy(desc(passwordResetTokens.createdAt));

        let matchedTokenRow: (typeof activeTokens)[number] | null = null;

        for (const row of activeTokens) {
            const isMatch = await bcrypt.compare(token, row.token);
            if (isMatch) {
                matchedTokenRow = row;
                break;
            }
        }

        if (!matchedTokenRow) {
            return {
                error: "Tautan reset password tidak valid atau sudah kedaluwarsa.",
            };
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.transaction(async (tx) => {
            await tx
                .update(users)
                .set({
                    password: hashedPassword,
                    updatedAt: now,
                })
                .where(eq(users.id, targetUser.id));

            await tx
                .update(passwordResetTokens)
                .set({ usedAt: now })
                .where(eq(passwordResetTokens.id, matchedTokenRow.id));
        });

        return {
            success:
                "Password berhasil diperbarui. Silakan login menggunakan password baru Anda.",
        };
    } catch {
        return {
            error: "Terjadi kesalahan saat mengatur ulang password.",
        };
    }
}

export type ResendVerificationState = {
    error?: string;
    success?: string;
} | null;

export async function resendVerificationEmailAction(
    _prevState: ResendVerificationState,
    formData: FormData
): Promise<ResendVerificationState> {
    const email = (formData.get("email") as string)?.trim().toLowerCase();

    if (!email) {
        return { error: "Alamat email wajib diisi untuk mengirim ulang verifikasi!" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { error: "Format email tidak valid!" };
    }

    try {
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        const genericMessage =
            "Jika email terdaftar dan belum terverifikasi, tautan verifikasi baru telah dikirim.";

        if (!existingUser) {
            return { success: genericMessage };
        }

        if (existingUser.emailVerified) {
            return {
                success: "Email ini sudah terverifikasi. Silakan langsung login.",
            };
        }

        const rawToken = crypto.randomBytes(32).toString("hex");

        const normalizedEmail = existingUser.email.trim().toLowerCase();
        const expires = new Date(Date.now() + 60 * 60 * 1000);

        await db
            .delete(verificationTokens)
            .where(eq(verificationTokens.identifier, normalizedEmail));

        await db.insert(verificationTokens).values({
            identifier: normalizedEmail,
            token: rawToken,
            expires,
        });

        await sendVerificationEmail(existingUser.email, rawToken);

        return { success: "Tautan verifikasi baru telah dikirim ke email Anda. Periksa kotak masuk atau folder Spam." };
    } catch {
        return { error: "Gagal mengirim ulang email verifikasi. Silakan coba lagi." };
    }
}
