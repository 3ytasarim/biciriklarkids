"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ShoppingBag } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { formatPrice } from "@/lib/commerce/money";
import { toGaItem, trackEcommerce } from "@/lib/analytics/events";
import { useCommerce } from "./CommerceProvider";
import { FreeShippingProgress } from "./FreeShippingProgress";
import { CartLineItem } from "./CartLineItem";

export function CartDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { cart } = useCommerce();
  const items = cart?.items ?? [];
  const tracked = useRef(false);

  // view_cart: çekmece açılışında bir kez (sepet yüklendiyse).
  useEffect(() => {
    if (!open || !cart?.items.length || tracked.current) return;
    tracked.current = true;
    trackEcommerce("view_cart", {
      value: cart.subtotal - cart.discount,
      items: cart.items.map((l) => toGaItem({ id: l.productId, sku: l.sku, name: l.name, price: l.unitPrice, category: l.categoryName, variant: l.variantLabel, quantity: l.quantity })),
    });
  }, [open, cart]);

  const close = () => onOpenChange(false);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={
        <span className="flex items-center gap-2">
          Sepetim
          {cart?.count ? <span className="rounded-full bg-brand-50 px-2 py-0.5 font-sans text-sm font-extrabold text-brand-ink">{cart.count}</span> : null}
        </span>
      }
      description="Sepetinizdeki ürünler"
      footer={
        cart && items.length ? (
          <div className="space-y-3">
            <dl className="space-y-1.5 text-[15px]">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Ara toplam</dt>
                <dd className="font-extrabold tabular-nums">{formatPrice(cart.subtotal)}</dd>
              </div>
              {cart.discount > 0 ? (
                <div className="flex justify-between text-leaf-ink">
                  <dt>İndirim ({cart.coupon?.code})</dt>
                  <dd className="font-extrabold tabular-nums">−{formatPrice(cart.discount)}</dd>
                </div>
              ) : null}
            </dl>
            <p className="text-xs text-muted">Kargo ücreti ve kupon kodu ödeme adımında hesaplanır.</p>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/sepet" onClick={close} className="btn-outline px-3">
                Sepete Git
              </Link>
              <Link href="/odeme" onClick={close} className="btn-primary px-3">
                Ödemeye Geç
              </Link>
            </div>
          </div>
        ) : null
      }
    >
      {!cart ? (
        <div className="space-y-4 p-5" aria-busy="true" aria-label="Sepet yükleniyor">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="skeleton h-24 w-20 rounded-sm" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-4 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-8 py-16 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-sun-50 text-sun-ink">
            <ShoppingBag aria-hidden="true" className="h-9 w-9" />
          </span>
          <p className="font-display text-2xl font-extrabold">Sepetiniz şimdilik boş</p>
          <p className="text-ink-soft">Minik ellerin seveceği dikiş kitlerini ve aktivite setlerini keşfedin.</p>
          <Link href="/urunler" onClick={close} className="btn-primary mt-2">
            Ürünleri Keşfet
          </Link>
        </div>
      ) : (
        <div className="px-5 py-4">
          {cart.freeShippingThreshold != null ? <FreeShippingProgress remaining={cart.freeShippingRemaining} threshold={cart.freeShippingThreshold} className="mb-4" /> : null}
          {cart.warnings.map((w) => (
            <p key={w} className="mb-3 rounded-sm bg-sun-50 px-3 py-2 text-sm text-sun-ink">
              {w}
            </p>
          ))}
          <ul className="divide-y divide-line">
            {items.map((l) => (
              <CartLineItem key={l.id} line={l} onNavigate={close} />
            ))}
          </ul>
        </div>
      )}
    </Sheet>
  );
}
