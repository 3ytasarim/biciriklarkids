"use client";

import { useActionState } from "react";
import { Loader2, PackageSearch } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { trackOrderAction, type TrackState } from "./actions";

export function TrackForm() {
  const [state, action, pending] = useActionState<TrackState, FormData>(trackOrderAction, {});
  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-2">
      <form action={action} className="space-y-4 rounded-lg bg-cream p-6 sm:p-8" noValidate>
        <div>
          <label htmlFor="orderNumber" className="field-label">Sipariş numarası</label>
          <input id="orderNumber" name="orderNumber" placeholder="BK26xxxxx" autoCapitalize="characters" required className="field uppercase" />
        </div>
        <div>
          <label htmlFor="email" className="field-label">Sipariş verdiğiniz e-posta</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="field" />
        </div>
        {state.error ? <p role="alert" className="text-sm font-bold text-danger">{state.error}</p> : null}
        <button type="submit" disabled={pending} className="btn-dark w-full">
          {pending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <PackageSearch aria-hidden="true" className="h-4 w-4" />} Siparişimi sorgula
        </button>
      </form>
      <div aria-live="polite">
        {state.result ? (
          <div className="rounded-lg bg-white p-6 ring-1 ring-line sm:p-8">
            <p className="text-sm font-bold text-muted">Sipariş {state.result.orderNumber} · {formatDateTime(state.result.createdAt)}</p>
            <p className="mt-2 font-display text-3xl font-extrabold">{state.result.status}</p>
            {state.result.trackingNumber ? (
              <p className="mt-3 rounded-sm bg-leaf-50 p-3 text-sm font-bold text-leaf-ink">
                {state.result.carrier ? `${state.result.carrier} · ` : ""}Takip no: <span className="font-mono">{state.result.trackingNumber}</span>
              </p>
            ) : null}
            <ol className="mt-6 space-y-3 text-sm">
              {state.result.events.map((e, i) => (
                <li key={i} className="flex gap-3">
                  <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                  <span>
                    <span className="block font-bold">{e.message}</span>
                    <span className="text-muted">{formatDateTime(e.at)}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </div>
  );
}
