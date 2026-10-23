"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, Heart, Loader2, ShoppingBag, Truck, Zap } from "lucide-react";
import { useCommerce } from "@/components/commerce/CommerceProvider";
import { Price } from "@/components/ui/Price";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { formatPrice } from "@/lib/commerce/money";
import { toGaItem, trackEcommerce } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

export type BuyBoxProduct = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  trackStock: boolean;
  lowStockThreshold: number;
  categoryName: string | null;
  variants: { id: string; name: string; value: string; priceAdjustment: number; stock: number }[];
  image: string | null;
};

/**
 * Satın alma kutusu: fiyat, stok, varyant, adet, Sepete Ekle, Hemen Al, Favori.
 * Mobilde ana CTA ekrandan çıkınca alttan yapışkan "Sepete Ekle" çubuğu belirir (IntersectionObserver).
 * view_item olayı ilk render'da gönderilir.
 */
export function BuyBox({ product: p, freeShippingThreshold, dispatchTime }: { product: BuyBoxProduct; freeShippingThreshold: number | null; dispatchTime: string | null }) {
  const router = useRouter();
  const { addToCart, wishlist, toggleWishlist } = useCommerce();
  const [qty, setQty] = useState(1);
  const [variantId, setVariantId] = useState<string | null>(p.variants[0]?.id ?? null);
  const [pending, setPending] = useState<"cart" | "buy" | null>(null);
  const [showSticky, setShowSticky] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);

  const variant = p.variants.find((v) => v.id === variantId) ?? null;
  const price = Math.round((p.price + (variant?.priceAdjustment ?? 0)) * 100) / 100;
  const stock = variant ? variant.stock : p.stock;
  const priced = price > 0;
  const inStock = (!p.trackStock || stock > 0) && priced;
  const max = p.trackStock ? Math.max(1, Math.min(stock, 99)) : 99;
  const low = p.trackStock && inStock && stock <= p.lowStockThreshold;
  const item = toGaItem({ id: p.id, sku: p.sku, name: p.name, price, compareAtPrice: p.compareAtPrice, category: p.categoryName, variant: variant ? `${variant.name}: ${variant.value}` : null });
  const saved = wishlist.has(p.id);

  useEffect(() => {
    trackEcommerce("view_item", { value: p.price, items: [toGaItem({ id: p.id, sku: p.sku, name: p.name, price: p.price, compareAtPrice: p.compareAtPrice, category: p.categoryName })] });
    // Son görüntülenenler (yalnızca bu cihazda; kişisel veri değil, ürün kimlikleri)
    try {
      const key = "bk_recent";
      const list = (JSON.parse(localStorage.getItem(key) ?? "[]") as string[]).filter((id) => id !== p.id);
      localStorage.setItem(key, JSON.stringify([p.id, ...list].slice(0, 12)));
    } catch {
      /* depolama kapalı */
    }
  }, [p.id, p.name, p.price, p.sku, p.compareAtPrice, p.categoryName]);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowSticky(!e!.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const add = async (mode: "cart" | "buy") => {
    setPending(mode);
    const ok = await addToCart(p.id, qty, item, { variantId, openDrawer: mode === "cart" });
    setPending(null);
    if (ok && mode === "buy") router.push("/odeme");
  };

  return (
    <div>
      <Price price={price} compareAtPrice={p.compareAtPrice ? p.compareAtPrice + (variant?.priceAdjustment ?? 0) : null} size="lg" showPercent />

      <p className={cn("mt-3 flex items-center gap-2 text-sm font-bold", inStock ? (low ? "text-coral-ink" : "text-leaf-ink") : "text-muted")}>
        <span aria-hidden="true" className={cn("h-2.5 w-2.5 rounded-full", inStock ? (low ? "bg-coral" : "bg-leaf") : "bg-line-strong")} />
        {!priced ? "Fiyat yakında belirlenecek" : !inStock ? "Şu anda stokta yok" : low ? `Stokta son ${stock} ürün` : "Stokta"}
      </p>

      {p.variants.length ? (
        <fieldset className="mt-6">
          <legend className="mb-2 text-sm font-extrabold">{p.variants[0]!.name}</legend>
          <div className="flex flex-wrap gap-2">
            {p.variants.map((v) => (
              <label key={v.id} className={cn("inline-flex min-h-11 cursor-pointer items-center rounded-full border-[1.5px] px-4 text-sm font-bold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-sky-ink", v.id === variantId ? "border-ink bg-ink text-white" : "border-line-strong bg-white hover:border-ink", p.trackStock && v.stock <= 0 && "opacity-45")}>
                <input type="radio" name="variant" value={v.id} checked={v.id === variantId} onChange={() => setVariantId(v.id)} className="sr-only" />
                {v.value}
                {v.priceAdjustment ? <span className="ml-1.5 opacity-75">({v.priceAdjustment > 0 ? "+" : ""}{formatPrice(v.priceAdjustment)})</span> : null}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div ref={ctaRef} className="mt-7 space-y-3">
        <div className="flex flex-wrap gap-3">
          {inStock ? <QuantityStepper value={qty} onChange={setQty} max={max} /> : null}
          <button type="button" disabled={!inStock || pending !== null} onClick={() => add("cart")} className="btn-primary order-last min-h-12 w-full text-base min-[400px]:order-none min-[400px]:w-auto min-[400px]:flex-1">
            {pending === "cart" ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : <ShoppingBag aria-hidden="true" className="h-5 w-5" />}
            {inStock ? "Sepete Ekle" : priced ? "Tükendi" : "Yakında satışta"}
          </button>
          <button type="button" onClick={() => toggleWishlist(p.id, item)} aria-pressed={saved} aria-label={saved ? "Favorilerden çıkar" : "Favorilere ekle"} className="ml-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[1.5px] border-line-strong bg-white transition-colors hover:border-ink min-[400px]:ml-0">
            <Heart aria-hidden="true" className={cn("h-5 w-5", saved && "fill-berry stroke-berry")} />
          </button>
        </div>
        {inStock ? (
          <button type="button" disabled={pending !== null} onClick={() => add("buy")} className="btn-dark min-h-12 w-full text-base">
            {pending === "buy" ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : <Zap aria-hidden="true" className="h-5 w-5 text-sun" />}
            Hemen Satın Al
          </button>
        ) : null}
      </div>

      <ul className="mt-6 space-y-2.5 rounded-md bg-cream p-4 text-sm">
        {freeShippingThreshold != null ? (
          <li className="flex items-start gap-2.5">
            <Truck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-leaf-ink" />
            <span>
              <strong>{formatPrice(freeShippingThreshold)}</strong> ve üzeri siparişlerde kargo ücretsiz
            </span>
          </li>
        ) : null}
        {dispatchTime ? (
          <li className="flex items-start gap-2.5">
            <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-leaf-ink" />
            <span>Kargoya teslim: {dispatchTime}</span>
          </li>
        ) : null}
        <li className="flex items-start gap-2.5">
          <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-leaf-ink" />
          <span>Siparişler özenle paketlenir; ürün birebir aynısı olarak teslim edilir.</span>
        </li>
        <li className="flex items-start gap-2.5">
          <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-leaf-ink" />
          <span>Teslimattan itibaren 14 gün cayma hakkı</span>
        </li>
      </ul>

      {/* Mobil yapışkan satın alma çubuğu */}
      <div
        aria-hidden={!showSticky}
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-12px_30px_-20px_rgb(35_31_58/0.4)] backdrop-blur-md transition-transform duration-300 ease-(--ease-premium) lg:hidden",
          showSticky ? "translate-y-0" : "pointer-events-none translate-y-full",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{p.name}</p>
            <p className={cn("text-[17px] font-extrabold tabular-nums", p.compareAtPrice && p.compareAtPrice > price && "text-coral-ink")}>{formatPrice(price)}</p>
          </div>
          <button type="button" tabIndex={showSticky ? 0 : -1} disabled={!inStock || pending !== null} onClick={() => add("cart")} className="btn-primary shrink-0 px-6">
            {pending === "cart" ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : <ShoppingBag aria-hidden="true" className="h-5 w-5" />}
            {inStock ? "Sepete Ekle" : priced ? "Tükendi" : "Yakında satışta"}
          </button>
        </div>
      </div>
    </div>
  );
}
