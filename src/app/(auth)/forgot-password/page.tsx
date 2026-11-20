"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction } from "@/actions/auth.action";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(
    forgotPasswordAction,
    null,
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Lupa Password
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Masukkan email akun minimerce Anda untuk menerima tautan reset
            password
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
            label="Email"
            name="email"
            type="email"
            placeholder="nama@email.com"
            required
            disabled={isPending}
          />

          <Button
            type="submit"
            isLoading={isPending}
            loadingText="Mengirim..."
            className="w-full mt-2"
          >
            Kirim Tautan Reset
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Sudah ingat password Anda?{" "}
          <Link
            href="/login"
            className="font-medium text-orange-600 hover:text-orange-500 underline"
          >
            Kembali ke Login
          </Link>
        </p>
      </div>
    </div>
  );
}
