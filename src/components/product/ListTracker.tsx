"use client";

import { useEffect, useRef } from "react";
import { trackEcommerce, type GaItem } from "@/lib/analytics/events";

/**
 * Ürün listesi analitiği: liste görünür olunca bir kez `view_item_list`, karttaki ürün linkine tıklanınca
 * `select_item`. Tüm kartlar için TEK dinleyici + TEK IntersectionObserver (kart başına JS yok).
 */
export function ListTracker({ listId, listName, items, children, className }: { listId: string; listName: string; items: GaItem[]; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !items.length) return;
    let sent = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (sent || !entries.some((e) => e.isIntersecting)) return;
        sent = true;
        io.disconnect();
        trackEcommerce("view_item_list", { item_list_id: listId, item_list_name: listName, items: items.map((i) => ({ ...i, item_list_id: listId, item_list_name: listName })) });
      },
      { threshold: 0.2 },
    );
    io.observe(el);

    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest("[data-select-item]");
      const card = link?.closest<HTMLElement>("[data-product-id]");
      if (!card) return;
      const item = items.find((i) => i.index === Number(card.dataset.productIndex));
      if (item) trackEcommerce("select_item", { item_list_id: listId, item_list_name: listName, items: [{ ...item, item_list_id: listId, item_list_name: listName }] });
    };
    el.addEventListener("click", onClick);
    return () => {
      io.disconnect();
      el.removeEventListener("click", onClick);
    };
  }, [listId, listName, items]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
