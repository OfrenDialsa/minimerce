import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/database";
import { addresses, stores } from "@/database/schema";
import { getCurrentUserId } from "@/lib/get-current-userid";
import {
  StoreEditForm,
  type StoreAddressOption,
} from "@/components/store/store-edit-form";

async function loadOwnedStoreAndAddresses(userId: number) {
  const [ownedStore] = await db
    .select({
      id: stores.id,
      publicId: stores.publicId,
      slug: stores.slug,
      name: stores.name,
      description: stores.description,
      logoUrl: stores.logoUrl,
      activeAddressId: stores.activeAddressId,
      isActive: stores.isActive,
    })
    .from(stores)
    .where(eq(stores.userId, userId))
    .limit(1);

  if (!ownedStore) {
    return { store: null, addresses: [] as StoreAddressOption[] };
  }

  const userAddresses = await db
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

  return { store: ownedStore, addresses: userAddresses };
}

async function StoreEditContent() {
  await connection();
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/login");
  }

  const { store, addresses } = await loadOwnedStoreAndAddresses(userId);

  if (!store) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <h2 className="text-base font-semibold text-gray-900">
          Kamu belum memiliki toko
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          Buat toko terlebih dahulu sebelum mengatur informasi atau logo toko.
        </p>
        <Link
          href="/profile/store/create"
          className="mt-4 inline-flex rounded-lg bg-[#ee4d2d] px-4 py-2 text-xs font-semibold text-white hover:bg-[#d94122]"
        >
          Buat Toko Sekarang
        </Link>
      </div>
    );
  }

  return <StoreEditForm store={store} addresses={addresses} />;
}

function StoreEditFallback() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 text-xs text-gray-500">
      Memuat form edit toko...
    </div>
  );
}

export default function StoreEditPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edit Toko</h1>
          <p className="mt-1 text-xs text-gray-500">
            Perbarui nama, deskripsi, logo, alamat operasional, dan status toko
            kamu di Minimerce.
          </p>
        </div>
        <Link
          href="/profile/store"
          className="rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          ← Kembali
        </Link>
      </div>

      <Suspense fallback={<StoreEditFallback />}>
        <StoreEditContent />
      </Suspense>
    </div>
  );
}
