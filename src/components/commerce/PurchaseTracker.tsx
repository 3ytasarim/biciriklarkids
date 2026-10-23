"use client";

import { useEffect } from "react";
import { toGaItem, trackEcommerce } from "@/lib/analytics/events";
import { useCommerce } from "./CommerceProvider";

/**
 * GA4 `purchase` — sipariş başına YALNIZCA BİR KEZ (sayfa yenilense de): sessionStorage + localStorage koruması.
 * Not: Havale/EFT siparişleri ödeme beklerken de "purchase" sayılır (sipariş tamamlandı); iptal/iade
 * durumları için GA4 tarafında refund olayı ileride admin aksiyonundan sunucu tarafı gönderilebilir.
 */
export function PurchaseTracker({
  orderNumber,
  value,
  shipping,
  coupon,
  items,
}: {
  orderNumber: string;
  value: number;
  shipping: number;
  coupon: string | null;
  items: { id: string; sku: string | null; name: string; price: number; category: string | null; variant: string | null; quantity: number }[];
}) {
  const { refreshCart } = useCommerce();
  useEffect(() => {
    void refreshCart(); // sepet sipariş sonrası boşaldı → rozet güncellensin
    const key = `bk_purchase_${orderNumber}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {
      /* depolama kapalıysa yine de bir kez gönder */
    }
    trackEcommerce("purchase", {
      transaction_id: orderNumber,
      value,
      shipping,
      coupon: coupon ?? undefined,
      items: items.map((i) => toGaItem({ id: i.id, sku: i.sku, name: i.name, price: i.price, category: i.category, variant: i.variant, quantity: i.quantity })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber]);
  return null;
}
