import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
import { getUserProfileAction } from "@/actions/users.action";
import type { UserProfile } from "@/types/user.types";
import { getCurrentUserStoreAction } from "@/actions/store.action";

function DefaultAddressSection({
  address,
}: {
  address: UserProfile["defaultAddress"];
}) {
  if (!address) {
    return (
      <div className="mt-4 flex flex-col items-start justify-between gap-3 border border-dashed border-gray-300 bg-gray-50/60 p-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-gray-800">
            Belum ada alamat utama yang dipilih
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            Tambahkan atau pilih alamat utama untuk mempermudah pengiriman dan
            pengaturan toko.
          </p>
        </div>
        <Link
          href="/addresses"
          className="shrink-0 bg-[#ee4d2d] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#d73211]"
        >
          Kelola Alamat
        </Link>
      </div>
    );
  }

  const regionParts = [
    address.village ? `Desa/Kel. ${address.village}` : null,
    address.district ? `Kec. ${address.district}` : null,
    address.city,
    address.province,
    address.postalCode,
  ].filter(Boolean);

  return (
    <div className="mt-4 space-y-4 text-sm text-gray-700">
      <div className="border-l-2 border-[#ee4d2d] pl-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-gray-900">
            {address.recipientName}
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-xs font-medium text-gray-700">
            {address.phone}
          </span>
          <span className="bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-[#ee4d2d]">
            {address.label}
          </span>
          {address.isDefault && (
            <span className="border border-[#ee4d2d]/30 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#ee4d2d]">
              Utama
            </span>
          )}
        </div>
        <p className="mt-1.5 whitespace-pre-line text-sm text-gray-900">
          {address.addressLine}
        </p>
        {regionParts.length > 0 && (
          <p className="mt-1 text-xs text-gray-600">{regionParts.join(", ")}</p>
        )}
      </div>

      <dl className="grid gap-4 border-t border-gray-200 pt-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-xs text-gray-500">Kode Pos</dt>
          <dd className="mt-0.5 text-sm font-medium text-gray-900">
            {address.postalCode || "-"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Kelurahan / Desa</dt>
          <dd className="mt-0.5 text-sm font-medium text-gray-900">
            {address.village || "-"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Kecamatan</dt>
          <dd className="mt-0.5 text-sm font-medium text-gray-900">
            {address.district || "-"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Kabupaten / Kota</dt>
          <dd className="mt-0.5 text-sm font-medium text-gray-900">
            {address.city}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Provinsi</dt>
          <dd className="mt-0.5 text-sm font-medium text-gray-900">
            {address.province}
          </dd>
        </div>
        {address.latitude !== null &&
          address.latitude !== undefined &&
          address.longitude !== null &&
          address.longitude !== undefined && (
            <div>
              <dt className="text-xs text-gray-500">Koordinat</dt>
              <dd className="mt-0.5 font-mono text-xs text-gray-800">
                {address.latitude}, {address.longitude}
              </dd>
            </div>
          )}
      </dl>
    </div>
  );
}

async function ProfileContent() {
  const [profileRes, storeRes] = await Promise.all([
    getUserProfileAction(),
    getCurrentUserStoreAction(),
  ]);

  const { error, data: profile } = profileRes;
  const hasStore = Boolean(storeRes.data);
  if (!profile && error?.toLowerCase().includes("login")) {
    redirect("/login");
  }

  if (error || !profile) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex items-start gap-3 border-l-4 border-red-500 bg-red-50/40 p-4">
          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
            !
          </span>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-gray-900">
              Gagal Memuat Profil
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {error ?? "Data profil pengguna tidak dapat ditemukan."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Link
                href="/profile"
                className="bg-[#ee4d2d] px-4 py-2 text-sm font-medium text-white hover:bg-[#d73211]"
              >
                Coba Lagi
              </Link>
              <Link
                href="/"
                className="border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const initials = profile.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      <div className="h-24 w-full bg-linear-to-r from-[#ee4d2d] via-[#f05d40] to-[#ff7337]" />

      <div className="w-full border-b border-gray-200 px-6 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            {profile.avatarUrl ? (
              <div className="-mt-11 flex h-22 w-22 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white">
                <Image
                  src={profile.avatarUrl}
                  alt={profile.name}
                  width={88}
                  height={88}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="-mt-11 flex h-22 w-22 shrink-0 items-center justify-center rounded-full border-4 border-white bg-orange-50 text-xl font-bold text-[#ee4d2d]">
                {initials || "US"}
              </div>
            )}

            <div className="pt-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">
                  {profile.name}
                </h1>
                <span className="border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium capitalize text-gray-700">
                  {profile.role ?? "user"}
                </span>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                <span>{profile.email}</span>
                {profile.phone && <span>• {profile.phone}</span>}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:pt-2.5">
            {hasStore && (
              <Link
                href="/profile/store"
                className="border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Toko Saya
              </Link>
            )}
            <Link
              href="/addresses"
              className="border border-[#ee4d2d] bg-orange-50/60 px-3.5 py-2 text-xs font-semibold text-[#ee4d2d] transition-colors hover:bg-orange-100/70"
            >
              Daftar Alamat
            </Link>

            <Link
              href="/profile/edit"
              className="bg-[#ee4d2d] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#d73211]"
            >
              Edit Profil
            </Link>
          </div>
        </div>
      </div>

      <section className="grid w-full flex-1 divide-y divide-gray-200 md:grid-cols-3 md:divide-x md:divide-y-0">
        <div className="divide-y divide-gray-200 md:col-span-2">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">
                Informasi Akun
              </h2>
              <span className="text-xs text-gray-400">Data Pengguna</span>
            </div>

            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-gray-500">Nama Lengkap</dt>
                <dd className="mt-0.5 text-sm font-medium text-gray-900">
                  {profile.name}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Email</dt>
                <dd className="mt-0.5 text-sm font-medium text-gray-900">
                  {profile.email}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Nomor Telepon</dt>
                <dd className="mt-0.5 text-sm font-medium text-gray-900">
                  {profile.phone || "Belum diatur"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Verifikasi Email</dt>
                <dd className="mt-0.5">
                  {profile.emailVerified ? (
                    <span className="inline-flex items-center border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      Terverifikasi
                    </span>
                  ) : (
                    <span className="inline-flex items-center border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                      Belum Terverifikasi
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">
                Alamat Utama
              </h2>
              <Link
                href="/addresses"
                className="text-xs font-semibold text-[#ee4d2d] hover:underline"
              >
                Ubah / Kelola
              </Link>
            </div>

            <DefaultAddressSection address={profile.defaultAddress} />
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          <div className="p-6">
            <h2 className="text-sm font-semibold text-gray-900">Detail Akun</h2>

            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs text-gray-500">Public ID</dt>
                <dd className="mt-0.5 font-mono text-xs text-gray-800">
                  {profile.publicId ?? "-"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Peran (Role)</dt>
                <dd className="mt-0.5 text-sm font-medium capitalize text-gray-900">
                  {profile.role ?? "user"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Terdaftar Sejak</dt>
                <dd className="mt-0.5 text-sm text-gray-800">
                  {new Intl.DateTimeFormat("id-ID", {
                    dateStyle: "medium",
                  }).format(new Date(profile.createdAt))}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Terakhir Diperbarui</dt>
                <dd className="mt-0.5 text-sm text-gray-800">
                  {new Intl.DateTimeFormat("id-ID", {
                    dateStyle: "medium",
                  }).format(new Date(profile.updatedAt))}
                </dd>
              </div>
            </dl>
          </div>

          <div className="p-6">
            <h2 className="text-sm font-semibold text-gray-900">
              Pintasan Cepat
            </h2>
            <div className="mt-4 flex flex-col gap-2 text-xs font-medium">
              <Link
                href="/addresses"
                className="border border-gray-200 px-3 py-2 text-gray-700 transition-colors hover:bg-gray-50"
              >
                Kelola Daftar Alamat
              </Link>
              <Link
                href="/store"
                className="border border-gray-200 px-3 py-2 text-gray-700 transition-colors hover:bg-gray-50"
              >
                Buka Halaman Toko
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <main className="min-h-screen w-full bg-white">
      <Suspense
        fallback={
          <div className="w-full p-6 text-sm text-gray-500">
            Memuat profil pengguna...
          </div>
        }
      >
        <ProfileContent />
      </Suspense>
    </main>
  );
}
