import { fromKurus, toKurus } from "./money";

export type PricedLine = { unitPrice: number; quantity: number; categoryId: string | null };
export type CouponRule = {
  code: string;
  type: "percent" | "fixed" | "free_shipping";
  value: number;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  categoryIds: string[] | null;
};
export type ShippingRule = { flatFee: number | null; freeThreshold: number | null };

export type Totals = {
  subtotal: number;
  discount: number;
  /** null → kargo ücreti henüz ayarlanmadı (siparişte bildirilir). */
  shipping: number | null;
  total: number;
  freeShippingRemaining: number | null;
  couponApplied: boolean;
  couponMessage: string | null;
};

/**
 * Saf fiyat hesabı (istemci ve sunucuda aynı sonuç). Tüm aritmetik kuruş cinsinden.
 * Sipariş oluştururken sunucu bu fonksiyonu DB'den gelen güncel fiyatlarla yeniden çalıştırır;
 * istemcinin gönderdiği tutarlara asla güvenilmez.
 */
export function computeTotals(lines: PricedLine[], shippingRule: ShippingRule, coupon: CouponRule | null): Totals {
  const subtotalK = lines.reduce((s, l) => s + toKurus(l.unitPrice) * l.quantity, 0);
  let discountK = 0;
  let freeShippingByCoupon = false;
  let couponMessage: string | null = null;
  let couponApplied = false;

  if (coupon) {
    const eligibleK = coupon.categoryIds?.length
      ? lines.filter((l) => l.categoryId && coupon.categoryIds!.includes(l.categoryId)).reduce((s, l) => s + toKurus(l.unitPrice) * l.quantity, 0)
      : subtotalK;
    if (coupon.minOrderAmount != null && subtotalK < toKurus(coupon.minOrderAmount)) {
      couponMessage = `Bu kupon ${coupon.minOrderAmount.toLocaleString("tr-TR")} TL ve üzeri sepetlerde geçerlidir.`;
    } else if (eligibleK === 0) {
      couponMessage = "Sepetinizde bu kuponun geçerli olduğu ürün yok.";
    } else {
      couponApplied = true;
      if (coupon.type === "percent") discountK = Math.round((eligibleK * Math.min(coupon.value, 100)) / 100);
      else if (coupon.type === "fixed") discountK = Math.min(toKurus(coupon.value), eligibleK);
      else freeShippingByCoupon = true;
      if (coupon.maxDiscountAmount != null) discountK = Math.min(discountK, toKurus(coupon.maxDiscountAmount));
    }
  }

  const afterDiscountK = subtotalK - discountK;
  let shippingK: number | null = null;
  let remaining: number | null = null;
  if (lines.length === 0) shippingK = 0;
  else if (freeShippingByCoupon) shippingK = 0;
  else if (shippingRule.freeThreshold != null && afterDiscountK >= toKurus(shippingRule.freeThreshold)) shippingK = 0;
  else if (shippingRule.flatFee != null) shippingK = toKurus(shippingRule.flatFee);
  if (shippingRule.freeThreshold != null && afterDiscountK < toKurus(shippingRule.freeThreshold) && !freeShippingByCoupon) {
    remaining = fromKurus(toKurus(shippingRule.freeThreshold) - afterDiscountK);
  }

  return {
    subtotal: fromKurus(subtotalK),
    discount: fromKurus(discountK),
    shipping: shippingK == null ? null : fromKurus(shippingK),
    total: fromKurus(afterDiscountK + (shippingK ?? 0)),
    freeShippingRemaining: remaining,
    couponApplied,
    couponMessage,
  };
}
