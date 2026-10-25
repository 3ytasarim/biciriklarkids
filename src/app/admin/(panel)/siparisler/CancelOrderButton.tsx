"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
import { cancelOrderAction } from "./actions";

/** Sipariş listesinde onaylı tek tık iptal. Ödenmiş siparişte para iadesinin ayrıca yapılması gerektiğini hatırlatır. */
export function CancelOrderButton({ id, orderNumber, paid }: { id: string; orderNumber: string; paid: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const onClick = () => {
    const msg = paid
      ? `${orderNumber} siparişi iptal edilsin mi?\n\nBu siparişin ödemesi alınmış. Para iadesini iyzico panelinden ayrıca yapmanız gerekir.`
      : `${orderNumber} siparişi iptal edilsin mi?`;
    if (!window.confirm(msg)) return;
    setError(null);
    start(async () => {
      const res = await cancelOrderAction(id);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  };
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-label={`${orderNumber} siparişini iptal et`}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 text-sm font-bold whitespace-nowrap text-red-700 transition-colors hover:border-red-300 hover:bg-red-100 disabled:opacity-60"
      >
        {pending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <XCircle aria-hidden="true" className="h-4 w-4" />}
        {pending ? "İptal ediliyor…" : "İptal et"}
      </button>
      {error ? (
        <span role="alert" className="max-w-56 text-right text-xs text-red-700">
          {error}
        </span>
      ) : null}
    </span>
  );
}
