import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100 text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
          Verifikasi Gagal
        </h1>
        <p className="text-sm text-red-600 mb-6">
          {message || "Terjadi kesalahan saat memverifikasi akun Anda."}
        </p>
        <Link
          href="/login"
          className="w-full inline-block py-2.5 px-4 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          Kembali ke Halaman Masuk
        </Link>
      </div>
    </div>
  );
}
