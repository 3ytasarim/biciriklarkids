"use client";

import { useEffect, useState } from "react";
import type { ProductCardData } from "@/lib/catalog/types";
import { ProductCard } from "./ProductCard";

/** Son görüntülenenler — ürün kimlikleri yalnızca bu cihazın localStorage'ında; yoksa bölüm görünmez. */
export function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const [items, setItems] = useState<ProductCardData[]>([]);
  useEffect(() => {
    let ids: string[] = [];
    try {
      ids = (JSON.parse(localStorage.getItem("bk_recent") ?? "[]") as string[]).filter((id) => id !== excludeId).slice(0, 8);
    } catch {
      return;
    }
    if (!ids.length) return;
    fetch(`/api/products/preview?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((j) => j.ok && setItems(j.products))
      .catch(() => {});
  }, [excludeId]);

  if (!items.length) return null;
  return (
    <section aria-labelledby="recent-title" className="py-12 sm:py-16">
      <div className="shell">
        <h2 id="recent-title" className="display-3">Son görüntülenenler</h2>
        <ul className="scroller -mx-4 mt-8 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:px-0">
          {items.slice(0, 4).map((p, i) => (
            <li key={p.id} className="flex w-[62%] shrink-0 min-[480px]:w-[42%] lg:w-auto">
              <ProductCard product={p} index={i} listName="Son görüntülenenler" className="w-full" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
