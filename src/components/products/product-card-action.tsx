"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteProductAction,
  toggleArchiveProductAction,
} from "@/actions/products.action";

export function ProductCardActions({
  productId,
  isArchived,
}: {
  productId: number;
  isArchived: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleToggleArchive() {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await toggleArchiveProductAction(productId, !isArchived);
      if (res?.error) {
        setErrorMsg(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDelete() {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await deleteProductAction(productId);
      if (res?.error) {
        setErrorMsg(res.error);
        setConfirmDelete(false);
        return;
      }
      setConfirmDelete(false);
      router.refresh();
    });
  }

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={handleToggleArchive}
          className="border border-gray-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 transition-colors hover:border-[#ee4d2d] hover:text-[#ee4d2d] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Memproses..." : isArchived ? "Tampilkan" : "Arsipkan"}
        </button>

        {!confirmDelete ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => setConfirmDelete(true)}
            className="border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hapus
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={isPending}
              onClick={handleDelete}
              className="bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              {isPending ? "Menghapus..." : "Ya, Hapus"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setConfirmDelete(false)}
              className="border border-gray-300 bg-white px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
            >
              Batal
            </button>
          </div>
        )}
      </div>

      {errorMsg && (
        <p className="mt-1.5 text-[11px] font-medium text-red-600">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
