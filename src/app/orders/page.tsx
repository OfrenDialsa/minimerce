import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getMyOrdersAction } from "@/actions/order.action";
import { OrdersByStatusView } from "@/components/orders/orders-by-status-view";

async function OrdersListContent() {
  await connection();
  const result = await getMyOrdersAction();

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

  return <OrdersByStatusView orders={result.orders} detailBasePath="/orders" />;
}

function OrdersListFallback() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 text-xs text-gray-500">
      Memuat daftar pesanan...
    </div>
  );
}

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Daftar Pesanan</h1>
        <p className="mt-1 text-xs text-gray-500">
          Riwayat pesanan kamu yang dikelompokkan berdasarkan status transaksi.
        </p>
      </div>

      <Suspense fallback={<OrdersListFallback />}>
        <OrdersListContent />
      </Suspense>
    </div>
  );
}
