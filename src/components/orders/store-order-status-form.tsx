"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatusAction } from "@/actions/order.action";
import {
  ORDER_STATUS_OPTIONS,
  type OrderStatusValue,
} from "@/lib/order-status";

interface StoreOrderStatusFormProps {
  orderPublicId: string;
  currentStatus: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Menunggu Konfirmasi (PENDING)",
  CONFIRMED: "Dikonfirmasi (CONFIRMED)",
  PROCESSING: "Diproses (PROCESSING)",
  SHIPPED: "Dikirim (SHIPPED)",
  COMPLETED: "Selesai (COMPLETED)",
  CANCELLED: "Dibatalkan (CANCELLED)",
};

export function StoreOrderStatusForm({
  orderPublicId,
  currentStatus,
}: StoreOrderStatusFormProps) {
  const router = useRouter();
  const normalizedCurrent = currentStatus.trim().toUpperCase();
  const initialValue: OrderStatusValue = ORDER_STATUS_OPTIONS.includes(
    normalizedCurrent as OrderStatusValue,
  )
    ? (normalizedCurrent as OrderStatusValue)
    : "PENDING";

  const [selectedStatus, setSelectedStatus] =
    useState<OrderStatusValue>(initialValue);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      try {
        const result = await updateOrderStatusAction(
          orderPublicId,
          selectedStatus,
        );
        if (!result.ok) {
          setFeedback({ type: "error", text: result.error });
          return;
        }
        setFeedback({ type: "success", text: result.message });
        router.refresh();
      } catch {
        setFeedback({
          type: "error",
          text: "Gagal memperbarui status pesanan.",
        });
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-gray-200 bg-white p-5 space-y-3.5"
    >
      <div>
        <h2 className="text-sm font-semibold text-gray-900">
          Update Status Pesanan
        </h2>
        <p className="mt-0.5 text-xs text-gray-500">
          Periksa bukti pembayaran pembeli sebelum mengonfirmasi atau memproses
          pesanan.
        </p>
      </div>

      <div>
        <label
          htmlFor="orderStatusSelect"
          className="block text-xs font-medium text-gray-700"
        >
          Status Baru
        </label>
        <select
          id="orderStatusSelect"
          value={selectedStatus}
          disabled={isPending}
          onChange={(e) =>
            setSelectedStatus(e.target.value as OrderStatusValue)
          }
          className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-900 focus:border-[#ee4d2d] focus:outline-none disabled:opacity-50"
        >
          {ORDER_STATUS_OPTIONS.map((statusOption) => (
            <option key={statusOption} value={statusOption}>
              {STATUS_LABELS[statusOption] ?? statusOption}
            </option>
          ))}
        </select>
      </div>

      {feedback && (
        <div
          className={`rounded-lg border px-3 py-2 text-xs ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || selectedStatus === normalizedCurrent}
        className="w-full rounded-lg bg-[#ee4d2d] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#d94122] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Menyimpan Status..." : "Simpan Status Pesanan"}
      </button>
    </form>
  );
}
