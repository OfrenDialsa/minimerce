import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/database";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
    session: { strategy: "jwt" },
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            profile(profile) {
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                    emailVerified: profile.email_verified ? new Date() : null,
                };
            },
        }),
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email dan password wajib diisi.");
                }

                const user = await db.query.users.findFirst({
                    where: eq(users.email, credentials.email as string),
                });

                if (!user || !user.password) {
                    throw new Error("Email tidak terdaftar.");
                }

                if (!user.emailVerified) {
                    throw new Error("Silakan verifikasi email Anda terlebih dahulu.");
                }

                const passwordsMatch = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!passwordsMatch) {
                    throw new Error("Password salah.");
                }

                return {
                    id: String(user.id),
                    name: user.name,
                    email: user.email,
                };
            }
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google" && user.email) {
                const existing = await db.query.users.findFirst({
                    where: eq(users.email, user.email.toLowerCase()),
                });

                if (!existing) {
                    await db.insert(users).values({
                        name: user.name ?? user.email.split("@")[0],
                        email: user.email.toLowerCase(),
                        avatarUrl: user.image ?? null,
                        emailVerified: new Date(),
                    });
                }
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user?.email) {
                const dbUser = await db.query.users.findFirst({
                    where: eq(users.email, user.email.toLowerCase()),
                });
                if (dbUser) {
                    token.uid = dbUser.id;
                    token.publicId = dbUser.publicId;
                    token.role = dbUser.role ?? "user";
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = String(token.uid ?? "");
                (session.user as { publicId?: string }).publicId = token.publicId as string;
                (session.user as { role?: string }).role = (token.role as string) ?? "user";
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
});