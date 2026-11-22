"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export type CatalogProductItem = {
  id: number;
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  store: {
    id: number;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
};

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

export function HomeCatalog({ items }: { items: CatalogProductItem[] }) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const categories = useMemo(() => {
    const unique = new Set<string>();
    for (const item of items) {
      if (item.category && item.category.trim().length > 0) {
        unique.add(item.category.trim());
      }
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b, "id"));
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesCategory =
        selectedCategory === "ALL" ||
        (item.category ?? "").trim().toLowerCase() ===
          selectedCategory.toLowerCase();

      if (!matchesCategory) return false;
      if (!q) return true;

      const inProductName = item.name.toLowerCase().includes(q);
      const inCategory = (item.category ?? "").toLowerCase().includes(q);
      const inDescription = (item.description ?? "").toLowerCase().includes(q);
      const inStoreName = item.store.name.toLowerCase().includes(q);
      const inStoreSlug = item.store.slug.toLowerCase().includes(q);

      return (
        inProductName ||
        inCategory ||
        inDescription ||
        inStoreName ||
        inStoreSlug
      );
    });
  }, [items, query, selectedCategory]);

  return (
    <section className="w-full flex-1 bg-white">
      {/* Bar Pencarian & Filter Kategori */}
      <div className="border-b border-gray-200 bg-orange-50/40 px-6 py-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <label htmlFor="catalog-search" className="sr-only">
              Cari barang atau toko
            </label>
            <input
              id="catalog-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama barang, kategori, atau nama toko..."
              className="w-full border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#ee4d2d] focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-gray-800"
              >
                Reset
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-gray-600 lg:justify-end">
            <span>
              Menampilkan{" "}
              <strong className="font-semibold text-gray-900">
                {filteredItems.length}
              </strong>{" "}
              dari {items.length} barang
            </span>
            {(query || selectedCategory !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSelectedCategory("ALL");
                }}
                className="border border-gray-300 bg-white px-2.5 py-1 font-semibold text-gray-700 hover:border-[#ee4d2d] hover:text-[#ee4d2d]"
              >
                Hapus Filter
              </button>
            )}
          </div>
        </div>

        {categories.length > 0 && (
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`border px-3 py-1 text-xs font-semibold transition-colors ${
                selectedCategory === "ALL"
                  ? "border-[#ee4d2d] bg-[#ee4d2d] text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-[#ee4d2d] hover:text-[#ee4d2d]"
              }`}
            >
              Semua Kategori
            </button>
            {categories.map((cat) => {
              const active =
                selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`border px-3 py-1 text-xs font-semibold transition-colors ${
                    active
                      ? "border-[#ee4d2d] bg-[#ee4d2d] text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-[#ee4d2d] hover:text-[#ee4d2d]"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Daftar Barang & Toko */}
      <div className="w-full px-6 py-6">
        {filteredItems.length === 0 ? (
          <div className="border border-dashed border-gray-300 bg-gray-50/70 p-8 text-center">
            <p className="text-sm font-semibold text-gray-800">
              Barang atau toko tidak ditemukan
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Coba kata kunci lain atau pilih kategori &ldquo;Semua
              Kategori&rdquo;.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredItems.map((item, index) => {
              const showProductImg = isSafeImageSrc(item.imageUrl);
              const showStoreLogo = isSafeImageSrc(item.store.logoUrl);
              const isOutOfStock = item.stock <= 0;

              return (
                <article
                  key={item.id}
                  className="flex h-full flex-col justify-between border border-gray-200 bg-white p-3.5 transition-colors hover:border-[#ee4d2d]"
                >
                  <div>
                    <Link
                      href={`/store/${item.store.slug}/products/${item.slug}`}
                      className="group block"
                    >
                      <div className="relative aspect-square w-full overflow-hidden border border-gray-100 bg-gray-50">
                        {showProductImg && item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            unoptimized
                            loading={index === 0 ? "eager" : undefined}
                            className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-orange-50/50 text-lg font-bold text-[#ee4d2d]">
                            {item.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        {isOutOfStock && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                            <span className="border border-white/80 bg-gray-900/90 px-2.5 py-1 text-[11px] font-semibold text-white">
                              Stok Habis
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3">
                        {item.category && (
                          <span className="inline-block border border-[#ee4d2d]/25 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-[#ee4d2d]">
                            {item.category}
                          </span>
                        )}

                        <h2 className="mt-1.5 line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-[#ee4d2d]">
                          {item.name}
                        </h2>

                        <div className="mt-1.5 flex items-baseline justify-between gap-2">
                          <span className="text-sm font-bold text-[#ee4d2d]">
                            {formatRupiah(item.price)}
                          </span>
                          <span className="text-[11px] font-medium text-gray-500">
                            {isOutOfStock ? "Habis" : `Stok ${item.stock}`}
                          </span>
                        </div>

                        {item.description && (
                          <p className="mt-1.5 line-clamp-2 text-xs text-gray-500">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  </div>

                  <div className="mt-3 border-t border-gray-100 pt-2.5">
                    <Link
                      href={`/store/${item.store.slug}`}
                      className="flex items-center gap-2 text-xs text-gray-700 hover:text-[#ee4d2d]"
                    >
                      {showStoreLogo && item.store.logoUrl ? (
                        <Image
                          src={item.store.logoUrl}
                          alt={item.store.name}
                          width={20}
                          height={20}
                          unoptimized
                          className="h-5 w-5 shrink-0 rounded-xs border border-gray-200 object-contain"
                        />
                      ) : (
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-xs bg-orange-50 text-[10px] font-bold text-[#ee4d2d]">
                          {item.store.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <span className="truncate font-medium">
                        {item.store.name}
                      </span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
