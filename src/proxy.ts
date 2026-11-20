import { NextResponse } from "next/server";
import { auth } from "@/auth";

const AUTH_ROUTES = [
    "/login",
    "/register",
    "/register/verification-sent",
    "/forgot-password",
    "/reset-password",
];

export default auth((req) => {
    const isLoggedIn = Boolean(req.auth);
    const { pathname } = req.nextUrl;

    const isProtectedRoute =
        pathname.startsWith("/settings") ||
        pathname.startsWith("/profile");

    const isAuthRoute = AUTH_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isProtectedRoute && !isLoggedIn) {
        return NextResponse.redirect(new URL("/login", req.nextUrl));
    }

    if (isAuthRoute && isLoggedIn) {
        return NextResponse.redirect(new URL("/", req.nextUrl));
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        "/settings",
        "/settings/:path*",
        "/profile",
        "/profile/:path*",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
    ],
};