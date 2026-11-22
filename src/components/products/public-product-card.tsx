import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/database/schema";

interface PublicProductCardProps {
  product: Product & { storeSlug?: string | null };
  storeSlug?: string | null;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function isSafeImageSrc(url: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith("/") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://")
  );
}

export function PublicProductCard({
  product,
  storeSlug,
}: PublicProductCardProps) {
  const showImage = isSafeImageSrc(product.imageUrl);
  const isOutOfStock = product.stock <= 0;
  const resolvedStoreSlug = storeSlug ?? product.storeSlug ?? "";
  const productHref = resolvedStoreSlug
    ? `/store/${encodeURIComponent(resolvedStoreSlug)}/products/${encodeURIComponent(product.slug)}`
    : null;

  const cardBody = (
    <>
      <div>
        <div className="relative aspect-square w-full overflow-hidden border border-gray-100 bg-gray-50">
          {showImage && product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-orange-50/50 text-lg font-bold text-[#ee4d2d]">
              {product.name.slice(0, 2).toUpperCase()}
            </div>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45">
              <span className="border border-white/80 bg-gray-900/90 px-2.5 py-1 text-[11px] font-semibold text-white">
                Stok Habis
              </span>
            </div>
          )}
        </div>

        <div className="mt-3">
          {product.category && (
            <span className="inline-block border border-[#ee4d2d]/25 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-[#ee4d2d]">
              {product.category}
            </span>
          )}

          <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-[#ee4d2d] transition-colors">
            {product.name}
          </h3>

          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <span className="text-sm font-bold text-[#ee4d2d]">
              {formatRupiah(product.price)}
            </span>
            <span className="text-[11px] font-medium text-gray-500">
              {isOutOfStock ? "Habis" : `Stok ${product.stock}`}
            </span>
          </div>

          {product.description && (
            <p className="mt-1.5 line-clamp-2 text-xs text-gray-500">
              {product.description}
            </p>
          )}
        </div>
      </div>
    </>
  );

  const cardClassName =
    "group flex h-full flex-col justify-between border border-gray-200 bg-white p-3.5 transition-colors hover:border-[#ee4d2d]";

  if (!productHref) {
    return <article className={cardClassName}>{cardBody}</article>;
  }

  return (
    <article className="h-full">
      <Link href={productHref} className={cardClassName}>
        {cardBody}
      </Link>
    </article>
  );
}
