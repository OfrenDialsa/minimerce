"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { confirmOrderReceivedAction } from "@/actions/order.action";

interface ConfirmOrderReceivedButtonProps {
  orderPublicId: string;
}

export function ConfirmOrderReceivedButton({
  orderPublicId,
}: ConfirmOrderReceivedButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function handleConfirmReceived() {
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await confirmOrderReceivedAction(orderPublicId);
      if (!res.ok) {
        setErrorMessage(res.error);
        return;
      }

      setSuccessMessage(res.message);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={isPending}
        onClick={handleConfirmReceived}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#ee4d2d] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#d94122] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{isPending ? "Mengonfirmasi..." : "Pesanan Sudah Diterima"}</span>
      </button>

      {errorMessage && <p className="text-xs text-red-600">{errorMessage}</p>}
      {successMessage && (
        <p className="text-xs text-emerald-700">{successMessage}</p>
      )}
    </div>
  );
}
