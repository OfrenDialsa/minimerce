import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
import { getCurrentUserStoreAction } from "@/actions/store.action";
import { DeleteStoreButton } from "@/components/store/delete-button";

async function StoreContent() {
  const { error, data: store } = await getCurrentUserStoreAction();

  if (!store && error?.includes("login")) {
    redirect("/login");
  }

  if (!error && !store) {
    redirect("/store/create");
  }

  if (error || !store) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-900">
        <h1 className="text-lg font-semibold">Gagal Memuat Data Toko</h1>
        <p className="mt-1 text-sm">
          {error ?? "Data toko tidak dapat ditemukan saat ini."}
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href="/store"
            className="rounded-md bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
          >
            Coba Lagi
          </Link>
          <Link
            href="/store/create"
            className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-100"
          >
            Buat Toko Baru
          </Link>
        </div>
      </div>
    );
  }

  const regionParts = [
    store.village ? `Desa/Kel. ${store.village}` : null,
    store.district ? `Kec. ${store.district}` : null,
    store.city ?? null,
    store.province ?? null,
    store.postalCode ?? null,
  ].filter(Boolean);

  const hasLocation =
    Boolean(store.address) ||
    regionParts.length > 0 ||
    (store.latitude !== null &&
      store.latitude !== undefined &&
      store.longitude !== null &&
      store.longitude !== undefined);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
          {store.logoUrl ? (
            <div className="flex h-15 w-15 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white p-1">
              <Image
                src={store.logoUrl}
                alt={store.name}
                width={60}
                height={60}
                unoptimized
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-sm font-bold text-gray-600">
              {store.name.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{store.name}</h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  store.isActive
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {store.isActive ? "Aktif" : "Nonaktif"}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Slug:{" "}
              <code className="rounded bg-gray-100 px-1.5 py-0.5">
                {store.slug}
              </code>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/toko/${store.slug}`}
            className="rounded-md border px-3.5 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Lihat Halaman Publik
          </Link>
          <Link
            href="/store/edit"
            className="rounded-md bg-orange-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            Edit Toko
          </Link>
        </div>
      </div>

      <section className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <div className="rounded-lg border p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Deskripsi Toko
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-800">
              {store.description || "Belum ada deskripsi toko."}
            </p>
          </div>

          <div className="rounded-lg border p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Lokasi Toko
            </h2>

            {hasLocation ? (
              <div className="mt-3 space-y-3 text-sm text-gray-800">
                {store.address && (
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Alamat Jalan / Detail Lokasi
                    </p>
                    <p className="mt-0.5 whitespace-pre-line text-gray-900">
                      {store.address}
                    </p>
                  </div>
                )}

                {regionParts.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Wilayah &amp; Kode Pos
                    </p>
                    <p className="mt-0.5 text-gray-900">
                      {regionParts.join(", ")}
                    </p>
                  </div>
                )}

                <dl className="grid gap-3 border-t pt-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <dt className="text-xs text-gray-500">Kode Pos</dt>
                    <dd className="font-medium text-gray-900">
                      {store.postalCode || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Kelurahan / Desa</dt>
                    <dd className="font-medium text-gray-900">
                      {store.village || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Kecamatan</dt>
                    <dd className="font-medium text-gray-900">
                      {store.district || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Kabupaten / Kota</dt>
                    <dd className="font-medium text-gray-900">
                      {store.city || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Provinsi</dt>
                    <dd className="font-medium text-gray-900">
                      {store.province || "-"}
                    </dd>
                  </div>
                  {store.latitude !== null &&
                    store.latitude !== undefined &&
                    store.longitude !== null &&
                    store.longitude !== undefined && (
                      <div>
                        <dt className="text-xs text-gray-500">Koordinat</dt>
                        <dd className="font-mono text-xs text-gray-800">
                          {store.latitude}, {store.longitude}
                        </dd>
                      </div>
                    )}
                </dl>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">
                Lokasi dan kode pos toko belum diatur.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Informasi Tambahan
          </h2>
          <dl className="mt-3 space-y-2.5 text-sm">
            <div>
              <dt className="text-gray-500">Public ID</dt>
              <dd className="font-mono text-xs text-gray-800">
                {store.publicId ?? "-"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Dibuat pada</dt>
              <dd className="text-gray-800">
                {new Intl.DateTimeFormat("id-ID", {
                  dateStyle: "medium",
                }).format(new Date(store.createdAt))}
              </dd>
            </div>
          </dl>
        </div>
      </section>
      <div className="mt-4 flex justify-end">
        <DeleteStoreButton storeId={store.id} storeName={store.name} />
      </div>
    </>
  );
}

export default function StorePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Suspense
        fallback={
          <div className="text-sm text-gray-500">Memuat data toko...</div>
        }
      >
        <StoreContent />
      </Suspense>
    </main>
  );
}
