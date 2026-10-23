import Link from "next/link";
import { Star } from "lucide-react";
import type { ProductCardData } from "@/lib/catalog/types";
import { ageLabel } from "@/lib/catalog/types";
import { discountPercent } from "@/lib/commerce/money";
import { toGaItem } from "@/lib/analytics/events";
import { Price } from "@/components/ui/Price";
import { SafeImage } from "@/components/ui/SafeImage";
import { CardHoverImage } from "./CardHoverImage";
import { FeltArt, motifFor } from "@/components/ui/FeltArt";
import { cn } from "@/lib/utils";
import { AddToCartButton, QuickViewButton, WishlistButton } from "./CardActions";

type Badge = { label: string; cls: string };

/** Rozet önceliği: tükendi > indirim > çok satan > yeni > hediyelik > son ürünler. En fazla 2 rozet (görsel sakinlik). */
export function productBadges(p: ProductCardData): Badge[] {
  const out: Badge[] = [];
  const pct = discountPercent(p.price, p.compareAtPrice);
  if (!p.inStock) out.push({ label: "Tükendi", cls: "bg-ink text-white" });
  if (pct) out.push({ label: `%${pct} İndirim`, cls: "bg-coral-ink text-white" });
  if (p.bestseller) out.push({ label: "En Çok Satan", cls: "bg-sun text-ink" });
  if (p.newProduct) out.push({ label: "Yeni", cls: "bg-leaf-ink text-white" });
  if (p.giftProduct) out.push({ label: "Tam Hediyelik", cls: "bg-berry-50 text-berry-ink" });
  if (p.lowStock != null) out.push({ label: "Son Ürünler", cls: "bg-white text-coral-ink" });
  return out.slice(0, 2);
}

/**
 * Ürün kartı — sunucu bileşeni; yalnızca butonlar istemci adası (favori, hızlı incele, sepete ekle).
 * `data-product-*` öznitelikleri ListTracker'ın select_item olayını tek dinleyiciyle yakalaması içindir.
 */
export function ProductCard({ product: p, index = 0, listName, priority = false, className }: { product: ProductCardData; index?: number; listName?: string; priority?: boolean; className?: string }) {
  const href = `/urun/${p.slug}`;
  const badges = productBadges(p);
  const item = toGaItem({ id: p.id, sku: p.sku, name: p.name, price: p.price, compareAtPrice: p.compareAtPrice, category: p.category?.name, index, listName });
  const age = ageLabel(p.ageMin, p.ageMax);

  return (
    <article className={cn("group/card relative flex min-w-0 flex-col", className)} data-product-id={p.id} data-product-index={index}>
      <div className="shot relative aspect-[4/5] overflow-hidden rounded-md">
        <Link href={href} tabIndex={-1} aria-hidden="true" className="absolute inset-0" data-select-item>
          {p.image ? (
            <>
              <SafeImage
                src={p.image.url}
                alt={p.image.alt || p.name}
                fill
                priority={priority}
                sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 48vw"
                className={cn("object-cover transition-[transform,opacity] duration-700 ease-(--ease-premium) group-hover/card:scale-[1.03]", p.hoverImage && "card-main-img")}
              />
              {p.hoverImage ? (
                <CardHoverImage src={p.hoverImage.url} sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 48vw" />
              ) : null}
            </>
          ) : (
            <FeltArt motif={motifFor(p.slug)} accent="sun" />
          )}
        </Link>

        <div className="pointer-events-none absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {p.isDemo ? <span className="rounded-full bg-lilac-ink px-2.5 py-1 text-[11px] font-extrabold tracking-wider text-white uppercase">Demo</span> : null}
          {badges.map((b) => (
            <span key={b.label} className={cn("rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-wide shadow-sm", b.cls)}>
              {b.label}
            </span>
          ))}
        </div>

        <WishlistButton productId={p.id} name={p.name} item={item} className="absolute top-2.5 right-2.5" />

        {/* Masaüstü: hover'da hızlı incele (dokunmatikte gizli; kart zaten ürün sayfasına gider) */}
        <div className="absolute inset-x-3 bottom-3 hidden translate-y-2 opacity-0 transition-all duration-300 ease-(--ease-premium) group-focus-within/card:translate-y-0 group-focus-within/card:opacity-100 group-hover/card:translate-y-0 group-hover/card:opacity-100 [@media(hover:hover)]:flex">
          <QuickViewButton slug={p.slug} name={p.name} className="w-full" />
        </div>
      </div>

      <div className="flex flex-1 flex-col pt-3.5">
        <div className="flex items-center justify-between gap-2 text-xs font-bold text-muted">
          {p.category ? <span className="truncate">{p.category.name}</span> : <span />}
          {age ? <span className="shrink-0 rounded-full bg-sky-50 px-2 py-0.5 text-sky-ink">{age}</span> : null}
        </div>
        <h3 className="mt-1.5 font-sans text-[15px] leading-snug font-bold sm:text-base">
          <Link href={href} className="line-clamp-2 transition-colors hover:text-brand-ink" data-select-item>
            {p.name}
          </Link>
        </h3>
        {p.rating ? (
          <p className="mt-1 flex items-center gap-1 text-xs font-bold text-ink-soft">
            <Star aria-hidden="true" className="h-3.5 w-3.5 fill-sun stroke-sun" />
            {p.rating.average.toLocaleString("tr-TR")} <span className="font-semibold text-muted">({p.rating.count} yorum)</span>
          </p>
        ) : null}
        <Price price={p.price} compareAtPrice={p.compareAtPrice} className="mt-2" />
        {p.lowStock != null ? <p className="mt-1 text-xs font-bold text-coral-ink">Son {p.lowStock} ürün</p> : null}
        <div className="mt-auto pt-3">
          <AddToCartButton productId={p.id} name={p.name} inStock={p.inStock} priced={p.price > 0} item={item} />
        </div>
      </div>
    </article>
  );
}
