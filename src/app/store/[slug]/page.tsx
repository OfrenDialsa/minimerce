import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { and, eq } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/database";
import { addresses } from "@/database/schema";
import { getStoreBySlugAction } from "@/actions/store.action";
import { getPublicStoreProductsAction } from "@/actions/products.action";
import { PublicProductCard } from "@/components/products/public-product-card";
import { auth } from "@/auth";

async function getStoreLocationById(
  userId: number,
  activeAddressId: number | null,
) {
  if (!activeAddressId) return null;

  const [addr] = await db
    .select()
    .from(addresses)
    .where(and(eq(addresses.id, activeAddressId), eq(addresses.userId, userId)))
    .limit(1);

  return addr ?? null;
}

async function PublicStoreContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connection();

  const [storeRes, productsRes] = await Promise.all([
    getStoreBySlugAction(slug),
    getPublicStoreProductsAction(slug),
  ]);

  const store = storeRes.data;
  const storeError = storeRes.error;
  const publicProducts = productsRes.data ?? [];
  const productsError = productsRes.error;

  await connection();
  const session = await auth();
  const isOwner = Boolean(
    session?.user?.id &&
    store?.userId &&
    Number(session.user.id) === Number(store.userId),
  );

  if (storeError) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-white">
        <div className="h-2 w-full bg-linear-to-r from-[#ee4d2d] via-[#f05d40] to-[#ff7337]" />
        <div className="w-full px-6 py-8">
          <div className="flex items-start gap-3 border-l-4 border-red-500 bg-red-50/40 p-4">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
              !
            </span>
            <div className="flex-1">
              <h1 className="text-base font-semibold text-gray-900">
                Gagal Memuat Halaman Toko
              </h1>
              <p className="mt-1 text-sm text-gray-600">{storeError}</p>
              <div className="mt-4">
                <Link
                  href="/"
                  className="bg-[#ee4d2d] px-4 py-2 text-sm font-medium text-white hover:bg-[#d73211]"
                >
                  Kembali ke Beranda
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-white">
        <div className="h-2 w-full bg-linear-to-r from-[#ee4d2d] via-[#f05d40] to-[#ff7337]" />
        <div className="w-full px-6 py-10">
          <div className="border-l-4 border-[#ee4d2d] bg-orange-50/40 p-5">
            <h1 className="text-lg font-bold text-gray-900">
              Toko Tidak Ditemukan
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Toko dengan tautan{" "}
              <code className="font-mono">/store/{slug}</code> tidak tersedia
              atau sedang tidak aktif.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Link
                href="/"
                className="bg-[#ee4d2d] px-4 py-2 text-xs font-semibold text-white hover:bg-[#d73211]"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeAddress = await getStoreLocationById(
    store.userId,
    store.activeAddressId,
  );

  const regionParts = activeAddress
    ? [
        activeAddress.village ? `Desa/Kel. ${activeAddress.village}` : null,
        activeAddress.district ? `Kec. ${activeAddress.district}` : null,
        activeAddress.city ?? null,
        activeAddress.province ?? null,
        activeAddress.postalCode ?? null,
      ].filter(Boolean)
    : [];

  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      {/* Banner Header Full-Width */}
      <div className="h-24 w-full bg-linear-to-r from-[#ee4d2d] via-[#f05d40] to-[#ff7337]" />

      <div className="w-full border-b border-gray-200 px-6 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            {store.logoUrl ? (
              <div className="-mt-11 flex h-22 w-22 shrink-0 items-center justify-center overflow-hidden border-4 border-white bg-white">
                <Image
                  src={store.logoUrl}
                  alt={store.name}
                  width={88}
                  height={88}
                  unoptimized
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="-mt-11 flex h-22 w-22 shrink-0 items-center justify-center border-4 border-white bg-orange-50 text-xl font-bold text-[#ee4d2d]">
                {store.name.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="pt-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">
                  {store.name}
                </h1>
                <span className="border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  Toko Aktif
                </span>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                <span>
                  Tautan:{" "}
                  <code className="bg-orange-50 px-1.5 py-0.5 font-medium text-[#ee4d2d]">
                    /store/{store.slug}
                  </code>
                </span>
                {activeAddress?.city && (
                  <span>• Dikirim dari {activeAddress.city}</span>
                )}
                <span>• {publicProducts.length} Produk</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:pt-2.5">
            {isOwner ? (
              <Link
                href="/profile/store"
                className="border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Kelola Toko
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className="cursor-not-allowed select-none border border-gray-200 bg-gray-100 px-3.5 py-2 text-xs font-semibold text-gray-400"
              >
                Kelola Toko
              </span>
            )}
          </div>
        </div>
      </div>

      <section className="grid w-full flex-1 divide-y divide-gray-200 md:grid-cols-4 md:divide-x md:divide-y-0">
        <div className="p-6 md:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Etalase Produk ({publicProducts.length})
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Daftar produk aktif yang tersedia di {store.name}.
              </p>
            </div>
          </div>

          {productsError ? (
            <div className="mt-4 border-l-2 border-amber-500 bg-amber-50/60 p-3 text-xs text-amber-800">
              {productsError}
            </div>
          ) : publicProducts.length === 0 ? (
            <div className="mt-4 border border-dashed border-gray-300 bg-gray-50/70 p-6 text-center">
              <p className="text-sm font-medium text-gray-700">
                Belum ada produk yang ditampilkan di toko ini.
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Silakan cek kembali di lain waktu.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {publicProducts.map((product) => (
                <PublicProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        <aside className="divide-y divide-gray-200">
          <div className="p-6">
            <h2 className="text-sm font-semibold text-gray-900">
              Tentang Toko
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-700">
              {store.description || "Toko ini belum menambahkan deskripsi."}
            </p>

            <dl className="mt-4 space-y-2.5 border-t border-gray-200 pt-4 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Bergabung</dt>
                <dd className="font-medium text-gray-800">
                  {new Intl.DateTimeFormat("id-ID", {
                    dateStyle: "medium",
                  }).format(new Date(store.createdAt))}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Total Produk</dt>
                <dd className="font-medium text-gray-800">
                  {publicProducts.length}
                </dd>
              </div>
            </dl>
          </div>

          <div className="p-6">
            <h2 className="text-sm font-semibold text-gray-900">
              Lokasi Pengiriman
            </h2>
            {activeAddress ? (
              <div className="mt-3 space-y-2 text-xs text-gray-700">
                <p className="font-semibold text-gray-900">
                  {activeAddress.city}
                  {activeAddress.province ? `, ${activeAddress.province}` : ""}
                </p>
                {regionParts.length > 0 && (
                  <p className="text-gray-600">{regionParts.join(", ")}</p>
                )}
              </div>
            ) : (
              <p className="mt-3 text-xs text-gray-500">
                Informasi lokasi pengiriman belum dicantumkan.
              </p>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}

export default function PublicStorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <main className="min-h-screen w-full bg-white">
      <Suspense
        fallback={
          <div className="w-full p-6 text-sm text-gray-500">
            Memuat halaman toko...
          </div>
        }
      >
        <PublicStoreContent params={params} />
      </Suspense>
    </main>
  );
}
