import type { ProductCardData } from "@/lib/catalog/types";
import { toGaItem } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";
import { ListTracker } from "./ListTracker";
import { ProductCard } from "./ProductCard";

/**
 * Ürün ızgarası.
 * - grid: 2 sütun (mobil) → 3 (md) → 4 (xl)
 * - rail: her ekranda yatay kaydırmalı carousel (mobil ~1,5 kart, tablet 3, geniş ekran 4 kart görünür)
 */
export function ProductGrid({
  products,
  listId,
  listName,
  layout = "grid",
  priorityCount = 0,
  className,
  scrollerId,
}: {
  products: ProductCardData[];
  listId: string;
  listName: string;
  layout?: "grid" | "rail";
  priorityCount?: number;
  className?: string;
  /** Carousel oklarının/otomatik akışın hedeflediği liste id'si (yalnız rail) */
  scrollerId?: string;
}) {
  const items = products.map((p, i) => toGaItem({ id: p.id, sku: p.sku, name: p.name, price: p.price, compareAtPrice: p.compareAtPrice, category: p.category?.name, index: i }));
  return (
    <ListTracker listId={listId} listName={listName} items={items} className={className}>
      <ul
        id={scrollerId}
        className={cn(
          layout === "rail"
            ? "scroller -mx-4 px-4 pb-4 sm:-mx-6 sm:px-6 md:mx-0 md:gap-5 md:px-0 md:scroll-px-0"
            : "grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4",
        )}
      >
        {products.map((p, i) => (
          <li key={p.id} className={cn("flex", layout === "rail" && "w-[68%] shrink-0 min-[480px]:w-[44%] md:w-[calc((100%-2.5rem)/3)] xl:w-[calc((100%-3.75rem)/4)]")}>
            <ProductCard product={p} index={i} listName={listName} priority={i < priorityCount} className="w-full" />
          </li>
        ))}
      </ul>
    </ListTracker>
  );
}
