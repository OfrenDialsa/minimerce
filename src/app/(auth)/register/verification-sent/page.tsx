"use client";

import { Suspense, useActionState, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { resendVerificationEmailAction } from "@/actions/auth.action";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

function VerificationSentContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";
  const [email, setEmail] = useState(initialEmail);
  const [state, formAction, isPending] = useActionState(
    resendVerificationEmailAction,
    null,
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Cek Email Verifikasi
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Kami telah mengirimkan tautan verifikasi akun{" "}
            <span className="font-medium text-gray-800">
              {email || "email Anda"}
            </span>
            . Klik tautan di email tersebut sebelum login ke minimerce.
          </p>
        </div>

        {state?.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            <span>{state.error}</span>
          </div>
        )}

        {state?.success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg">
            <span>{state.success}</span>
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <Input
            label="Alamat Email"
            name="email"
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isPending}
          />

          <Button
            type="submit"
            isLoading={isPending}
            loadingText="Mengirim..."
            className="w-full mt-2"
          >
            Kirim ulang email verifikasi
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
          <Link
            href="/register"
            className="font-medium text-gray-600 hover:text-gray-900 underline"
          >
            Daftar ulang
          </Link>
          <Link
            href="/login"
            className="font-medium text-orange-600 hover:text-orange-500 underline"
          >
            Ke halaman Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerificationSentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-50 text-sm text-gray-500">
          Memuat...
        </div>
      }
    >
      <VerificationSentContent />
    </Suspense>
  );
}
