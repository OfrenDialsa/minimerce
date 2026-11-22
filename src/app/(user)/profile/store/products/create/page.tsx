"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  createProductAction,
  type ProductActionState,
} from "@/actions/products.action";

const initialState: ProductActionState = {};

export default function CreateProductPage() {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const hasRedirectedRef = useRef(false);

  const [state, formAction, isPending] = useActionState(
    createProductAction,
    initialState,
  );

  useEffect(() => {
    if (
      !isPending &&
      state?.success &&
      state?.data &&
      !hasRedirectedRef.current
    ) {
      hasRedirectedRef.current = true;
      router.replace("/profile/store");
      router.refresh();
    }
  }, [isPending, state?.success, state?.data, router]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (file && file.size > 0) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  }

  return (
    <main className="flex min-h-screen w-full flex-col bg-white">
      <div className="h-2 w-full bg-linear-to-r from-[#ee4d2d] via-[#f05d40] to-[#ff7337]" />

      <div className="w-full border-b border-gray-200 px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Tambah Produk Baru
            </h1>
            <p className="mt-0.5 text-xs text-gray-500">
              Lengkapi informasi produk, harga, stok, dan gambar untuk
              ditampilkan di katalog toko.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/store"
              className="border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Kembali ke Toko
            </Link>
          </div>
        </div>
      </div>

      <form
        action={formAction}
        className="flex w-full flex-1 flex-col divide-y divide-gray-200"
      >
        {state?.error && (
          <div
            role="alert"
            className="border-l-4 border-red-500 bg-red-50 px-6 py-4 text-sm text-red-700"
          >
            {state.error}
          </div>
        )}

        <section className="grid gap-4 p-6 md:grid-cols-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Informasi Produk
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Nama produk akan dipakai untuk membentuk slug URL secara otomatis
              di dalam toko kamu.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:col-span-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="name"
                className="block text-xs font-semibold text-gray-700"
              >
                Nama Produk <span className="text-[#ee4d2d]">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                minLength={2}
                maxLength={150}
                disabled={isPending}
                placeholder="Contoh: Kopi Arabika Kerinci 250g"
                className="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#ee4d2d] focus:outline-none disabled:bg-gray-100"
              />
              {state?.fieldErrors?.name?.[0] && (
                <p className="mt-1 text-xs text-red-600">
                  {state.fieldErrors.name[0]}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="category"
                className="block text-xs font-semibold text-gray-700"
              >
                Kategori
              </label>
              <input
                id="category"
                name="category"
                type="text"
                minLength={2}
                maxLength={150}
                disabled={isPending}
                placeholder="Opsional (contoh: Makanan ringan)"
                className="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#ee4d2d] focus:outline-none disabled:bg-gray-100"
              />
              {state?.fieldErrors?.categoryId?.[0] && (
                <p className="mt-1 text-xs text-red-600">
                  {state.fieldErrors.categoryId[0]}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="description"
                className="block text-xs font-semibold text-gray-700"
              >
                Deskripsi Produk
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                maxLength={2000}
                disabled={isPending}
                placeholder="Jelaskan spesifikasi, keunggulan, berat bersih, atau detail produk..."
                className="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#ee4d2d] focus:outline-none disabled:bg-gray-100"
              />
              {state?.fieldErrors?.description?.[0] && (
                <p className="mt-1 text-xs text-red-600">
                  {state.fieldErrors.description[0]}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-4 p-6 md:grid-cols-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Harga &amp; Ketersediaan Stok
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Masukkan harga satuan dalam Rupiah (minimal Rp100) dan jumlah stok
              awal produk.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:col-span-2">
            <div>
              <label
                htmlFor="price"
                className="block text-xs font-semibold text-gray-700"
              >
                Harga (Rp) <span className="text-[#ee4d2d]">*</span>
              </label>
              <input
                id="price"
                name="price"
                type="number"
                min={100}
                step={1}
                required
                disabled={isPending}
                placeholder="Contoh: 55000"
                className="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#ee4d2d] focus:outline-none disabled:bg-gray-100"
              />
              {state?.fieldErrors?.price?.[0] && (
                <p className="mt-1 text-xs text-red-600">
                  {state.fieldErrors.price[0]}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="stock"
                className="block text-xs font-semibold text-gray-700"
              >
                Stok <span className="text-[#ee4d2d]">*</span>
              </label>
              <input
                id="stock"
                name="stock"
                type="number"
                min={0}
                step={1}
                defaultValue={0}
                required
                disabled={isPending}
                className="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#ee4d2d] focus:outline-none disabled:bg-gray-100"
              />
              {state?.fieldErrors?.stock?.[0] && (
                <p className="mt-1 text-xs text-red-600">
                  {state.fieldErrors.stock[0]}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-4 p-6 md:grid-cols-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Gambar &amp; Status Publikasi
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Unggah file gambar produk (JPG, PNG, WebP, atau GIF) dan pilih
              status publikasinya.
            </p>
          </div>

          <div className="space-y-4 md:col-span-2">
            <div>
              <label
                htmlFor="image"
                className="block text-xs font-semibold text-gray-700"
              >
                Gambar Produk
              </label>
              <input
                id="image"
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={isPending}
                onChange={handleImageChange}
                className="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 file:mr-4 file:border-0 file:bg-orange-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#ee4d2d] hover:file:bg-orange-100 focus:border-[#ee4d2d] focus:outline-none disabled:bg-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500">
                Format JPG, PNG, WebP, atau GIF.
              </p>

              {state?.fieldErrors?.imageUrl?.[0] && (
                <p className="mt-1 text-xs text-red-600">
                  {state.fieldErrors.imageUrl[0]}
                </p>
              )}

              {previewUrl && (
                <div className="mt-3 flex items-center gap-3">
                  <Image
                    src={previewUrl}
                    alt="Pratinjau gambar produk"
                    width={64}
                    height={64}
                    unoptimized
                    className="h-16 w-16 border border-gray-200 object-cover"
                  />
                  <span className="text-xs text-gray-500">
                    Pratinjau gambar produk
                  </span>
                </div>
              )}
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 pt-1 text-sm text-gray-800">
              <input
                type="checkbox"
                name="isArchived"
                value="true"
                disabled={isPending}
                className="h-4 w-4 accent-[#ee4d2d]"
              />
              <span>
                Simpan sebagai arsip (sembunyikan dari katalog publik)
              </span>
            </label>
            {state?.fieldErrors?.isArchived?.[0] && (
              <p className="text-xs text-red-600">
                {state.fieldErrors.isArchived[0]}
              </p>
            )}
          </div>
        </section>

        <div className="mt-auto flex items-center justify-end gap-3 bg-gray-50/70 px-6 py-4">
          <Link
            href="/store"
            className="border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="bg-[#ee4d2d] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#d73211] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Menyimpan..." : "Simpan Produk"}
          </button>
        </div>
      </form>
    </main>
  );
}
