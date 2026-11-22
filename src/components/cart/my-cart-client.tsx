"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { createOrderFromCartAction } from "@/actions/order.action";

export interface CartListItem {
  id: number;
  publicId: string;
  userId: number;
  storeId: number;
  storeName: string;
  storeSlug: string;
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  updatedAt: Date | string;
}

export interface CartAddressItem {
  id: number;
  label: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  village: string | null;
  district: string | null;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

interface MyCartClientProps {
  items: CartListItem[];
  userAddresses: CartAddressItem[];
}

export function MyCartClient({ items, userAddresses }: MyCartClientProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>(() =>
    items.map((item) => item.id),
  );

  const defaultAddress =
    userAddresses.find((addr) => addr.isDefault) ?? userAddresses[0];
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    defaultAddress ? String(defaultAddress.id) : "",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(item.id)),
    [items, selectedIds],
  );

  const hasMixedStores = useMemo(() => {
    if (selectedItems.length <= 1) return false;
    const firstStoreId = selectedItems[0].storeId;
    return selectedItems.some((item) => item.storeId !== firstStoreId);
  }, [selectedItems]);

  const totalAmount = useMemo(
    () =>
      selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [selectedItems],
  );

  const chosenAddress = userAddresses.find(
    (addr) => String(addr.id) === selectedAddressId,
  );

  function toggleItem(id: number) {
    setErrorMessage(null);
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id],
    );
  }

  function toggleAll() {
    setErrorMessage(null);
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((item) => item.id));
    }
  }

  function handleSubmit(formData: FormData) {
    setErrorMessage(null);

    if (selectedIds.length === 0) {
      setErrorMessage("Pilih minimal satu produk untuk dibuatkan pesanan.");
      return;
    }

    if (hasMixedStores) {
      setErrorMessage(
        "Item yang dipilih berasal dari toko berbeda. Pilih produk dari satu toko saja.",
      );
      return;
    }

    if (!selectedAddressId) {
      setErrorMessage("Silakan pilih alamat pengiriman terlebih dahulu.");
      return;
    }

    startTransition(async () => {
      try {
        await createOrderFromCartAction(formData);
      } catch (err) {
        if (err instanceof Error && err.message === "NEXT_REDIRECT") {
          throw err;
        }
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Gagal membuat pesanan. Silakan coba lagi.",
        );
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <h2 className="text-base font-semibold text-gray-900">
          Keranjang belanja masih kosong
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          Produk yang kamu masukkan ke keranjang akan muncul di sini sebelum
          dibuatkan pesanan.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center rounded-lg bg-[#ee4d2d] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#d94122]"
        >
          Mulai Belanja
        </Link>
      </div>
    );
  }

  return (
    <form
      action={handleSubmit}
      className="grid grid-cols-1 gap-6 lg:grid-cols-3"
    >
      <div className="space-y-4 lg:col-span-2">
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs">
          <label className="inline-flex cursor-pointer items-center gap-2.5 font-medium text-gray-900">
            <input
              type="checkbox"
              checked={items.length > 0 && selectedIds.length === items.length}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-gray-300 accent-[#ee4d2d]"
            />
            <span>Pilih Semua ({items.length} produk)</span>
          </label>
          <span className="text-gray-500">
            Terpilih:{" "}
            <strong className="text-gray-900">{selectedIds.length}</strong>
          </span>
        </div>

        <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
          {items.map((item) => {
            const isChecked = selectedIds.includes(item.id);
            const subtotal = item.price * item.quantity;

            return (
              <div
                key={item.id}
                className="flex items-start justify-between gap-4 p-4"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="cartItemIds"
                    value={String(item.id)}
                    checked={isChecked}
                    disabled={isPending}
                    onChange={() => toggleItem(item.id)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 accent-[#ee4d2d]"
                  />
                  <div>
                    <Link
                      href={`/store/${item.storeSlug}`}
                      className="text-[11px] font-semibold text-[#ee4d2d] hover:underline"
                    >
                      {item.storeName}
                    </Link>
                    <p className="mt-0.5 text-sm font-semibold text-gray-900">
                      {item.productName}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Rp {item.price.toLocaleString("id-ID")} × {item.quantity}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">
                    Rp {subtotal.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-5 h-fit">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Alamat Pengiriman
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Pilih alamat tersimpan sebelum membuat pesanan.
              </p>
            </div>
            <Link
              href="/addresses/create"
              className="shrink-0 text-xs font-semibold text-[#ee4d2d] hover:underline"
            >
              + Buat Alamat
            </Link>
          </div>

          <div>
            <label
              htmlFor="addressId"
              className="block text-xs font-medium text-gray-700"
            >
              Alamat Tersimpan
            </label>
            <select
              id="addressId"
              name="addressId"
              value={selectedAddressId}
              disabled={isPending || userAddresses.length === 0}
              onChange={(e) => {
                setErrorMessage(null);
                setSelectedAddressId(e.target.value);
              }}
              className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-black focus:outline-none disabled:bg-gray-100"
            >
              <option value="">
                {userAddresses.length === 0
                  ? "Belum ada alamat tersimpan"
                  : "-- Pilih alamat pengiriman --"}
              </option>
              {userAddresses.map((addr) => (
                <option key={addr.id} value={String(addr.id)}>
                  {addr.label} — {addr.recipientName} ({addr.city},{" "}
                  {addr.postalCode}){addr.isDefault ? " [Utama]" : ""}
                </option>
              ))}
            </select>
          </div>

          {chosenAddress ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-3.5 text-xs text-gray-700">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-gray-900">
                  {chosenAddress.label}
                </span>
                {chosenAddress.isDefault && (
                  <span className="rounded-xs border border-[#ee4d2d]/30 bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#ee4d2d]">
                    Utama
                  </span>
                )}
                <span>•</span>
                <span className="font-medium text-gray-800">
                  {chosenAddress.recipientName}
                </span>
                <span>•</span>
                <span>{chosenAddress.phone}</span>
              </div>
              <p className="mt-1.5 text-xs font-medium text-gray-900">
                {chosenAddress.addressLine}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-500">
                {[
                  chosenAddress.village
                    ? `Desa/Kel. ${chosenAddress.village}`
                    : null,
                  chosenAddress.district
                    ? `Kec. ${chosenAddress.district}`
                    : null,
                  chosenAddress.city,
                  chosenAddress.province,
                  chosenAddress.postalCode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 p-3.5 text-xs text-gray-500">
              Belum ada alamat yang dipilih.{" "}
              <Link
                href="/addresses/create"
                className="font-semibold text-[#ee4d2d] hover:underline"
              >
                Tambah alamat baru
              </Link>{" "}
              terlebih dahulu.
            </div>
          )}
        </div>

        <div className="space-y-2 border-t border-gray-200 pt-4 text-xs">
          <div className="flex items-center justify-between text-gray-600">
            <span>Item Terpilih</span>
            <span>{selectedItems.length} barang</span>
          </div>
          <div className="flex items-center justify-between text-sm font-bold text-gray-900">
            <span>Total Pesanan</span>
            <span className="text-[#ee4d2d]">
              Rp {totalAmount.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {hasMixedStores && (
          <p className="text-xs font-medium text-amber-700">
            Pilih produk dari satu toko yang sama untuk membuat pesanan.
          </p>
        )}

        {errorMessage && (
          <p className="text-xs font-medium text-red-600">{errorMessage}</p>
        )}

        <button
          type="submit"
          disabled={
            isPending ||
            selectedIds.length === 0 ||
            hasMixedStores ||
            !selectedAddressId
          }
          className="w-full rounded-lg bg-[#ee4d2d] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#d94122] disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isPending ? "Membuat Pesanan..." : "Buat Pesanan"}
        </button>
      </div>
    </form>
  );
}
