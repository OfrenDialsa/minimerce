"use client";
import { loginAction } from "@/actions/auth.action";
import { signIn } from "next-auth/react";
import Input from "@/components/ui/input";
import { useActionState } from "react";
import Button from "@/components/ui/button";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Login
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Silakan isi email dan password akun yang sudah terdaftar
          </p>
        </div>

        {state?.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
            <span>{state.error}</span>
          </div>
        )}

        {state?.success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg">
            {state.success}
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

          <Input
            label="Password"
            name="password"
            isPassword={true}
            placeholder="Masukkan password"
            required
            disabled={isPending}
            helperText="Gunakan kombinasi huruf, angka, dan simbol."
          />

          <Button
            type="submit"
            isLoading={isPending}
            loadingText="Loading..."
            className="w-full mt-2"
          >
            Login
          </Button>
        </form>
        <p className="text-sm text-end text-gray-500 mt-2">
          <a
            href="/forgot-password"
            className="font-medium text-orange-600 hover:text-orange-500 underline"
          >
            lupa password
          </a>
        </p>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400 font-medium">
              Atau
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full py-2.5 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm focus:outline-none focus:ring-4 focus:ring-gray-200"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.36 7.23 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.12 0 9.87 0 12s.43 3.88 1.19 5.42l4.09-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.17 2.64 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Login dengan Google</span>
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Belum punya akun?{" "}
          <a
            href="/register"
            className="font-medium text-orange-600 hover:text-orange-500 underline"
          >
            Daftar di sini
          </a>
        </p>
      </div>
    </div>
  );
}
