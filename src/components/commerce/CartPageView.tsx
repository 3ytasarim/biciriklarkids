"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight, Lock, ShoppingBag } from "lucide-react";
import { toGaItem, trackEcommerce } from "@/lib/analytics/events";
import { useCommerce } from "./CommerceProvider";
import { CartLineItem } from "./CartLineItem";
import { CartTotals } from "./CartSummary";
import { CouponForm } from "./CouponForm";
import { FreeShippingProgress } from "./FreeShippingProgress";

export function CartPageView() {
  const { cart } = useCommerce();
  const tracked = useRef(false);

  useEffect(() => {
    if (!cart?.items.length || tracked.current) return;
    tracked.current = true;
    trackEcommerce("view_cart", {
      value: cart.subtotal - cart.discount,
      items: cart.items.map((l) => toGaItem({ id: l.productId, sku: l.sku, name: l.name, price: l.unitPrice, category: l.categoryName, variant: l.variantLabel, quantity: l.quantity })),
    });
  }, [cart]);

  return (
    <div className="shell pt-6 pb-16 sm:pt-10">
      <h1 className="display-2">Sepetim</h1>
      {!cart ? (
        <div className="mt-10 grid gap-10 lg:grid-cols-12" aria-busy="true" aria-label="Sepet yükleniyor">
          <div className="space-y-4 lg:col-span-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-32 rounded-md" />
            ))}
          </div>
          <div className="skeleton h-72 rounded-lg lg:col-span-4" />
        </div>
      ) : cart.items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-xl bg-cream px-6 py-20 text-center">
          <span aria-hidden="true" className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-brand-ink shadow-soft">
            <ShoppingBag className="h-9 w-9" />
          </span>
          <p className="mt-6 font-display text-3xl font-extrabold">Sepetiniz boş</p>
          <p className="mt-2 max-w-md text-ink-soft">Henüz sepetinize ürün eklemediniz. Minik ellere göre hazırlanmış kitlerimize göz atın.</p>
          <Link href="/urunler" className="btn-primary mt-8">
            Alışverişe Başla <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-8">
            {cart.freeShippingThreshold != null ? <FreeShippingProgress remaining={cart.freeShippingRemaining} threshold={cart.freeShippingThreshold} className="mb-4" /> : null}
            {cart.warnings.map((w) => (
              <p key={w} className="mb-3 rounded-sm bg-sun-50 px-4 py-3 text-sm text-sun-ink">
                {w}
              </p>
            ))}
            <ul className="divide-y divide-line border-y border-line">
              {cart.items.map((l) => (
                <CartLineItem key={l.id} line={l} large />
              ))}
            </ul>
            <Link href="/urunler" className="btn-ghost mt-4 -ml-4">
              ← Alışverişe devam et
            </Link>
          </div>
          <aside aria-label="Sipariş özeti" className="lg:col-span-4">
            <div className="space-y-6 rounded-lg bg-cream p-6 lg:sticky lg:top-28">
              <h2 className="font-display text-2xl font-extrabold">Sipariş özeti</h2>
              <CouponForm />
              <CartTotals cart={cart} />
              <Link href="/odeme" className="btn-primary min-h-14 w-full text-base">
                <Lock aria-hidden="true" className="h-4 w-4" /> Ödemeye Geç
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
