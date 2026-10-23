import type { ProductCardData } from "@/lib/catalog/types";
import { toGaItem } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";
import { ListTracker } from "./ListTracker";
import { ProductCard } from "./ProductCard";

/**
 * Ürün ızgarası.
 * - grid: 2 sütun (mobil) → 3 (md) → 4 (xl)
 * - rail: mobilde yatay kaydırmalı şerit (sayfa sonsuz ızgaraya dönmesin), masaüstünde ızgara
 */
export function ProductGrid({
  products,
  listId,
  listName,
  layout = "grid",
  priorityCount = 0,
  className,
}: {
  products: ProductCardData[];
  listId: string;
  listName: string;
  layout?: "grid" | "rail";
  priorityCount?: number;
  className?: string;
}) {
  const items = products.map((p, i) => toGaItem({ id: p.id, sku: p.sku, name: p.name, price: p.price, compareAtPrice: p.compareAtPrice, category: p.category?.name, index: i }));
  return (
    <ListTracker listId={listId} listName={listName} items={items} className={className}>
      <ul
        className={cn(
          layout === "rail"
            ? "scroller -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:gap-x-5 md:gap-y-10 md:overflow-visible md:px-0 xl:grid-cols-4"
            : "grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4",
        )}
      >
        {products.map((p, i) => (
          <li key={p.id} className={cn("flex", layout === "rail" && "w-[68%] shrink-0 min-[480px]:w-[44%] md:w-auto")}>
            <ProductCard product={p} index={i} listName={listName} priority={i < priorityCount} className="w-full" />
          </li>
        ))}
      </ul>
    </ListTracker>
  );
}
