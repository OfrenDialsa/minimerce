"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteStoreAction } from "@/actions/store.action";

type DeleteStoreButtonProps = {
  storeId: number;
  storeName: string;
};

export function DeleteStoreButton({
  storeId,
  storeName,
}: DeleteStoreButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirmDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deleteStoreAction(storeId);
      if (res.error) {
        setError(res.error);
        return;
      }

      setOpen(false);
      router.push("/store/create");
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
      >
        Hapus Toko
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-store-modal-title"
        >
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <h2
              id="delete-store-modal-title"
              className="text-lg font-semibold text-gray-900"
            >
              Hapus Toko?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Apakah kamu yakin ingin menghapus toko{" "}
              <span className="font-semibold text-gray-900">{storeName}</span>?
              Tindakan ini tidak dapat dibatalkan.
            </p>

            {error && (
              <div
                role="alert"
                className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800"
              >
                {error}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setOpen(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Tidak
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? "Menghapus..." : "Iya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
