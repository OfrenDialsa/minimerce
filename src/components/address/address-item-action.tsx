"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteAddressAction,
  setDefaultUserAddressAction,
  setStoreActiveAddressAction,
} from "@/actions/address.action";

type PendingType = "user-default" | "store-active" | "delete" | null;

export function AddressItemActions({
  addressId,
  isDefault,
  hasStore = false,
  isStoreActive = false,
}: {
  addressId: number;
  isDefault: boolean;
  hasStore?: boolean;
  isStoreActive?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingType, setPendingType] = useState<PendingType>(null);
  const [openTargetPopup, setOpenTargetPopup] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

  function handleSetDefaultUser() {
    setMessageError(null);
    setPendingType("user-default");
    startTransition(async () => {
      try {
        const res = await setDefaultUserAddressAction(addressId);
        if (res?.error) {
          setMessageError(res.error);
          return;
        }
        setOpenTargetPopup(false);
        router.refresh();
      } finally {
        setPendingType(null);
      }
    });
  }

  function handleSetStoreAddress() {
    setMessageError(null);
    setPendingType("store-active");
    startTransition(async () => {
      try {
        const res = await setStoreActiveAddressAction(addressId);
        if (res?.error) {
          setMessageError(res.error);
          return;
        }
        setOpenTargetPopup(false);
        router.refresh();
      } finally {
        setPendingType(null);
      }
    });
  }

  function handleMainSetDefaultClick() {
    if (!hasStore) {
      handleSetDefaultUser();
      return;
    }
    setMessageError(null);
    setOpenTargetPopup((prev) => !prev);
  }

  function handleDelete() {
    setMessageError(null);
    setPendingType("delete");
    startTransition(async () => {
      try {
        const res = await deleteAddressAction(addressId);
        if (res?.error) {
          setMessageError(res.error);
          setConfirmDelete(false);
          return;
        }
        setConfirmDelete(false);
        router.refresh();
      } finally {
        setPendingType(null);
      }
    });
  }

  const canSetAnyDefault = hasStore ? !isDefault || !isStoreActive : !isDefault;

  return (
    <div className="relative flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        {canSetAnyDefault && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleMainSetDefaultClick}
            className="border border-[#ee4d2d] bg-orange-50/60 px-3 py-1.5 text-xs font-semibold text-[#ee4d2d] transition-colors hover:bg-orange-100/70 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending &&
            (pendingType === "user-default" || pendingType === "store-active")
              ? "Memproses..."
              : "Atur Utama"}
          </button>
        )}

        {!confirmDelete ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setOpenTargetPopup(false);
              setConfirmDelete(true);
            }}
            className="border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hapus
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isPending}
              onClick={handleDelete}
              className="bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending && pendingType === "delete"
                ? "Menghapus..."
                : "Konfirmasi Hapus"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setConfirmDelete(false)}
              className="border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
            >
              Batal
            </button>
          </div>
        )}
      </div>

      {/* Popup Pilihan Target: Halaman Akun (Profil) atau Toko */}
      {hasStore && openTargetPopup && (
        <div
          role="dialog"
          aria-label="Pilih target alamat utama"
          className="z-20 w-64 border border-gray-200 bg-white p-3 shadow-md sm:mt-1"
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="text-xs font-semibold text-gray-900">
              Atur Sebagai Utama Untuk
            </span>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setOpenTargetPopup(false)}
              className="text-xs text-gray-400 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="mt-2.5 flex flex-col gap-1.5">
            {!isDefault && (
              <button
                type="button"
                disabled={isPending}
                onClick={handleSetDefaultUser}
                className="flex w-full items-center justify-between border border-gray-200 bg-white px-3 py-2 text-left text-xs font-medium text-gray-800 transition-colors hover:border-[#ee4d2d] hover:bg-orange-50/40 disabled:opacity-60"
              >
                <span>Alamat Utama Akun</span>
                <span className="text-[11px] font-semibold text-[#ee4d2d]">
                  {isPending && pendingType === "user-default"
                    ? "Menyimpan..."
                    : "Pilih"}
                </span>
              </button>
            )}

            {!isStoreActive && (
              <button
                type="button"
                disabled={isPending}
                onClick={handleSetStoreAddress}
                className="flex w-full items-center justify-between border border-gray-200 bg-white px-3 py-2 text-left text-xs font-medium text-gray-800 transition-colors hover:border-emerald-600 hover:bg-emerald-50/40 disabled:opacity-60"
              >
                <span>Alamat Toko</span>
                <span className="text-[11px] font-semibold text-emerald-700">
                  {isPending && pendingType === "store-active"
                    ? "Menyimpan..."
                    : "Pilih"}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {messageError && (
        <p className="text-xs font-medium text-red-600">{messageError}</p>
      )}
    </div>
  );
}
