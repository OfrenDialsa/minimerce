import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getStoreOrdersAction } from "@/actions/order.action";
import { OrdersByStatusView } from "@/components/orders/orders-by-status-view";

async function StoreOrdersListContent() {
  await connection();
  const result = await getStoreOrdersAction();

  if (!result.ok) {
    if (result.reason === "UNAUTHENTICATED") {
      redirect("/login");
    }

    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700">
        {result.message}
      </div>
    );
  }

  if (!result.store) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <h2 className="text-base font-semibold text-gray-900">
          Kamu belum memiliki toko
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          Buat toko terlebih dahulu untuk menerima dan mengelola pesanan masuk.
        </p>
        <Link
          href="/home"
          className="mt-4 inline-flex rounded-lg bg-[#ee4d2d] px-4 py-2 text-xs font-semibold text-white hover:bg-[#d94122]"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-orange-50/40 px-4 py-3 text-xs">
        <div>
          <span className="text-gray-600">Toko Aktif: </span>
          <span className="font-bold text-gray-900">{result.store.name}</span>
          <span className="ml-2 font-mono text-[11px] text-gray-500">
            (/store/{result.store.slug})
          </span>
        </div>
        <Link
          href={`/store/${result.store.slug}`}
          className="font-semibold text-[#ee4d2d] hover:underline"
        >
          Lihat Halaman Toko →
        </Link>
      </div>

      <OrdersByStatusView
        orders={result.orders}
        detailBasePath="/profile/store/orders"
      />
    </div>
  );
}

function StoreOrdersFallback() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 text-xs text-gray-500">
      Memuat pesanan masuk toko...
    </div>
  );
}

export default function StoreOrdersPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Pesanan Masuk Toko</h1>
        <p className="mt-1 text-xs text-gray-500">
          Kelola pesanan pelanggan yang masuk ke tokomu berdasarkan statusnya.
        </p>
      </div>

      <Suspense fallback={<StoreOrdersFallback />}>
        <StoreOrdersListContent />
      </Suspense>
    </div>
  );
}
