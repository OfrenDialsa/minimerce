"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { OrderSummaryItem } from "@/actions/order.action";

interface OrdersByStatusViewProps {
  orders: OrderSummaryItem[];
  detailBasePath?: "/orders" | "/profile/store/orders";
}

const KNOWN_STATUS_ORDER = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
];

const STATUS_META: Record<
  string,
  { label: string; badgeClass: string; borderClass: string }
> = {
  PENDING: {
    label: "Menunggu Konfirmasi",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
    borderClass: "border-l-amber-500",
  },
  CONFIRMED: {
    label: "Dikonfirmasi",
    badgeClass: "border-sky-200 bg-sky-50 text-sky-800",
    borderClass: "border-l-sky-500",
  },
  PROCESSING: {
    label: "Diproses",
    badgeClass: "border-indigo-200 bg-indigo-50 text-indigo-800",
    borderClass: "border-l-indigo-500",
  },
  SHIPPED: {
    label: "Dikirim",
    badgeClass: "border-orange-200 bg-orange-50 text-[#ee4d2d]",
    borderClass: "border-l-[#ee4d2d]",
  },
  COMPLETED: {
    label: "Selesai",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
    borderClass: "border-l-emerald-600",
  },
  CANCELLED: {
    label: "Dibatalkan",
    badgeClass: "border-red-200 bg-red-50 text-red-700",
    borderClass: "border-l-red-500",
  },
};

function getStatusMeta(status: string) {
  const normalized = status.trim().toUpperCase();
  return (
    STATUS_META[normalized] ?? {
      label: status,
      badgeClass: "border-gray-200 bg-gray-100 text-gray-800",
      borderClass: "border-l-gray-500",
    }
  );
}

function formatDateId(dateInput: Date | string) {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function OrdersByStatusView({
  orders,
  detailBasePath,
}: OrdersByStatusViewProps) {
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  const groupedByStatus = useMemo(() => {
    const map = new Map<string, OrderSummaryItem[]>();
    for (const order of orders) {
      const key = (order.status || "PENDING").trim().toUpperCase();
      const list = map.get(key) ?? [];
      list.push(order);
      map.set(key, list);
    }

    const orderedKeys: string[] = [];
    for (const known of KNOWN_STATUS_ORDER) {
      if (map.has(known)) orderedKeys.push(known);
    }
    for (const key of map.keys()) {
      if (!orderedKeys.includes(key)) orderedKeys.push(key);
    }

    return orderedKeys.map((statusKey) => ({
      statusKey,
      meta: getStatusMeta(statusKey),
      items: map.get(statusKey) ?? [],
    }));
  }, [orders]);

  const visibleGroups = useMemo(() => {
    if (activeFilter === "ALL") return groupedByStatus;
    return groupedByStatus.filter((group) => group.statusKey === activeFilter);
  }, [activeFilter, groupedByStatus]);

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <h2 className="text-base font-semibold text-gray-900">
          Belum ada pesanan
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          Pesanan yang kamu buat dari keranjang akan muncul di sini dan
          dikelompokkan berdasarkan statusnya.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Link
            href="/cart"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Buka Keranjang
          </Link>
          <Link
            href="/home"
            className="rounded-lg bg-[#ee4d2d] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#d94122]"
          >
            Belanja Sekarang
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tab per Status */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveFilter("ALL")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            activeFilter === "ALL"
              ? "bg-[#ee4d2d] text-white"
              : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Semua ({orders.length})
        </button>

        {groupedByStatus.map((group) => {
          const isSelected = activeFilter === group.statusKey;
          return (
            <button
              key={group.statusKey}
              type="button"
              onClick={() => setActiveFilter(group.statusKey)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                isSelected
                  ? "bg-[#ee4d2d] text-white"
                  : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {group.meta.label} ({group.items.length})
            </button>
          );
        })}
      </div>

      {/* Daftar Pesanan Dikelompokkan per Status */}
      <div className="space-y-8">
        {visibleGroups.map((group) => (
          <section key={group.statusKey} className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm font-bold text-gray-900">
                  {group.meta.label}
                </h2>
                <span
                  className={`rounded-xs border px-2 py-0.5 text-[11px] font-semibold ${group.meta.badgeClass}`}
                >
                  {group.statusKey}
                </span>
              </div>
              <span className="text-xs font-medium text-gray-500">
                {group.items.length} pesanan
              </span>
            </div>

            <div className="space-y-3">
              {group.items.map((order) => {
                const extraItemsCount = Math.max(0, order.itemCount - 1);

                return (
                  <div
                    key={order.publicId}
                    className={`rounded-lg border border-gray-200 border-l-4 ${group.meta.borderClass} bg-white p-4 transition-colors hover:border-gray-300`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/store/${order.storeSlug}`}
                          className="font-semibold text-gray-900 hover:text-[#ee4d2d]"
                        >
                          {order.storeName}
                        </Link>
                        <span className="text-gray-300">•</span>
                        <span className="font-mono text-[11px] text-gray-500">
                          #{order.publicId}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-500">
                          {formatDateId(order.createdAt)}
                        </span>
                        <span
                          className={`rounded-xs border px-2 py-0.5 text-[11px] font-semibold ${group.meta.badgeClass}`}
                        >
                          {group.meta.label}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {order.firstProductName ?? "Produk Pesanan"}
                          {extraItemsCount > 0 && (
                            <span className="ml-1.5 text-xs font-normal text-gray-500">
                              +{extraItemsCount} produk lainnya
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Total kuantitas: {order.totalQuantity} unit (
                          {order.itemCount} jenis produk)
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <div className="text-left sm:text-right">
                          <p className="text-[11px] text-gray-500">
                            Total Belanja
                          </p>
                          <p className="text-sm font-bold text-[#ee4d2d]">
                            Rp {order.totalAmount.toLocaleString("id-ID")}
                          </p>
                        </div>

                        <Link
                          href={`${detailBasePath}/${order.publicId}`}
                          className="shrink-0 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-800 transition-colors hover:border-[#ee4d2d] hover:text-[#ee4d2d]"
                        >
                          Lihat Detail
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
