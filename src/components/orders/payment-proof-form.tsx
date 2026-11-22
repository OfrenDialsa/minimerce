"use client";

import { useState, useTransition, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { submitPaymentProofAction } from "@/actions/order.action";

interface PaymentProofFormProps {
  orderPublicId: string;
  currentProofUrl: string | null;
  currentNotes: string | null;
  currentUploadedAt: Date | string | null;
  canUpload: boolean;
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

function formatUploadedAt(dateInput: Date | string | null) {
  if (!dateInput) return null;
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function PaymentProofForm({
  orderPublicId,
  currentProofUrl,
  currentNotes,
  currentUploadedAt,
  canUpload,
}: PaymentProofFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const displayedImageUrl = previewUrl ?? currentProofUrl;
  const showImage = isSafeImageSrc(displayedImageUrl);
  const formattedUploaded = formatUploadedAt(currentUploadedAt);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canUpload) return;

    setFeedback(null);
    const formData = new FormData(e.currentTarget);
    formData.set("publicId", orderPublicId);

    startTransition(async () => {
      try {
        const result = await submitPaymentProofAction(formData);
        if (!result.ok) {
          setFeedback({ type: "error", text: result.error });
          return;
        }
        setFeedback({ type: "success", text: result.message });
        setPreviewUrl(null);
        router.refresh();
      } catch {
        setFeedback({
          type: "error",
          text: "Terjadi kesalahan saat mengunggah bukti pembayaran.",
        });
      }
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-900">
          Bukti Pembayaran
        </h2>
        {currentProofUrl ? (
          <span className="rounded-xs border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            Sudah Diunggah
          </span>
        ) : (
          <span className="rounded-xs border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-500">
            Belum Ada
          </span>
        )}
      </div>

      {/* Preview Bukti Pembayaran (tersimpan atau file baru yang dipilih) */}
      {showImage && displayedImageUrl ? (
        <div className="mt-3 space-y-2">
          <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            <Image
              src={displayedImageUrl}
              alt={`Bukti pembayaran pesanan ${orderPublicId}`}
              fill
              unoptimized
              className="object-contain"
            />
          </div>
          {formattedUploaded && !previewUrl && (
            <p className="text-[11px] text-gray-500">
              Diunggah pada {formattedUploaded}
            </p>
          )}
        </div>
      ) : null}

      {/* Catatan Pembayaran yang Sudah Tersimpan */}
      {currentNotes && (
        <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs">
          <p className="text-[11px] font-medium text-gray-500">
            Catatan Pembayaran
          </p>
          <p className="mt-0.5 whitespace-pre-line text-gray-800">
            {currentNotes}
          </p>
        </div>
      )}

      {/* Form Upload / Ganti Bukti saat Pembeli & Status PENDING */}
      {canUpload ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label
              htmlFor="paymentProof"
              className="block text-xs font-medium text-gray-700"
            >
              {currentProofUrl
                ? "Ganti Screenshot / Foto Bukti"
                : "Upload Screenshot / Foto Bukti"}
            </label>
            <input
              id="paymentProof"
              name="paymentProof"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              required={!currentProofUrl}
              disabled={isPending}
              onChange={handleFileChange}
              className="mt-1.5 block w-full cursor-pointer rounded-lg border border-gray-300 bg-white text-xs text-gray-700 file:mr-3 file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#ee4d2d] hover:file:bg-orange-100 disabled:opacity-50"
            />
            <p className="mt-1 text-[11px] text-gray-500">
              Format JPG, PNG, WebP, atau GIF • Maksimal 2 MB.
            </p>
          </div>

          <div>
            <label
              htmlFor="paymentNotes"
              className="block text-xs font-medium text-gray-700"
            >
              Catatan Pembayaran (Opsional)
            </label>
            <textarea
              id="paymentNotes"
              name="paymentNotes"
              rows={2}
              defaultValue={currentNotes ?? ""}
              disabled={isPending}
              placeholder="Contoh: Transfer a.n. Budi via BCA jam 14.20"
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-[#ee4d2d] focus:outline-none disabled:bg-gray-50"
            />
          </div>

          {feedback && (
            <div
              className={`rounded-lg border px-3 py-2 text-xs ${
                feedback.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {feedback.text}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-[#ee4d2d] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#d94122] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending
              ? "Mengunggah Bukti..."
              : currentProofUrl
                ? "Simpan Bukti Baru"
                : "Kirim Bukti Pembayaran"}
          </button>
        </form>
      ) : (
        !currentProofUrl && (
          <p className="mt-3 rounded-lg border border-dashed border-gray-300 p-3 text-xs text-gray-500">
            Belum ada bukti pembayaran yang dilampirkan pada pesanan ini.
          </p>
        )
      )}
    </div>
  );
}
