import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function VerifiedSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100 text-center">
        {/* Ikon Sukses */}
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="h-16 w-16 text-orange-500" />
        </div>

        {/* Teks Informasi */}
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
          Akun Berhasil Divalidasi!
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Selamat! Email Anda telah dikonfirmasi. Akun Anda kini sudah aktif dan
          siap digunakan.
        </p>

        {/* Tombol Masuk */}
        <Link
          href="/login"
          className="w-full inline-block py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20"
        >
          Masuk ke Akun
        </Link>
      </div>
    </div>
  );
}
