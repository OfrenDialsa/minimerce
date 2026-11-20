"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { resetPasswordAction } from "@/actions/auth.action";
import Input from "@/components/ui/input";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const uid = searchParams.get("uid") ?? "";

  const [state, formAction, isPending] = useActionState(
    resetPasswordAction,
    null,
  );

  const isMissingParams = !token || !uid;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Atur Ulang Password
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Masukkan password baru untuk akun minimerce Anda
          </p>
        </div>

        {isMissingParams && !state?.success && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg">
            Tautan reset password tidak lengkap atau tidak valid. Silakan minta
            tautan baru melalui halaman{" "}
            <Link
              href="/forgot-password"
              className="font-medium underline hover:text-amber-900"
            >
              Lupa Password
            </Link>
            .
          </div>
        )}

        {state?.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            <span>{state.error}</span>
          </div>
        )}

        {state?.success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg space-y-2">
            <p>{state.success}</p>
            <div>
              <Link
                href="/login"
                className="font-semibold underline hover:text-emerald-800"
              >
                Masuk ke akun Anda
              </Link>
            </div>
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="uid" value={uid} />

          <Input
            label="Password Baru"
            name="password"
            isPassword={true}
            placeholder="Minimal 8 karakter"
            required
            disabled={isPending || Boolean(state?.success)}
            helperText="Gunakan minimal 8 karakter."
          />

          <Input
            label="Konfirmasi Password Baru"
            name="confirmPassword"
            isPassword={true}
            placeholder="Ulangi password baru"
            required
            disabled={isPending || Boolean(state?.success)}
          />

          <button
            type="submit"
            disabled={isPending || isMissingParams || Boolean(state?.success)}
            className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isPending ? "Menyimpan..." : "Simpan Password Baru"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-500 underline"
          >
            Kembali ke Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-50 text-sm text-gray-500">
          Memuat...
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
