import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { getOrderByPublicId } from "@/actions/order.action";
import { PaymentProofForm } from "@/components/orders/payment-proof-form";
import { ConfirmOrderReceivedButton } from "@/components/orders/confirm-order-button";

interface OrderDetailPageProps {
  params: Promise<{ publicId: string }>;
}

const STATUS_META: Record<string, { label: string; badgeClass: string }> = {
  PENDING: {
    label: "Menunggu Konfirmasi",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
  },
  CONFIRMED: {
    label: "Dikonfirmasi",
    badgeClass: "border-sky-200 bg-sky-50 text-sky-800",
  },
  PROCESSING: {
    label: "Diproses",
    badgeClass: "border-indigo-200 bg-indigo-50 text-indigo-800",
  },
  SHIPPED: {
    label: "Dikirim",
    badgeClass: "border-orange-200 bg-orange-50 text-[#ee4d2d]",
  },
  COMPLETED: {
    label: "Selesai",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  CANCELLED: {
    label: "Dibatalkan",
    badgeClass: "border-red-200 bg-red-50 text-red-700",
  },
};

function getStatusMeta(status: string) {
  const normalized = status.trim().toUpperCase();
  return (
    STATUS_META[normalized] ?? {
      label: status,
      badgeClass: "border-gray-200 bg-gray-100 text-gray-800",
    }
  );
}

function formatDateId(dateInput: Date | string) {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function isSafeImageSrc(url: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith("/") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://")
  );
}

async function OrderDetailContent({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  await connection();

  const result = await getOrderByPublicId(publicId);

  if (!result.ok) {
    if (result.reason === "UNAUTHENTICATED") {
      redirect("/login");
    }

    if (result.reason === "NOT_FOUND") {
      notFound();
    }

    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <h2 className="font-semibold">Akses Ditolak</h2>
        <p className="mt-1 text-xs">{result.message}</p>
        <Link
          href="/orders"
          className="mt-4 inline-flex items-center rounded-lg border border-red-300 bg-white px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
        >
          Kembali ke Daftar Pesanan
        </Link>
      </div>
    );
  }

  const { order, shippingAddress, items, role } = result;
  const statusMeta = getStatusMeta(order.status);
  const normalizedStatus = order.status.trim().toUpperCase();
  const canConfirmReceived = role === "buyer" && normalizedStatus === "SHIPPED";

  return (
    <div className="space-y-6">
      {/* Header Status & ID Pesanan */}
      <div className="flex flex-col justify-between gap-4 rounded-lg border border-gray-200 bg-white p-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-xs border px-2.5 py-0.5 text-[11px] font-semibold ${statusMeta.badgeClass}`}
            >
              {statusMeta.label}
            </span>
            <span className="rounded-xs border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600">
              {role === "buyer" ? "Pembeli" : "Penjual"}
            </span>
          </div>

          <h1 className="mt-2 text-lg font-bold text-gray-900 sm:text-xl">
            Pesanan #{order.publicId}
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            Dibuat pada {formatDateId(order.createdAt)} • Toko:{" "}
            <Link
              href={`/store/${order.storeSlug}`}
              className="font-semibold text-[#ee4d2d] hover:underline"
            >
              {order.storeName}
            </Link>
          </p>
        </div>

        <Link
          href="/orders"
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          ← Kembali ke Daftar Pesanan
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Daftar Produk dalam Pesanan */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-gray-900">
                Produk Dipesan ({items.length} jenis)
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {items.map((item) => {
                const showImg = isSafeImageSrc(item.imageUrl);

                return (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4 p-4 sm:p-5"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                        {showImg && item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.productName}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-orange-50 text-xs font-bold text-[#ee4d2d]">
                            {item.productName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div>
                        <Link
                          href={`/store/${order.storeSlug}/products/${item.productSlug}`}
                          className="text-sm font-semibold text-gray-900 hover:text-[#ee4d2d]"
                        >
                          {item.productName}
                        </Link>
                        <p className="mt-1 text-xs text-gray-500">
                          Harga saat beli: Rp{" "}
                          {item.priceAtPurchase.toLocaleString("id-ID")} ×{" "}
                          {item.quantity}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        Rp {item.subtotal.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <PaymentProofForm
            orderPublicId={order.publicId}
            currentProofUrl={order.paymentProofUrl}
            currentNotes={order.paymentNotes}
            currentUploadedAt={order.paymentUploadedAt}
            canUpload={
              role === "buyer" &&
              order.status.trim().toUpperCase() === "PENDING"
            }
          />
        </div>

        <div className="space-y-5 h-fit">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900">
              Alamat Pengiriman
            </h2>

            {shippingAddress ? (
              <div className="mt-3 space-y-1.5 text-xs text-gray-700">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-gray-900">
                    {shippingAddress.label}
                  </span>
                  <span>•</span>
                  <span className="font-medium text-gray-800">
                    {shippingAddress.recipientName}
                  </span>
                  <span>•</span>
                  <span>{shippingAddress.phone}</span>
                </div>
                <p className="pt-1 text-xs font-medium text-gray-900">
                  {shippingAddress.addressLine}
                </p>
                <p className="text-[11px] text-gray-500">
                  {[
                    shippingAddress.village
                      ? `Desa/Kel. ${shippingAddress.village}`
                      : null,
                    shippingAddress.district
                      ? `Kec. ${shippingAddress.district}`
                      : null,
                    shippingAddress.city,
                    shippingAddress.province,
                    shippingAddress.postalCode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            ) : (
              <p className="mt-3 rounded-lg border border-dashed border-gray-300 p-3 text-xs text-gray-500">
                Data alamat pengiriman tidak tersedia atau sudah dihapus dari
                daftar alamat.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900">
              Ringkasan Pembayaran
            </h2>

            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between text-gray-600">
                <dt>Status</dt>
                <dd className="font-semibold text-gray-900">
                  {statusMeta.label}
                </dd>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <dt>Total Kuantitas</dt>
                <dd className="font-medium text-gray-900">
                  {items.reduce((sum, item) => sum + item.quantity, 0)} unit
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-3 text-sm font-bold text-gray-900">
                <dt>Total Pembayaran</dt>
                <dd className="text-[#ee4d2d]">
                  Rp {order.totalAmount.toLocaleString("id-ID")}
                </dd>
              </div>
            </dl>
            {canConfirmReceived && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <ConfirmOrderReceivedButton orderPublicId={order.publicId} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderDetailFallback() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 text-xs text-gray-500">
      Memuat detail pesanan...
    </div>
  );
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <Suspense fallback={<OrderDetailFallback />}>
        <OrderDetailContent params={params} />
      </Suspense>
    </div>
  );
}
