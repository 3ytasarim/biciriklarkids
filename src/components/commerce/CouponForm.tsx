"use client";

import { useState } from "react";
import { Loader2, Tag, X } from "lucide-react";
import { useCommerce } from "./CommerceProvider";

/**
 * Kupon alanı. Bilinçli olarak <form> DEĞİL: ödeme formunun içinde de kullanılır (iç içe form geçersiz HTML'dir).
 * Enter tuşu ve "Uygula" düğmesi kuponu uygular; dış formu göndermez.
 */
export function CouponForm() {
  const { cart, applyCoupon, busy } = useCommerce();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const current = cart?.coupon;

  const apply = async () => {
    if (!code.trim()) return;
    setError(await applyCoupon(code.trim()));
  };

  if (current) {
    return (
      <div className="rounded-sm bg-white p-3 ring-1 ring-line">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm font-extrabold">
            <Tag aria-hidden="true" className="h-4 w-4 text-leaf-ink" /> {current.code}
          </span>
          <button type="button" onClick={() => applyCoupon(null)} className="icon-btn h-9 w-9" aria-label="Kuponu kaldır">
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        {!current.applied && current.message ? <p className="mt-1 text-xs font-bold text-sun-ink">{current.message}</p> : null}
      </div>
    );
  }
  return (
    <div role="group" aria-labelledby="coupon-label">
      <label id="coupon-label" htmlFor="coupon" className="field-label">
        İndirim kuponu
      </label>
      <div className="flex gap-2">
        <input
          id="coupon"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void apply();
            }
          }}
          maxLength={40}
          autoComplete="off"
          className="field min-h-11 uppercase"
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? "coupon-err" : undefined}
        />
        <button type="button" onClick={() => void apply()} disabled={busy || !code.trim()} className="btn-outline btn-sm min-h-11 shrink-0">
          {busy ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null} Uygula
        </button>
      </div>
      {error ? (
        <p id="coupon-err" role="alert" className="mt-1.5 text-sm font-bold text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
