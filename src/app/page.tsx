import { Suspense } from "react";
import { and, desc, eq } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/database";
import { products, stores } from "@/database/schema";
import {
  HomeCatalog,
  type CatalogProductItem,
} from "@/components/home-catalog";

async function loadPublicCatalog(): Promise<CatalogProductItem[]> {
  await connection();

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      category: products.category,
      description: products.description,
      price: products.price,
      stock: products.stock,
      imageUrl: products.imageUrl,
      storeId: stores.id,
      storeName: stores.name,
      storeSlug: stores.slug,
      storeLogoUrl: stores.logoUrl,
    })
    .from(products)
    .innerJoin(stores, eq(products.storeId, stores.id))
    .where(and(eq(products.isArchived, false), eq(stores.isActive, true)))
    .orderBy(desc(products.createdAt), desc(products.id));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    description: row.description,
    price: row.price,
    stock: row.stock,
    imageUrl: row.imageUrl,
    store: {
      id: row.storeId,
      name: row.storeName,
      slug: row.storeSlug,
      logoUrl: row.storeLogoUrl,
    },
  }));
}

async function LandingContent() {
  const items = await loadPublicCatalog();
  return <HomeCatalog items={items} />;
}

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      <header className="w-full border-b border-gray-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Katalog Produk &amp; Toko
            </h1>
            <p className="mt-0.5 text-xs text-gray-500">
              Temukan barang pilihan dari berbagai toko aktif dan kunjungi
              halaman tokonya langsung.
            </p>
          </div>
        </div>
      </header>

      <main className="flex w-full flex-1 flex-col">
        <Suspense
          fallback={
            <div className="w-full px-6 py-8 text-sm text-gray-500">
              Memuat daftar barang dan toko...
            </div>
          }
        >
          <LandingContent />
        </Suspense>
      </main>
    </div>
  );
}
