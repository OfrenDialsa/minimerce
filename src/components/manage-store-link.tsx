import Link from "next/link";

interface ManageStoreLinkProps {
  isOwner: boolean;
  hideWhenNotOwner?: boolean;
}

export function ManageStoreLink({
  isOwner,
  hideWhenNotOwner = true,
}: ManageStoreLinkProps) {
  if (!isOwner && hideWhenNotOwner) {
    return null;
  }

  if (!isOwner) {
    return (
      <span
        aria-disabled="true"
        title="Hanya tersedia untuk pemilik toko"
        className="inline-flex cursor-not-allowed select-none items-center border border-gray-200 bg-gray-100 px-3.5 py-2 text-xs font-semibold text-gray-400 opacity-70"
      >
        Kelola Toko
      </span>
    );
  }

  return (
    <Link
      href="/profile/store"
      className="inline-flex items-center border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
    >
      Kelola Toko
    </Link>
  );
}
