"use client";

import type { ReactNode } from "react";
import { useSidebar } from "@/components/sidebar-context";

export function SidebarDrawer({ children }: { children: ReactNode }) {
  const { isOpen, closeSidebar } = useSidebar();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        onClick={closeSidebar}
        aria-hidden="true"
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
      />

      <div className="fixed inset-y-0 left-0 z-10 w-72 max-w-[85vw] bg-white text-gray-900 border-r border-gray-200 shadow-2xl overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
