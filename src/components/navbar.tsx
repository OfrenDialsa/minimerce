import Link from "next/link";
import { connection } from "next/server";
import { auth } from "@/auth";
import { NavbarBurgerButton } from "@/components/navbar-burger";
import Image from "next/image";

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
              href="/toko"
              className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
            >
              Toko
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 py-2 px-3.5 text-sm font-medium text-gray-700 hover:text-orange-600 bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-200 rounded-lg transition-colors"
            >
              <span>{session.user.name || "Profil"}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="py-2 px-4 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-orange-500/20"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
