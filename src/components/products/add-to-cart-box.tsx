"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { addToCartAction } from "@/actions/cart-item.action";

interface AddToCartBoxProps {
  productId: number;
  stock: number;
  isOwnStore?: boolean;
}

export function AddToCartBox({
  productId,
  stock,
  isOwnStore = false,
}: AddToCartBoxProps) {
  const isOutOfStock = stock <= 0;
  const isBlocked = isOwnStore || isOutOfStock;
  const [quantity, setQuantity] = useState<number>(1);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function decreaseQty() {
    setStatusMessage(null);
    setQuantity((prev) => Math.max(1, prev - 1));
  }

  function increaseQty() {
    setStatusMessage(null);
    setQuantity((prev) => Math.min(stock, prev + 1));
  }

  function handleQtyChange(rawValue: string) {
    setStatusMessage(null);
    if (rawValue === "") {
      setQuantity(1);
      return;
    }
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) return;
    const clamped = Math.max(1, Math.min(stock, Math.floor(parsed)));
    setQuantity(clamped);
  }

  function handleAddToCart() {
    if (isBlocked) return;
    setStatusMessage(null);

    startTransition(async () => {
      try {
        await addToCartAction(productId, quantity);
        setStatusMessage({
          type: "success",
          text: `${quantity} produk berhasil dimasukkan ke keranjang.`,
        });
      } catch (err) {
        if (err instanceof Error && err.message === "NEXT_REDIRECT") {
          throw err;
        }
        setStatusMessage({
          type: "error",
          text:
            err instanceof Error
              ? err.message
              : "Gagal memasukkan produk ke keranjang.",
        });
      }
    });
  }

  return (
    <div className="mt-5 border border-gray-200 bg-gray-50/60 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <label
            htmlFor="product-quantity"
            className="block text-xs font-semibold text-gray-900"
          >
            Kuantitas
          </label>
          <div className="mt-2 inline-flex items-center border border-gray-300 bg-white">
            <button
              type="button"
              onClick={decreaseQty}
              disabled={isPending || isBlocked || quantity <= 1}
              aria-label="Kurangi kuantitas"
              className="flex h-9 w-9 items-center justify-center text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
            >
              -
            </button>
            <input
              id="product-quantity"
              type="number"
              min={1}
              max={Math.max(1, stock)}
              value={isOutOfStock ? 0 : quantity}
              disabled={isPending || isBlocked}
              onChange={(e) => handleQtyChange(e.target.value)}
              className="h-9 w-14 border-x border-gray-300 text-center text-sm font-semibold text-gray-900 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
            />
            <button
              type="button"
              onClick={increaseQty}
              disabled={isPending || isBlocked || quantity >= stock}
              aria-label="Tambah kuantitas"
              className="flex h-9 w-9 items-center justify-center text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
            >
              +
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-gray-500">
            {isOutOfStock ? "Stok tidak tersedia" : `Maksimal ${stock} unit`}
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isPending || isBlocked}
          className="inline-flex h-10 items-center justify-center gap-2 bg-[#ee4d2d] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#d73211] disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 shrink-0"
            aria-hidden="true"
          >
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
          <span>
            {isOwnStore
              ? "Produk Toko Sendiri"
              : isOutOfStock
                ? "Stok Habis"
                : isPending
                  ? "Menambahkan..."
                  : "Masukkan ke Keranjang"}
          </span>
        </button>
      </div>

      {isOwnStore && (
        <p className="mt-3 border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Ini produk dari tokomu sendiri, sehingga tidak bisa dimasukkan ke
          keranjang belanja.
        </p>
      )}

      {statusMessage && (
        <div
          className={`mt-3 flex flex-wrap items-center justify-between gap-2 border px-3 py-2 text-xs ${
            statusMessage.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <span>{statusMessage.text}</span>
          {statusMessage.type === "success" && (
            <Link
              href="/cart"
              className="font-semibold text-[#ee4d2d] hover:underline"
            >
              Lihat Keranjang →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
