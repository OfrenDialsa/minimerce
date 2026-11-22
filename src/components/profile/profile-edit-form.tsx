"use client";

import { useState, useTransition, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateUserProfileAction } from "@/actions/users.action"; // sesuaikan path file action profilmu
import type { UserProfile } from "@/types/user.types";

export interface AddressOption {
  id: number;
  label: string;
  recipientName: string;
  addressLine: string;
  city: string;
}

interface ProfileEditFormProps {
  profile: UserProfile;
  addresses: AddressOption[];
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

export function ProfileEditForm({ profile, addresses }: ProfileEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const displayedAvatar = avatarPreview ?? profile.avatarUrl;
  const showAvatar = isSafeImageSrc(displayedAvatar);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setAvatarPreview(null);
      return;
    }
    setAvatarPreview(URL.createObjectURL(file));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await updateUserProfileAction(formData);
        if (result.error) {
          setFeedback({ type: "error", text: result.error });
          return;
        }
        setFeedback({
          type: "success",
          text: result.message ?? "Profil berhasil diperbarui.",
        });
        setAvatarPreview(null);
        router.refresh();
      } catch {
        setFeedback({
          type: "error",
          text: "Terjadi kesalahan saat menyimpan profil.",
        });
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-lg border border-gray-200 bg-white p-5 sm:p-6"
    >
      {/* Avatar & Preview */}
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-center">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-orange-50">
          {showAvatar && displayedAvatar ? (
            <Image
              src={displayedAvatar}
              alt={profile.name}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[#ee4d2d]">
              {profile.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1">
          <label
            htmlFor="avatar"
            className="block text-xs font-semibold text-gray-800"
          >
            Foto Profil (Avatar)
          </label>
          <input
            id="avatar"
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={isPending}
            onChange={handleAvatarChange}
            className="mt-1.5 block w-full cursor-pointer rounded-lg border border-gray-300 bg-white text-xs text-gray-700 file:mr-3 file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#ee4d2d] hover:file:bg-orange-100 disabled:opacity-50"
          />
          <p className="mt-1 text-[11px] text-gray-500">
            Opsional • JPG, PNG, WebP, atau GIF (maksimal 2 MB).
          </p>
        </div>
      </div>

      {/* Email (Read-only) */}
      <div>
        <label
          htmlFor="email"
          className="block text-xs font-medium text-gray-700"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={profile.email}
          disabled
          readOnly
          className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500"
        />
      </div>

      {/* Nama Lengkap */}
      <div>
        <label
          htmlFor="name"
          className="block text-xs font-medium text-gray-700"
        >
          Nama Lengkap <span className="text-[#ee4d2d]">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={120}
          defaultValue={profile.name}
          disabled={isPending}
          placeholder="Masukkan nama lengkap"
          className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-[#ee4d2d] focus:outline-none disabled:bg-gray-50"
        />
      </div>

      {/* Nomor Telepon */}
      <div>
        <label
          htmlFor="phone"
          className="block text-xs font-medium text-gray-700"
        >
          Nomor Telepon
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={profile.phone ?? ""}
          disabled={isPending}
          placeholder="Contoh: 081234567890"
          className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-[#ee4d2d] focus:outline-none disabled:bg-gray-50"
        />
      </div>

      {/* Alamat Utama */}
      <div>
        <label
          htmlFor="defaultAddressId"
          className="block text-xs font-medium text-gray-700"
        >
          Alamat Pengiriman Utama
        </label>
        <select
          id="defaultAddressId"
          name="defaultAddressId"
          defaultValue={profile.defaultAddressId ?? ""}
          disabled={isPending}
          className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-[#ee4d2d] focus:outline-none disabled:bg-gray-50"
        >
          <option value="">-- Tidak diatur --</option>
          {addresses.map((addr) => (
            <option key={addr.id} value={addr.id}>
              {addr.label} — {addr.recipientName} ({addr.city})
            </option>
          ))}
        </select>
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

      {feedback && (
        <div
          className={`rounded-lg border px-3.5 py-2.5 text-xs ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        <Link
          href="/profile"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Batal
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#ee4d2d] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#d94122] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}
