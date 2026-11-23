import Link from "next/link";
import { connection } from "next/server";
import { auth } from "@/auth";
import { NavbarBurgerButton } from "@/components/navbar-burger";
import Image from "next/image";
import { LogIn, Store, User } from "lucide-react";

export async function Navbar() {
  await connection();
  const session = await auth();

  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-gray-200">
      <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between gap-5">
        <div className="flex items-center gap-3 sm:gap-6">
          <NavbarBurgerButton />

          <Image
            src="/logo.svg"
            alt="Logo Minimerce"
            width={36}
            height={36}
            className="w-6 h-6 object-contain shrink-0"
            priority
          />
          <Link
            href="/#"
            className="text-lg font-bold tracking-tight text-gray-900"
          >
            Minimerce
          </Link>

          <nav aria-label="Main navigation" className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
            >
              Beranda
            </Link>

            <Link
              href="/orders"
              className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
            >
              Pesanan saya
            </Link>
          </nav>
          {session?.user && (
            <Link
              href="/profile/store"
              className="inline-flex items-center gap-2 rounded-sm bg-orange-600 hover:bg-orange-700 px-4 py-2 text-xs font-semibold text-white transition-colors "
            >
              <Store className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Kelola Toko Saya</span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {session?.user && (
            <Link
              href="/cart"
              aria-label="Buka Keranjang"
              className="inline-flex items-center gap-2 py-2 px-3.5 text-sm font-medium text-white  bg-orange-600 hover:bg-orange-700 border border-gray-200 hover:border-orange-200 rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-orange-500/20"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 shrink-0"
                aria-hidden="true"
              >
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
              <span>Keranjang</span>
            </Link>
          )}
          {session?.user ? (
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 py-2 px-3.5 text-sm font-medium text-gray-700 hover:text-orange-600 bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-200 rounded-lg transition-colors"
            >
              <User className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{session.user.name || "Profil"}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 py-2 px-4 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-orange-500/20"
            >
              <LogIn className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
