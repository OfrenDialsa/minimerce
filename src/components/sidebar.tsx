import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { auth } from "@/auth";
import { SidebarNav } from "@/components/sidebar-nav";
import { LogoutButton } from "@/components/auth/logout-button";

export async function Sidebar() {
  await connection();
  const session = await auth();

  return (
    <aside className="min-h-full w-full bg-white text-gray-900 p-4 flex flex-col justify-between gap-6">
      <div>
        <div className="px-2 pb-4 mb-4 border-b border-gray-100">
          <Link
            href="/"
            className="inline-flex items-center gap-3 group focus:outline-none"
          >
            <Image
              src="/logo.svg"
              alt="Logo Minimerce"
              width={36}
              height={36}
              className="w-9 h-9 object-contain shrink-0"
              priority
            />
            <span className="text-lg font-bold tracking-tight text-gray-900 group-hover:text-orange-600 transition-colors">
              Minimerce
            </span>
          </Link>
        </div>

        <SidebarNav />
      </div>

      <div className="pt-4 border-t border-gray-200 flex flex-col">
        {session?.user ? (
          <LogoutButton />
        ) : (
          <div className="px-3 py-2 text-sm text-gray-700 flex items-center justify-between gap-2">
            <span>Silakan login</span>
            <Link
              href="/login"
              className="font-medium text-orange-600 hover:text-orange-700 underline"
            >
              Login
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
