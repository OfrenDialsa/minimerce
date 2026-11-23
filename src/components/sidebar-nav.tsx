"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/sidebar-context";

const menuItems = [
  { href: "/", label: "Beranda" },
  { href: "/orders", label: "Pesanan saya" },
  { href: "/profile", label: "Profil" },
  { href: "/settings", label: "Setting" },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { closeSidebar } = useSidebar();

  return (
    <nav aria-label="Navigasi sidebar" className="flex flex-col gap-1">
      {menuItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={closeSidebar}
            className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              isActive
                ? "bg-orange-50 text-orange-700 border border-orange-200"
                : "text-gray-700 hover:bg-orange-50/60 hover:text-orange-700 border border-transparent"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
