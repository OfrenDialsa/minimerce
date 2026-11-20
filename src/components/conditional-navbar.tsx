"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

const HIDDEN_NAVBAR_PATHS = [
  "/login",
  // tambahkan path lain jika ingin disembunyikan juga, misal:
  "/register",
  "/forgot-password",
  "/reset-password",
];

export function ConditionalNavbar({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (HIDDEN_NAVBAR_PATHS.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
