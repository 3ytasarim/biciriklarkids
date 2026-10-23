"use client";

import type { CartView } from "@/lib/commerce/cart";
import { formatPrice } from "@/lib/commerce/money";

/** Sipariş özeti tutarları (sepet sayfası ve ödeme). Kargo ayarlanmadıysa tutar yerine açıklama gösterilir. */
export function CartTotals({ cart }: { cart: Pick<CartView, "subtotal" | "discount" | "shipping" | "total" | "coupon"> }) {
  return (
    <dl className="space-y-2.5 text-[15px]">
      <div className="flex justify-between gap-4">
        <dt className="text-ink-soft">Ara toplam</dt>
        <dd className="font-bold tabular-nums">{formatPrice(cart.subtotal)}</dd>
      </div>
      {cart.discount > 0 ? (
        <div className="flex justify-between gap-4 text-leaf-ink">
          <dt>İndirim{cart.coupon ? ` (${cart.coupon.code})` : ""}</dt>
          <dd className="font-bold tabular-nums">-{formatPrice(cart.discount)}</dd>
        </div>
      ) : null}
      <div className="flex justify-between gap-4">
        <dt className="text-ink-soft">Kargo</dt>
        <dd className="text-right font-bold tabular-nums">
          {cart.shipping == null ? <span className="text-sm font-semibold text-muted">Sipariş onayında bildirilir</span> : cart.shipping === 0 ? <span className="text-leaf-ink">Ücretsiz</span> : formatPrice(cart.shipping)}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-4 border-t border-dashed border-line-strong pt-3">
        <dt className="font-extrabold">Toplam</dt>
        <dd className="text-xl font-extrabold tabular-nums">{formatPrice(cart.total)}</dd>
      </div>
      <p className="text-xs text-muted">Fiyatlara KDV dahildir.</p>
    </dl>
  );
}
