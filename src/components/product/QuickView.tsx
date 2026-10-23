"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { Price } from "@/components/ui/Price";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { ageLabel } from "@/lib/catalog/types";
import { toGaItem, trackEcommerce } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";
import { AddToCartButton } from "./CardActions";

type Preview = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  inStock: boolean;
  maxQuantity: number;
  ageMin: number | null;
  ageMax: number | null;
  category: { name: string; slug: string } | null;
  images: { url: string; alt: string; width: number | null; height: number | null }[];
  hasVariants: boolean;
  isDemo: boolean;
};

/** Hızlı İncele: liste sayfasından çıkmadan görsel, fiyat ve sepete ekleme. Detay için ürün sayfasına bağlantı. */
export function QuickView({ slug, onClose }: { slug: string; onClose: () => void }) {
  const [data, setData] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/products/preview?slug=${encodeURIComponent(slug)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) return setError(json.error ?? "Ürün yüklenemedi.");
        const p = json.product as Preview;
        setData(p);
        trackEcommerce("view_item", { value: p.price, items: [toGaItem({ id: p.id, name: p.name, price: p.price, compareAtPrice: p.compareAtPrice, category: p.category?.name })] });
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setError("Bağlantı hatası.");
      });
    return () => ctrl.abort();
  }, [slug]);

  const age = data ? ageLabel(data.ageMin, data.ageMax) : null;
  const img = data?.images[active];

  return (
    <Dialog.Root open onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-ink/45 backdrop-blur-[2px] data-[state=open]:animate-fade" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-[70] max-h-[92dvh] overflow-y-auto rounded-t-[28px] bg-paper shadow-pop outline-none data-[state=open]:animate-[sheet-in-bottom_.45s_var(--ease-premium)] md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:w-[min(960px,calc(100vw-3rem))] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl md:data-[state=open]:animate-fade">
          <Dialog.Title className="sr-only">{data?.name ?? "Ürün önizleme"}</Dialog.Title>
          <Dialog.Description className="sr-only">Ürünün hızlı önizlemesi</Dialog.Description>
          <Dialog.Close className="icon-btn absolute top-3 right-3 z-10 bg-white/90 shadow-soft" aria-label="Kapat">
            <X aria-hidden="true" className="h-5 w-5" />
          </Dialog.Close>

          {error ? (
            <p className="p-10 text-center font-bold">{error}</p>
          ) : !data ? (
            <div className="grid gap-6 p-5 md:grid-cols-2 md:p-8" aria-busy="true" aria-label="Yükleniyor">
              <div className="skeleton aspect-[4/5] rounded-lg" />
              <div className="space-y-3">
                <div className="skeleton h-4 w-1/3 rounded" />
                <div className="skeleton h-8 w-3/4 rounded" />
                <div className="skeleton h-6 w-1/4 rounded" />
              </div>
            </div>
          ) : (
            <div className="grid gap-6 p-5 md:grid-cols-2 md:gap-10 md:p-8">
              <div>
                <div className="shot relative aspect-[4/5] overflow-hidden rounded-lg">
                  {img ? <SafeImage src={img.url} alt={img.alt || data.name} fill sizes="(min-width: 768px) 440px, 100vw" className="object-cover" /> : null}
                </div>
                {data.images.length > 1 ? (
                  <ul className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                    {data.images.map((im, i) => (
                      <li key={im.url}>
                        <button type="button" onClick={() => setActive(i)} aria-label={`Görsel ${i + 1}`} aria-current={i === active} className={cn("shot relative h-16 w-14 overflow-hidden rounded-xs ring-2 transition", i === active ? "ring-ink" : "ring-transparent opacity-70 hover:opacity-100")}>
                          <SafeImage src={im.url} alt="" fill sizes="56px" className="object-cover" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <div className="flex flex-col">
                <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-muted">
                  {data.isDemo ? <span className="rounded-full bg-lilac-ink px-2 py-0.5 text-[11px] text-white uppercase">Demo</span> : null}
                  {data.category?.name}
                  {age ? <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-ink">{age}</span> : null}
                </p>
                <h2 className="mt-2 font-display text-2xl leading-tight font-extrabold sm:text-3xl">{data.name}</h2>
                <Price price={data.price} compareAtPrice={data.compareAtPrice} size="lg" showPercent className="mt-4" />
                {data.shortDescription ? <p className="mt-4 leading-relaxed text-ink-soft">{data.shortDescription}</p> : null}
                <div className="mt-auto space-y-3 pt-6">
                  {data.hasVariants ? (
                    <Link href={`/urun/${data.slug}`} onClick={onClose} className="btn-primary w-full">
                      Seçenekleri gör
                    </Link>
                  ) : (
                    <div className="flex gap-3">
                      {data.inStock && data.price > 0 ? <QuantityStepper value={qty} onChange={setQty} max={Math.max(1, data.maxQuantity)} /> : null}
                      <AddToCartButton
                        productId={data.id}
                        name={data.name}
                        inStock={data.inStock}
                        priced={data.price > 0}
                        quantity={qty}
                        size="lg"
                        item={toGaItem({ id: data.id, name: data.name, price: data.price, compareAtPrice: data.compareAtPrice, category: data.category?.name })}
                      />
                    </div>
                  )}
                  <Link href={`/urun/${data.slug}`} onClick={onClose} className="btn-ghost w-full">
                    Ürün detaylarını gör <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
