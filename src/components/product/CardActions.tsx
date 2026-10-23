"use client";

import { Eye, Heart, Loader2, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCommerce } from "@/components/commerce/CommerceProvider";
import type { GaItem } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

export function WishlistButton({ productId, name, item, className }: { productId: string; name: string; item: GaItem; className?: string }) {
  const { wishlist, toggleWishlist } = useCommerce();
  const saved = wishlist.has(productId);
  return (
    <button
      type="button"
      onClick={() => toggleWishlist(productId, item)}
      aria-pressed={saved}
      aria-label={saved ? `${name} favorilerden çıkar` : `${name} favorilere ekle`}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-full bg-white/92 text-ink shadow-soft backdrop-blur transition-transform duration-300 hover:scale-105 active:scale-95",
        className,
      )}
    >
      <Heart aria-hidden="true" className={cn("h-[18px] w-[18px] transition-colors", saved && "fill-berry stroke-berry")} />
    </button>
  );
}

export function QuickViewButton({ slug, name, className }: { slug: string; name: string; className?: string }) {
  const { openQuickView } = useCommerce();
  return (
    <button type="button" onClick={() => openQuickView(slug)} className={cn("btn btn-sm bg-white/95 text-ink shadow-soft backdrop-blur hover:bg-white", className)} aria-label={`${name} hızlı incele`}>
      <Eye aria-hidden="true" className="h-4 w-4" /> Hızlı İncele
    </button>
  );
}

export function AddToCartButton({
  productId,
  name,
  inStock,
  priced = true,
  item,
  quantity = 1,
  variantId,
  size = "sm",
  className,
  label = "Sepete Ekle",
  openDrawer,
}: {
  productId: string;
  name: string;
  inStock: boolean;
  /** Fiyat 0 → henüz satışta değil ("Fiyat yakında"). */
  priced?: boolean;
  item: GaItem;
  quantity?: number;
  variantId?: string | null;
  size?: "sm" | "lg";
  className?: string;
  label?: string;
  openDrawer?: boolean;
}) {
  const { addToCart } = useCommerce();
  const [pending, setPending] = useState(false);
  if (!inStock || !priced) {
    return (
      <button type="button" disabled className={cn("btn w-full cursor-not-allowed bg-sand text-muted", size === "sm" && "btn-sm", className)}>
        {priced ? "Tükendi" : "Yakında satışta"}
      </button>
    );
  }
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={label === "Sepete Ekle" ? `${name} sepete ekle` : undefined}
      onClick={async () => {
        setPending(true);
        await addToCart(productId, quantity, item, { variantId, openDrawer });
        setPending(false);
      }}
      className={cn(size === "sm" ? "btn btn-sm bg-ink text-white hover:bg-brand-ink" : "btn-primary", "w-full", className)}
    >
      {pending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <ShoppingBag aria-hidden="true" className="h-4 w-4" />}
      {label}
    </button>
  );
}
