import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
import { DeleteStoreButton } from "@/components/store/delete-button";
import { loadStoreWithAddresses } from "@/actions/profile.action";
import type { Address } from "@/database/schema";
import { getStoreProductsAction } from "@/actions/products.action";
import { ProductCard } from "@/components/products/product-card";

async function StoreContent() {
  const [storeBundle, productsRes] = await Promise.all([
    loadStoreWithAddresses(),
    getStoreProductsAction({ includeArchived: true }),
  ]);

  const { store, storeError, addresses, addressesError } = storeBundle;
  const storeProducts = productsRes.data ?? [];
  const productsError = productsRes.error;

  if (!store && storeError?.toLowerCase().includes("login")) {
    redirect("/login");
  }

  if (!storeError && !store) {
    redirect("/profile/store/create");
  }

  if (storeError || !store) {
    return (
      <div className="rounded-md border border-gray-200 bg-white p-6 shadow-xs">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
            !
          </span>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-gray-900">
              Gagal Memuat Data Toko
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {storeError ?? "Data toko tidak dapat ditemukan saat ini."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Link
                href="/store"
                className="rounded-xs bg-[#ee4d2d] px-4 py-2 text-sm font-medium text-white hover:bg-[#d73211]"
              >
                Coba Lagi
              </Link>
              <Link
                href="/profile/store/create"
                className="rounded-xs border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Buat Toko Baru
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeAddress: Address | null =
    addresses.find((item) => item.id === store.activeAddressId) ??
    addresses.find((item) => item.isDefault) ??
    addresses[0] ??
    null;

  const regionParts = activeAddress
    ? [
        activeAddress.village ? `Desa/Kel. ${activeAddress.village}` : null,
        activeAddress.district ? `Kec. ${activeAddress.district}` : null,
        activeAddress.city ?? null,
        activeAddress.province ?? null,
        activeAddress.postalCode ?? null,
      ].filter(Boolean)
    : [];

  const hasLocation =
    Boolean(activeAddress) &&
    (Boolean(activeAddress?.addressLine) ||
      regionParts.length > 0 ||
      (activeAddress?.latitude !== null &&
        activeAddress?.latitude !== undefined &&
        activeAddress?.longitude !== null &&
        activeAddress?.longitude !== undefined));

  return (
    <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-xs">
      <div className="h-18 bg-linear-to-r from-[#ee4d2d] via-[#f05d40] to-[#ff7337]" />

      <div className="border-b border-gray-200 px-5 pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            {store.logoUrl ? (
              <div className="-mt-9 flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border-4 border-white bg-white shadow-sm">
                <Image
                  src={store.logoUrl}
                  alt={store.name}
                  width={80}
                  height={80}
                  unoptimized
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="-mt-9 flex h-20 w-20 shrink-0 items-center justify-center rounded-md border-4 border-white bg-orange-50 text-xl font-bold text-[#ee4d2d] shadow-sm">
                {store.name.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="pt-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">
                  {store.name}
                </h1>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                <span>
                  URL Toko:{" "}
                  <code className="rounded-xs bg-orange-50 px-1.5 py-0.5 font-medium text-[#ee4d2d]">
                    /store/{store.slug}
                  </code>
                </span>
                {activeAddress?.city && (
                  <span>• Dikirim dari {activeAddress.city}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:pt-2.5">
            <Link
              href={`/store/${store.slug}`}
              className="rounded-xs border border-[#ee4d2d] bg-orange-50/60 px-3.5 py-2 text-xs font-semibold text-[#ee4d2d] transition-colors hover:bg-orange-100/70"
            >
              Kunjungi Toko
            </Link>
            <Link
              href="/profile/store/edit"
              className="rounded-xs bg-[#ee4d2d] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-[#d73211]"
            >
              Edit Profil Toko
            </Link>
          </div>
        </div>
      </div>

      <section className="grid divide-y divide-gray-200 md:grid-cols-3 md:divide-x md:divide-y-0">
        <div className="divide-y divide-gray-200 md:col-span-2">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">
                Deskripsi Toko
              </h2>
              <span className="text-xs text-gray-400">Profil Publik</span>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-700">
              {store.description ||
                "Belum ada deskripsi toko. Tambahkan deskripsi agar pembeli lebih mengenal tokomu."}
            </p>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">
                Alamat &amp; Lokasi Pengiriman
              </h2>
              <div className="flex items-center gap-2">
                {activeAddress && (
                  <span className="rounded-xs bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-[#ee4d2d]">
                    {activeAddress.label}
                  </span>
                )}
                <Link
                  href="/addresses"
                  className="text-xs font-semibold text-[#ee4d2d] hover:underline"
                >
                  Kelola Alamat
                </Link>
              </div>
            </div>

            {addressesError ? (
              <div className="mt-3 border-l-2 border-amber-500 bg-amber-50/60 p-3 text-xs text-amber-800">
                {addressesError}
              </div>
            ) : hasLocation && activeAddress ? (
              <div className="mt-3 space-y-3 text-sm text-gray-700">
                <div className="border-l-2 border-[#ee4d2d] pl-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {activeAddress.recipientName}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-xs font-medium text-gray-700">
                      {activeAddress.phone}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm text-gray-900">
                    {activeAddress.addressLine}
                  </p>
                </div>

                {regionParts.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Wilayah &amp; Kode Pos
                    </p>
                    <p className="mt-0.5 text-sm text-gray-800">
                      {regionParts.join(", ")}
                    </p>
                  </div>
                )}

                <dl className="grid gap-3 border-t border-gray-200 pt-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <dt className="text-xs text-gray-500">Kode Pos</dt>
                    <dd className="mt-0.5 text-sm font-medium text-gray-900">
                      {activeAddress.postalCode || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Kelurahan / Desa</dt>
                    <dd className="mt-0.5 text-sm font-medium text-gray-900">
                      {activeAddress.village || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Kecamatan</dt>
                    <dd className="mt-0.5 text-sm font-medium text-gray-900">
                      {activeAddress.district || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Kabupaten / Kota</dt>
                    <dd className="mt-0.5 text-sm font-medium text-gray-900">
                      {activeAddress.city || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Provinsi</dt>
                    <dd className="mt-0.5 text-sm font-medium text-gray-900">
                      {activeAddress.province || "-"}
                    </dd>
                  </div>
                  {activeAddress.latitude !== null &&
                    activeAddress.latitude !== undefined &&
                    activeAddress.longitude !== null &&
                    activeAddress.longitude !== undefined && (
                      <div>
                        <dt className="text-xs text-gray-500">Koordinat</dt>
                        <dd className="mt-0.5 font-mono text-xs text-gray-800">
                          {activeAddress.latitude}, {activeAddress.longitude}
                        </dd>
                      </div>
                    )}
                </dl>
              </div>
            ) : (
              <div className="mt-3 flex flex-col items-start justify-between gap-2 rounded-xs border border-dashed border-gray-200 bg-gray-50/70 p-4 sm:flex-row sm:items-center">
                <p className="text-sm text-gray-500">
                  Lokasi dan kode pos toko belum diatur.
                </p>
                <Link
                  href="/addresses/create"
                  className="shrink-0 bg-[#ee4d2d] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#d73211]"
                >
                  + Tambah Alamat
                </Link>
              </div>
            )}
          </div>
          {/* Daftar Produk Toko */}
          <div className="p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Produk Toko ({storeProducts.length})
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Kelola produk aktif maupun arsip yang tampil di etalase toko.
                </p>
              </div>
              <Link
                href="/profile/store/products/create"
                className="shrink-0 bg-[#ee4d2d] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#d73211]"
              >
                + Tambah Produk
              </Link>
            </div>

            {productsError ? (
              <div className="mt-3 border-l-2 border-amber-500 bg-amber-50/60 p-3 text-xs text-amber-800">
                {productsError}
              </div>
            ) : storeProducts.length === 0 ? (
              <div className="mt-3 flex flex-col items-start justify-between gap-2 rounded-xs border border-dashed border-gray-200 bg-gray-50/70 p-4 sm:flex-row sm:items-center">
                <p className="text-sm text-gray-500">
                  Belum ada produk di toko ini. Tambahkan produk pertama kamu.
                </p>
                <Link
                  href="/profile/store/products/create"
                  className="shrink-0 bg-[#ee4d2d] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#d73211]"
                >
                  + Tambah Produk
                </Link>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {storeProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          <div className="p-5">
            <h2 className="text-sm font-semibold text-gray-900">
              Informasi Toko
            </h2>

            <div className="mt-3">
              <dt className="text-xs text-gray-500">Status Toko</dt>
              <span
                className={`mt-1 inline-flex items-center rounded-xs px-2 py-0.5 text-[11px] font-semibold ${
                  store.isActive
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border border-gray-200 bg-gray-100 text-gray-600"
                }`}
              >
                {store.isActive ? "Aktif" : "Nonaktif"}
              </span>
            </div>

            <dl className="mt-3 space-y-3 border-t border-gray-200 pt-3 text-sm">
              <div>
                <dt className="text-xs text-gray-500">Status Operasional</dt>
                <dd className="mt-0.5 font-medium text-gray-900">
                  {store.isActive ? "Sedang Beroperasi" : "Sementara Tutup"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Slug Toko</dt>
                <dd className="mt-0.5 font-mono text-xs text-gray-800">
                  {store.slug}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Public ID</dt>
                <dd className="mt-0.5 font-mono text-xs text-gray-800">
                  {store.publicId ?? "-"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Bergabung Sejak</dt>
                <dd className="mt-0.5 text-sm text-gray-800">
                  {new Intl.DateTimeFormat("id-ID", {
                    dateStyle: "medium",
                  }).format(new Date(store.createdAt))}
                </dd>
              </div>
            </dl>
          </div>

          <div className="p-5">
            <h2 className="text-sm font-semibold text-gray-900">
              Pengaturan Lanjutan
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Menghapus toko akan menghilangkan profil dan data toko ini.
            </p>
            <div className="mt-3 flex justify-end">
              <DeleteStoreButton storeId={store.id} storeName={store.name} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function StorePage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto">
        <Suspense
          fallback={
            <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-xs">
              Memuat data toko...
            </div>
          }
        >
          <StoreContent />
        </Suspense>
      </div>
    </main>
  );
}
