"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import type { ProductCardData } from "@/lib/catalog/types";
import { ProductCard } from "@/components/product/ProductCard";
import { useCommerce } from "./CommerceProvider";

export function FavoritesView() {
  const { wishlist } = useCommerce();
  const [items, setItems] = useState<ProductCardData[] | null>(null);
  const key = [...wishlist].join(",");

  useEffect(() => {
    if (!key) {
      // Favori listesi henüz yüklenmemiş olabilir; kısa gecikmeyle boş durumu göster.
      const t = window.setTimeout(() => setItems([]), 900);
      return () => window.clearTimeout(t);
    }
    fetch(`/api/products/preview?ids=${key}`)
      .then((r) => r.json())
      .then((j) => setItems(j.ok ? j.products : []))
      .catch(() => setItems([]));
  }, [key]);

  const visible = items?.filter((p) => wishlist.has(p.id)) ?? null;

  return (
    <div className="shell pt-6 pb-16 sm:pt-10">
      <h1 className="display-2">Favorilerim</h1>
      {visible === null ? (
        <ul className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="skeleton aspect-[4/5] rounded-md" />
          ))}
        </ul>
      ) : visible.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-xl bg-berry-50 px-6 py-20 text-center">
          <span aria-hidden="true" className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-berry-ink shadow-soft">
            <Heart className="h-9 w-9" />
          </span>
          <p className="mt-6 font-display text-3xl font-extrabold">Favori listeniz boş</p>
          <p className="mt-2 max-w-md text-ink-soft">Beğendiğiniz ürünlerdeki kalp simgesine dokunarak buraya ekleyebilirsiniz.</p>
          <Link href="/urunler" className="btn-dark mt-8">
            Ürünleri Keşfet
          </Link>
        </div>
      ) : (
        <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
          {visible.map((p, i) => (
            <li key={p.id} className="flex">
              <ProductCard product={p} index={i} listName="Favoriler" className="w-full" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
