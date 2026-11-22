import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getUserProfileAction } from "@/actions/users.action"; // sesuaikan path file action profilmu
import { db } from "@/database";
import { addresses } from "@/database/schema";
import {
  ProfileEditForm,
  type AddressOption,
} from "@/components/profile/profile-edit-form";

async function loadUserAddressOptions(
  userId: number,
): Promise<AddressOption[]> {
  return db
    .select({
      id: addresses.id,
      label: addresses.label,
      recipientName: addresses.recipientName,
      addressLine: addresses.addressLine,
      city: addresses.city,
    })
    .from(addresses)
    .where(eq(addresses.userId, userId))
    .orderBy(asc(addresses.id));
}

async function ProfileEditContent() {
  await connection();
  const result = await getUserProfileAction();

  if (result.error || !result.data) {
    if (!result.data) {
      redirect("/login");
    }

    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700">
        {result.error}
      </div>
    );
  }

  const addressOptions = await loadUserAddressOptions(result.data.id);

  return <ProfileEditForm profile={result.data} addresses={addressOptions} />;
}

function ProfileEditFallback() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 text-xs text-gray-500">
      Memuat form edit profil...
    </div>
  );
}

export default function ProfileEditPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edit Profil</h1>
          <p className="mt-1 text-xs text-gray-500">
            Perbarui informasi akun, foto profil, dan alamat utama kamu di
            Minimerce.
          </p>
        </div>
        <Link
          href="/profile"
          className="rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          ← Kembali
        </Link>
      </div>

      <Suspense fallback={<ProfileEditFallback />}>
        <ProfileEditContent />
      </Suspense>
    </div>
  );
}
