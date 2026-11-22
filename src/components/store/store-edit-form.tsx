"use client";

import {
  useActionState,
  useEffect,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  updateStoreAction,
  type UpdateStoreActionState,
} from "@/actions/store.action"; // sesuaikan path file action toko milikmu

export interface StoreEditData {
  id: number;
  publicId: string | null;
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  activeAddressId: number | null;
  isActive: boolean;
}

export interface StoreAddressOption {
  id: number;
  label: string;
  recipientName: string;
  addressLine: string;
  city: string;
}

interface StoreEditFormProps {
  store: StoreEditData;
  addresses: StoreAddressOption[];
}

function isSafeImageSrc(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith("/") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://")
  );
}

const INITIAL_STATE: UpdateStoreActionState = {};

export function StoreEditForm({ store, addresses }: StoreEditFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateStoreAction, INITIAL_STATE);
  const [isPending, startTransition] = useTransition();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState(0);

  const currentLogoUrl = state.data?.logoUrl ?? store.logoUrl;
  const displayedLogo = logoPreview ?? currentLogoUrl;
  const showLogo = isSafeImageSrc(displayedLogo);

  useEffect(() => {
    if (submittedAt > 0 && state.data && !state.error) {
      router.refresh();
    }
  }, [submittedAt, state.data, state.error, router]);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setLogoPreview(null);
      return;
    }
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(() => {
      setSubmittedAt(Date.now());
      setLogoPreview(null);
      formAction(formData);
    });
  }

  const busy = isPending;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-lg border border-gray-200 bg-white p-5 sm:p-6"
    >
      {/* Logo & Preview */}
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-center">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-orange-50">
          {showLogo && displayedLogo ? (
            <Image
              src={displayedLogo}
              alt={store.name}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[#ee4d2d]">
              {store.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1">
          <label
            htmlFor="logo"
            className="block text-xs font-semibold text-gray-800"
          >
            Logo Toko
          </label>
          <input
            id="logo"
            name="logo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={busy}
            onChange={handleLogoChange}
            className="mt-1.5 block w-full cursor-pointer rounded-lg border border-gray-300 bg-white text-xs text-gray-700 file:mr-3 file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#ee4d2d] hover:file:bg-orange-100 disabled:opacity-50"
          />
          <p className="mt-1 text-[11px] text-gray-500">
            Opsional • JPG, PNG, WebP, atau GIF (maksimal 2 MB). Slug toko:{" "}
            <span className="font-mono">/store/{store.slug}</span>
          </p>
          {state.fieldErrors?.logoUrl?.[0] && (
            <p className="mt-1 text-xs text-red-600">
              {state.fieldErrors.logoUrl[0]}
            </p>
          )}
        </div>
      </div>

      {/* Nama Toko */}
      <div>
        <label
          htmlFor="name"
          className="block text-xs font-medium text-gray-700"
        >
          Nama Toko <span className="text-[#ee4d2d]">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={100}
          defaultValue={state.data?.name ?? store.name}
          disabled={busy}
          placeholder="Masukkan nama toko"
          className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-[#ee4d2d] focus:outline-none disabled:bg-gray-50"
        />
        {state.fieldErrors?.name?.[0] && (
          <p className="mt-1 text-xs text-red-600">
            {state.fieldErrors.name[0]}
          </p>
        )}
      </div>

      {/* Deskripsi Toko */}
      <div>
        <label
          htmlFor="description"
          className="block text-xs font-medium text-gray-700"
        >
          Deskripsi Toko
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={500}
          defaultValue={state.data?.description ?? store.description ?? ""}
          disabled={busy}
          placeholder="Ceritakan produk dan layanan toko kamu (maksimal 500 karakter)"
          className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-[#ee4d2d] focus:outline-none disabled:bg-gray-50"
        />
        {state.fieldErrors?.description?.[0] && (
          <p className="mt-1 text-xs text-red-600">
            {state.fieldErrors.description[0]}
          </p>
        )}
      </div>

      {/* Alamat Aktif Toko */}
      <div>
        <label
          htmlFor="activeAddressId"
          className="block text-xs font-medium text-gray-700"
        >
          Alamat Operasional / Pengiriman Toko
        </label>
        <select
          id="activeAddressId"
          name="activeAddressId"
          defaultValue={
            state.data?.activeAddressId !== undefined
              ? (state.data.activeAddressId ?? "")
              : (store.activeAddressId ?? "")
          }
          disabled={busy}
          className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-[#ee4d2d] focus:outline-none disabled:bg-gray-50"
        >
          <option value="">-- Tidak diatur --</option>
          {addresses.map((addr) => (
            <option key={addr.id} value={addr.id}>
              {addr.label} — {addr.recipientName} ({addr.city})
            </option>
          ))}
        </select>
        {state.fieldErrors?.activeAddressId?.[0] && (
          <p className="mt-1 text-xs text-red-600">
            {state.fieldErrors.activeAddressId[0]}
          </p>
        )}
        {addresses.length === 0 && (
          <p className="mt-1 text-[11px] text-gray-500">
            Belum ada alamat tersimpan.{" "}
            <Link
              href="/profile/addresses"
              className="font-semibold text-[#ee4d2d] hover:underline"
            >
              Tambah alamat
            </Link>
          </p>
        )}
      </div>

      {/* Status Aktif Toko */}
      <div>
        <label
          htmlFor="isActive"
          className="block text-xs font-medium text-gray-700"
        >
          Status Toko
        </label>
        <select
          id="isActive"
          name="isActive"
          defaultValue={String(
            state.data?.isActive !== undefined
              ? state.data.isActive
              : store.isActive,
          )}
          disabled={busy}
          className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-[#ee4d2d] focus:outline-none disabled:bg-gray-50"
        >
          <option value="true">Aktif (Buka)</option>
          <option value="false">Nonaktif (Tutup Sementara)</option>
        </select>
        {state.fieldErrors?.isActive?.[0] && (
          <p className="mt-1 text-xs text-red-600">
            {state.fieldErrors.isActive[0]}
          </p>
        )}
      </div>

      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
          {state.error}
        </div>
      )}

      {state.message && !state.error && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800">
          {state.message}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        <Link
          href="/profile/store"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Batal
        </Link>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-[#ee4d2d] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#d94122] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Menyimpan..." : "Simpan Perubahan Toko"}
        </button>
      </div>
    </form>
  );
}
