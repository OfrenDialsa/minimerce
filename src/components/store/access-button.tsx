import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/database";
import { stores } from "@/database/schema";

export async function StoreAccessButton() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const uid =
    (session.user as { uid?: number | string; id?: string }).uid ??
    session.user.id;
  const numericUserId = Number(uid);

  let hasStore = false;
  if (Number.isFinite(numericUserId) && numericUserId > 0) {
    const [store] = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.userId, numericUserId))
      .limit(1);

    hasStore = Boolean(store);
  }

  if (hasStore) {
    return (
      <Link
        href="/profile/store"
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#ee4d2d] px-3.5 py-2.5 text-sm font-semibold text-white shadow-2xs transition-colors hover:bg-[#d73211]"
      >
        <span>Toko Saya</span>
      </Link>
    );
  }

  return (
    <Link
      href="/profile/store/create"
      className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[#ee4d2d] bg-orange-50 px-3.5 py-2.5 text-sm font-semibold text-[#ee4d2d] transition-colors hover:bg-orange-100"
    >
      <span>Buat Toko Mu Sendiri</span>
    </Link>
  );
}
