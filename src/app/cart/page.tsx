import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/database";
import { addresses } from "@/database/schema";
import { getCartItemsByUserId } from "@/actions/cart-item.action";
import { MyCartClient } from "@/components/cart/my-cart-client";

async function CartContent() {
  await connection();
  const session = await auth();
  const userId = Number(session?.user?.id);

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    redirect("/login");
  }

  const [cartRows, userAddresses] = await Promise.all([
    getCartItemsByUserId(userId),
    db
      .select({
        id: addresses.id,
        label: addresses.label,
        recipientName: addresses.recipientName,
        phone: addresses.phone,
        addressLine: addresses.addressLine,
        village: addresses.village,
        district: addresses.district,
        city: addresses.city,
        province: addresses.province,
        postalCode: addresses.postalCode,
        isDefault: addresses.isDefault,
      })
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(desc(addresses.isDefault), desc(addresses.id)),
  ]);

  return <MyCartClient items={cartRows} userAddresses={userAddresses} />;
}

function CartFallback() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 text-xs text-gray-500">
      Memuat keranjang belanja...
    </div>
  );
}

export default function MyCartPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Cart</h1>
        <p className="mt-1 text-xs text-gray-500">
          Daftar produk yang sudah dimasukkan ke keranjang. Pilih produk dan
          alamat pengiriman untuk membuat pesanan.
        </p>
      </div>

      <Suspense fallback={<CartFallback />}>
        <CartContent />
      </Suspense>
    </div>
  );
}
