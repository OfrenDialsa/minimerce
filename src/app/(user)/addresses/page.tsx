import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { loadStoreWithAddresses } from "@/actions/profile.action";
import type { Address } from "@/database/schema";
import { AddressItemActions } from "@/components/address/address-item-action";

function formatRegionLine(addr: Address): string {
  return [
    addr.village ? `Desa/Kel. ${addr.village}` : null,
    addr.district ? `Kec. ${addr.district}` : null,
    addr.city,
    addr.province,
    addr.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
}

function ActiveAddressesSummary({
  defaultUserAddress,
  activeStoreAddress,
  hasStore,
}: {
  defaultUserAddress: Address | null;
  activeStoreAddress: Address | null;
  hasStore: boolean;
}) {
  return (
    <div
      className={`grid divide-y divide-gray-200 border-b border-gray-200 ${
        hasStore ? "md:grid-cols-2 md:divide-x md:divide-y-0" : ""
      }`}
    >
      {/* Ringkasan Alamat Utama Akun */}
      <div className="bg-orange-50/40 px-6 py-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#ee4d2d]">
            Alamat Utama Akun
          </span>
          <Link
            href="/profile"
            className="text-xs font-medium text-gray-600 hover:underline"
          >
            Lihat Profil
          </Link>
        </div>

        {defaultUserAddress ? (
          <div className="mt-2.5 border-l-2 border-[#ee4d2d] pl-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-gray-900">
                {defaultUserAddress.recipientName}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-xs text-gray-700">
                {defaultUserAddress.phone}
              </span>
              <span className="border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-800">
                {defaultUserAddress.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-900">
              {defaultUserAddress.addressLine}
            </p>
            <p className="mt-0.5 text-xs text-gray-600">
              {formatRegionLine(defaultUserAddress)}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-xs text-gray-500">
            Belum ada alamat utama akun yang dipilih.
          </p>
        )}
      </div>

      {/* Ringkasan Alamat Toko Aktif (hanya jika user punya toko) */}
      {hasStore && (
        <div className="bg-emerald-50/35 px-6 py-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Alamat Pengiriman Toko
            </span>
            <Link
              href="/store"
              className="text-xs font-medium text-gray-600 hover:underline"
            >
              Lihat Toko
            </Link>
          </div>

          {activeStoreAddress ? (
            <div className="mt-2.5 border-l-2 border-emerald-600 pl-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold text-gray-900">
                  {activeStoreAddress.recipientName}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-xs text-gray-700">
                  {activeStoreAddress.phone}
                </span>
                <span className="border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-800">
                  {activeStoreAddress.label}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-900">
                {activeStoreAddress.addressLine}
              </p>
              <p className="mt-0.5 text-xs text-gray-600">
                {formatRegionLine(activeStoreAddress)}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-gray-500">
              Alamat toko belum dipilih. Klik{" "}
              <span className="font-semibold text-emerald-700">
                Jadikan Alamat Toko
              </span>{" "}
              pada salah satu alamat di bawah.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

async function AddressesContent() {
  const {
    store,
    addresses: addressList,
    addressesError,
  } = await loadStoreWithAddresses();

  if (addressesError?.toLowerCase().includes("login")) {
    redirect("/login");
  }

  const defaultUserAddress = addressList.find((item) => item.isDefault) ?? null;

  const activeStoreAddress = store?.activeAddressId
    ? (addressList.find((item) => item.id === store.activeAddressId) ?? null)
    : null;

  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      <div className="h-2 w-full bg-linear-to-r from-[#ee4d2d] via-[#f05d40] to-[#ff7337]" />

      {/* Header Halaman */}
      <div className="border-b border-gray-200 px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Manajemen Alamat
            </h1>
            <p className="mt-0.5 text-xs text-gray-500">
              Kelola alamat utama akun maupun alamat pengiriman toko secara
              terpisah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/profile"
              className="border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Profil Saya
            </Link>
            <Link
              href="/profile/store"
              className="border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Toko Saya
            </Link>
            <Link
              href="/addresses/create"
              className="bg-[#ee4d2d] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#d73211]"
            >
              + Tambah Alamat Baru
            </Link>
          </div>
        </div>
      </div>

      {/* Ringkasan Alamat Utama Akun & Alamat Toko */}
      <ActiveAddressesSummary
        defaultUserAddress={defaultUserAddress}
        activeStoreAddress={activeStoreAddress}
        hasStore={Boolean(store)}
      />

      {addressesError && (
        <div className="border-b border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
          {addressesError}
        </div>
      )}

      {/* Daftar Seluruh Alamat */}
      <section className="w-full flex-1">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3.5">
          <h2 className="text-sm font-semibold text-gray-900">
            Semua Alamat Tersimpan ({addressList.length})
          </h2>
          <span className="text-xs text-gray-500">
            Satu alamat dapat dipakai untuk akun, toko, atau keduanya
          </span>
        </div>

        {addressList.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-gray-900">
              Belum ada alamat yang tersimpan
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Tambahkan alamat pertamamu untuk mulai mengatur alamat utama akun
              dan lokasi toko.
            </p>
            <div className="mt-4">
              <Link
                href="/addresses/create"
                className="inline-block bg-[#ee4d2d] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#d73211]"
              >
                + Tambah Alamat Baru
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {addressList.map((addr) => {
              const isStoreActive = store?.activeAddressId === addr.id;

              return (
                <div
                  key={addr.id}
                  className="flex flex-col justify-between gap-4 px-6 py-5 transition-colors hover:bg-gray-50/50 sm:flex-row sm:items-start"
                >
                  <div className="space-y-1.5 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {addr.recipientName}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-xs font-medium text-gray-700">
                        {addr.phone}
                      </span>
                      <span className="border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                        {addr.label}
                      </span>
                      {addr.isDefault && (
                        <span className="border border-[#ee4d2d]/40 bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-[#ee4d2d]">
                          Utama Akun
                        </span>
                      )}
                      {isStoreActive && (
                        <span className="border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          Alamat Toko
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-900">{addr.addressLine}</p>
                    <p className="text-xs text-gray-600">
                      {formatRegionLine(addr)}
                    </p>
                  </div>

                  <AddressItemActions
                    addressId={addr.id}
                    isDefault={addr.isDefault}
                    hasStore={Boolean(store)}
                    isStoreActive={isStoreActive}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default function AddressesPage() {
  return (
    <main className="min-h-screen w-full bg-white">
      <Suspense
        fallback={
          <div className="w-full p-6 text-sm text-gray-500">
            Memuat daftar alamat...
          </div>
        }
      >
        <AddressesContent />
      </Suspense>
    </main>
  );
}
