"use client";

import { useActionState, useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  createStoreAction,
  getCurrentUserStoreAction,
  type CreateStoreActionState,
} from "@/actions/store.action";
import { getUserAddressesAction } from "@/actions/address.action";
import type { Address } from "@/database/schema";
import Button from "@/components/ui/button";

const initialState: CreateStoreActionState = {};

export default function CreateStorePage() {
  const router = useRouter();
  const [checkingStore, setCheckingStore] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [userAddresses, setUserAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [addressesError, setAddressesError] = useState<string | null>(null);

  const [state, formAction, isPending] = useActionState(
    createStoreAction,
    initialState,
  );

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      const [storeRes, addressesRes] = await Promise.all([
        getCurrentUserStoreAction(),
        getUserAddressesAction(),
      ]);

      if (!active) return;

      const storeError = storeRes.error;
      const existingStore = storeRes.data ?? null;

      if (!existingStore && storeError?.toLowerCase().includes("login")) {
        router.replace("/login");
        return;
      }

      if (existingStore) {
        router.replace("/profile/store");
        return;
      }

      setUserAddresses(addressesRes.data ?? []);
      setAddressesError(addressesRes.error ?? null);

      const defaultAddr =
        (addressesRes.data ?? []).find((item) => item.isDefault) ??
        (addressesRes.data ?? [])[0];
      if (defaultAddr) {
        setSelectedAddressId(String(defaultAddr.id));
      }

      setCheckingStore(false);
    }

    checkAccess();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (state.data) {
      router.push("/profile/store");
      router.refresh();
    }
  }, [state.data, router]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
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

  const chosenAddress =
    userAddresses.find((item) => String(item.id) === selectedAddressId) ?? null;

  if (checkingStore) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-sm text-gray-500">Memeriksa status akun...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Buat Toko Baru</h1>
        <p className="mt-1 text-sm text-gray-600">
          Lengkapi informasi dasar untuk mulai membuka tokomu.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
        {state.error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {state.error}
          </div>
        )}

        <form
          action={formAction}
          className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start lg:gap-8"
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-900"
              >
                Nama Toko <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                minLength={2}
                maxLength={100}
                disabled={isPending}
                placeholder="Contoh: Toko Kopi Kerinci Jaya"
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none disabled:bg-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500">
                Slug URL akan dibuat otomatis dari nama toko dan dipastikan
                unik.
              </p>
              {state.fieldErrors?.name?.[0] && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {state.fieldErrors.name[0]}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-900"
              >
                Deskripsi Toko
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                maxLength={500}
                disabled={isPending}
                placeholder="Ceritakan singkat tentang produk atau layanan toko kamu..."
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none disabled:bg-gray-100"
              />
              {state.fieldErrors?.description?.[0] && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {state.fieldErrors.description[0]}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="logo"
                className="block text-sm font-medium text-gray-900"
              >
                Logo Toko
              </label>
              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={isPending}
                onChange={handleLogoChange}
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-gray-800 hover:file:bg-gray-200 focus:border-black focus:outline-none disabled:bg-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500">
                Format JPG, PNG, WebP, atau GIF (maksimal 2 MB).
              </p>

              {previewUrl && (
                <div className="mt-3 flex items-center gap-3">
                  <Image
                    src={previewUrl}
                    alt="Preview logo toko"
                    width={60}
                    height={60}
                    unoptimized
                    className="h-16 w-16 rounded-lg border border-gray-200 object-cover"
                  />
                  <span className="text-xs text-gray-500">Pratinjau logo</span>
                </div>
              )}

              {state.fieldErrors?.logoUrl?.[0] && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {state.fieldErrors.logoUrl[0]}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4 border-t pt-5 lg:border-t-0 lg:pt-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Pilih Alamat Toko
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Pilih salah satu alamat yang sudah kamu buat di akun ini.
                </p>
              </div>
              <Link
                href="/addresses/create"
                className="shrink-0 text-xs font-semibold text-[#ee4d2d] hover:underline"
              >
                + Buat Alamat Baru
              </Link>
            </div>

            {addressesError && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
                {addressesError}
              </div>
            )}

            <div>
              <label
                htmlFor="activeAddressId"
                className="block text-sm font-medium text-gray-900"
              >
                Alamat Tersimpan
              </label>
              <select
                id="activeAddressId"
                name="activeAddressId"
                value={selectedAddressId}
                disabled={isPending || userAddresses.length === 0}
                onChange={(e) => setSelectedAddressId(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-black focus:outline-none disabled:bg-gray-100"
              >
                <option value="">
                  {userAddresses.length === 0
                    ? "Belum ada alamat tersimpan"
                    : "-- Pilih alamat toko --"}
                </option>
                {userAddresses.map((addr) => (
                  <option key={addr.id} value={String(addr.id)}>
                    {addr.label} — {addr.recipientName} ({addr.city},{" "}
                    {addr.postalCode}){addr.isDefault ? " [Utama]" : ""}
                  </option>
                ))}
              </select>
              {state.fieldErrors?.activeAddressId?.[0] && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {state.fieldErrors.activeAddressId[0]}
                </p>
              )}
            </div>

            {chosenAddress ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-4 text-xs text-gray-700">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-gray-900">
                    {chosenAddress.label}
                  </span>
                  {chosenAddress.isDefault && (
                    <span className="rounded-xs border border-[#ee4d2d]/30 bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#ee4d2d]">
                      Utama
                    </span>
                  )}
                  <span>•</span>
                  <span className="font-medium text-gray-800">
                    {chosenAddress.recipientName}
                  </span>
                  <span>•</span>
                  <span>{chosenAddress.phone}</span>
                </div>
                <p className="mt-2 text-sm text-gray-900">
                  {chosenAddress.addressLine}
                </p>
                <p className="mt-1 text-gray-500">
                  {[
                    chosenAddress.village
                      ? `Desa/Kel. ${chosenAddress.village}`
                      : null,
                    chosenAddress.district
                      ? `Kec. ${chosenAddress.district}`
                      : null,
                    chosenAddress.city,
                    chosenAddress.province,
                    chosenAddress.postalCode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 p-4 text-xs text-gray-500">
                Belum ada alamat yang dipilih. Silakan pilih alamat di atas atau{" "}
                <Link
                  href="/addresses/create"
                  className="font-semibold text-[#ee4d2d] hover:underline"
                >
                  tambah alamat baru
                </Link>{" "}
                terlebih dahulu.
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-4 lg:col-span-2">
            <Button
              type="submit"
              disabled={isPending}
              variant="outline"
              loadingText="Menyimpan"
            >
              Buat Toko
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
