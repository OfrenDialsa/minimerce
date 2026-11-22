import Image from "next/image";
import type { Product } from "@/database/schema";
import { ProductCardActions } from "@/components/products/product-card-action";

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

export function ProductCard({ product }: { product: Product }) {
  const showImage = isSafeImageSrc(product.imageUrl);
  const outOfStock = product.stock <= 0;

  return (
    <article className="flex h-full flex-col justify-between border border-gray-200 bg-white p-3.5 transition-colors hover:border-[#ee4d2d]/60">
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

          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {product.isArchived ? (
              <span className="border border-gray-300 bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-gray-700">
                Diarsipkan
              </span>
            ) : (
              <span className="border border-emerald-200 bg-emerald-50/95 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Aktif
              </span>
            )}
          </div>
        </div>

        <div className="mt-3">
          <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">
            {product.name}
          </h3>

          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <span className="text-sm font-bold text-[#ee4d2d]">
              {formatRupiah(product.price)}
            </span>
            <span
              className={`text-[11px] font-medium ${
                outOfStock ? "text-red-600" : "text-gray-500"
              }`}
            >
              Stok: {product.stock}
            </span>
          </div>

          {product.description && (
            <p className="mt-1.5 line-clamp-2 text-xs text-gray-500">
              {product.description}
            </p>
          )}
        </div>
      </div>

      <ProductCardActions
        productId={product.id}
        isArchived={product.isArchived}
      />
    </article>
  );
}
