import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { and, desc, eq, ne } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/database";
import { addresses, products, stores, type Product } from "@/database/schema";
import { AddToCartBox } from "@/components/products/add-to-cart-box";
import { auth } from "@/auth";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function isSafeImageSrc(url: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith("/") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://")
  );
}

async function loadProductDetail(storeSlug: string, productSlug: string) {
  const cleanStoreSlug = storeSlug.trim().toLowerCase();
  const cleanProductSlug = productSlug.trim().toLowerCase();

  if (!cleanStoreSlug || !cleanProductSlug) {
    return {
      store: null,
      product: null,
      activeAddress: null,
      relatedProducts: [],
    };
  }

  const [store] = await db
    .select()
    .from(stores)
    .where(and(eq(stores.slug, cleanStoreSlug), eq(stores.isActive, true)))
    .limit(1);

  if (!store) {
    return {
      store: null,
      product: null,
      activeAddress: null,
      relatedProducts: [],
    };
  }

  const [product] = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.storeId, store.id),
        eq(products.slug, cleanProductSlug),
        eq(products.isArchived, false),
      ),
    )
    .limit(1);

  if (!product) {
    return { store, product: null, activeAddress: null, relatedProducts: [] };
  }

  const [activeAddressRows, relatedRows] = await Promise.all([
    store.activeAddressId
      ? db
          .select()
          .from(addresses)
          .where(
            and(
              eq(addresses.id, store.activeAddressId),
              eq(addresses.userId, store.userId),
            ),
          )
          .limit(1)
      : Promise.resolve([]),
    db
      .select()
      .from(products)
      .where(
        and(
          eq(products.storeId, store.id),
          eq(products.isArchived, false),
          ne(products.id, product.id),
        ),
      )
      .orderBy(desc(products.createdAt), desc(products.id))
      .limit(4),
  ]);

  return {
    store,
    product,
    activeAddress: activeAddressRows[0] ?? null,
    relatedProducts: relatedRows,
  };
}

function RelatedProductItem({
  item,
  storeSlug,
}: {
  item: Product;
  storeSlug: string;
}) {
  const showImage = isSafeImageSrc(item.imageUrl);
  const isOutOfStock = item.stock <= 0;

  return (
    <Link
      href={`/store/${storeSlug}/products/${item.slug}`}
      className="group flex flex-col justify-between border border-gray-200 bg-white p-3 transition-colors hover:border-[#ee4d2d]"
    >
      <div>
        <div className="relative aspect-square w-full overflow-hidden border border-gray-100 bg-gray-50">
          {showImage && item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              unoptimized
              className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-orange-50/50 text-base font-bold text-[#ee4d2d]">
              {item.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <h3 className="mt-2.5 line-clamp-2 text-xs font-semibold text-gray-900 group-hover:text-[#ee4d2d]">
          {item.name}
        </h3>
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-2">
        <span className="text-xs font-bold text-[#ee4d2d]">
          {formatRupiah(item.price)}
        </span>
        <span className="text-[11px] text-gray-500">
          {isOutOfStock ? "Habis" : `Stok ${item.stock}`}
        </span>
      </div>
    </Link>
  );
}

async function PublicProductDetailContent({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}) {
  const { slug, productSlug } = await params;
  await connection();
  const session = await auth();

  const { store, product, activeAddress, relatedProducts } =
    await loadProductDetail(slug, productSlug);

  if (!store || !product) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-white">
        <div className="h-2 w-full bg-linear-to-r from-[#ee4d2d] via-[#f05d40] to-[#ff7337]" />
        <div className="w-full px-6 py-10">
          <div className="border-l-4 border-[#ee4d2d] bg-orange-50/40 p-5">
            <h1 className="text-lg font-bold text-gray-900">
              Produk Tidak Ditemukan
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Produk yang kamu cari tidak tersedia, sudah diarsipkan, atau
              tokonya sedang tidak aktif.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {store ? (
                <Link
                  href={`/store/${store.slug}`}
                  className="bg-[#ee4d2d] px-4 py-2 text-xs font-semibold text-white hover:bg-[#d73211]"
                >
                  Kembali ke {store.name}
                </Link>
              ) : null}
              <Link
                href="/"
                className="border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentUserId = Number(session?.user?.id);
  const isOwnStore = Boolean(
    Number.isSafeInteger(currentUserId) &&
    currentUserId > 0 &&
    store.userId &&
    currentUserId === Number(store.userId),
  );

  const showProductImg = isSafeImageSrc(product.imageUrl);
  const showStoreLogo = isSafeImageSrc(store.logoUrl);
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      {/* Top Accent Bar & Breadcrumb */}
      <div className="h-2 w-full bg-linear-to-r from-[#ee4d2d] via-[#f05d40] to-[#ff7337]" />

      <div className="w-full border-b border-gray-200 bg-gray-50/60 px-6 py-3">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500"
        >
          <Link href="/" className="hover:text-[#ee4d2d]">
            Beranda
          </Link>
          <span>/</span>
          <Link href={`/store/${store.slug}`} className="hover:text-[#ee4d2d]">
            {store.name}
          </Link>
          <span>/</span>
          <span className="line-clamp-1 font-medium text-gray-900">
            {product.name}
          </span>
        </nav>
      </div>

      {/* Konten Utama Detail Produk */}
      <section className="grid w-full divide-y divide-gray-200 border-b border-gray-200 lg:grid-cols-12 lg:divide-x lg:divide-y-0">
        {/* Kolom Gambar Produk */}
        <div className="p-6 lg:col-span-5">
          <div className="relative aspect-square w-full overflow-hidden border border-gray-200 bg-gray-50">
            {showProductImg && product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                unoptimized
                loading="eager"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-orange-50/50 text-3xl font-bold text-[#ee4d2d]">
                {product.name.slice(0, 2).toUpperCase()}
              </div>
            )}

            {isOutOfStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                <span className="border border-white/80 bg-gray-900/90 px-3 py-1.5 text-xs font-semibold text-white">
                  Stok Habis
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Kolom Informasi & Harga Produk */}
        <div className="flex flex-col justify-between p-6 lg:col-span-7">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {product.category && (
                <span className="border border-[#ee4d2d]/25 bg-orange-50 px-2.5 py-0.5 text-[11px] font-semibold text-[#ee4d2d]">
                  {product.category}
                </span>
              )}
              <span
                className={`border px-2.5 py-0.5 text-[11px] font-semibold ${
                  isOutOfStock
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {isOutOfStock ? "Stok Habis" : "Tersedia"}
              </span>
            </div>

            <h1 className="mt-3 text-xl font-bold text-gray-900 sm:text-2xl">
              {product.name}
            </h1>

            <div className="mt-4 border border-[#ee4d2d]/20 bg-orange-50/50 px-4 py-3.5">
              <p className="text-[11px] font-medium text-gray-500">
                Harga Satuan
              </p>
              <p className="mt-0.5 text-2xl font-bold text-[#ee4d2d]">
                {formatRupiah(product.price)}
              </p>
            </div>

            <AddToCartBox
              productId={product.id}
              stock={product.stock}
              isOwnStore={isOwnStore}
            />

            <div className="mt-6 flex flex-col gap-3 border border-gray-200 bg-gray-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {showStoreLogo && store.logoUrl ? (
                  <Image
                    src={store.logoUrl}
                    alt={store.name}
                    width={44}
                    height={44}
                    unoptimized
                    className="h-11 w-11 shrink-0 rounded-xs border border-gray-200 bg-white object-contain"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xs border border-orange-200 bg-orange-50 text-sm font-bold text-[#ee4d2d]">
                    {store.name.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {store.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {activeAddress?.city
                      ? `Lokasi: ${activeAddress.city}`
                      : `/store/${store.slug}`}
                  </p>
                </div>
              </div>

              <Link
                href={`/store/${store.slug}`}
                className="shrink-0 border border-[#ee4d2d] bg-white px-4 py-2 text-center text-xs font-semibold text-[#ee4d2d] transition-colors hover:bg-orange-50"
              >
                Kunjungi Toko
              </Link>
            </div>

            <dl className="mt-5 grid gap-4 border-t border-b border-gray-200 py-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-gray-500">Ketersediaan Stok</dt>
                <dd className="mt-0.5 font-semibold text-gray-900">
                  {isOutOfStock ? "0 (Habis)" : `${product.stock} unit`}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Kategori</dt>
                <dd className="mt-0.5 font-medium text-gray-900">
                  {product.category || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Pengiriman Dari</dt>
                <dd className="mt-0.5 font-medium text-gray-900">
                  {activeAddress?.city || store.name}
                </dd>
              </div>
            </dl>

            <div className="mt-5">
              <h2 className="text-sm font-semibold text-gray-900">
                Deskripsi Produk
              </h2>
              <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-gray-700">
                {product.description ||
                  "Penjual belum menambahkan deskripsi rinci untuk produk ini."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Produk Lain di Toko yang Sama */}
      {relatedProducts.length > 0 && (
        <section className="w-full px-6 py-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-gray-900">
              Produk Lainnya dari {store.name}
            </h2>
            <Link
              href={`/store/${store.slug}`}
              className="text-xs font-semibold text-[#ee4d2d] hover:underline"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {relatedProducts.map((item) => (
              <RelatedProductItem
                key={item.id}
                item={item}
                storeSlug={store.slug}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function PublicProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}) {
  return (
    <main className="min-h-screen w-full bg-white">
      <Suspense
        fallback={
          <div className="w-full p-6 text-sm text-gray-500">
            Memuat detail produk...
          </div>
        }
      >
        <PublicProductDetailContent params={params} />
      </Suspense>
    </main>
  );
}
