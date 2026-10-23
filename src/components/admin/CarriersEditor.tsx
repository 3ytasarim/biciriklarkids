"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { CARRIER_BRANDS, type CarrierBrandKey, type ShippingCarrier } from "@/lib/commerce/carriers";
import { CarrierBadge } from "@/components/commerce/CarrierBadge";
import { useMarkDirty } from "./AdminForm";
import { ImagePicker } from "./ImagePicker";

type Row = { id: string; brand: CarrierBrandKey; name: string; fee: string; freeThreshold: string; note: string; logoUrl: string | null; active: boolean };

const newId = () => `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const num = (n: number | null | undefined) => (n == null ? "" : String(n).replace(".", ","));

/**
 * Kargo firmaları editörü. Satırlar `carriers` gizli alanında JSON olarak; her firmanın logosu ayrı
 * `carrierLogo_<id>` alanında (ImagePicker) gönderilir. Doğrulama sunucuda (ayarlar/actions.ts).
 */
export function CarriersEditor({ defaultValue }: { defaultValue: ShippingCarrier[] }) {
  const markDirty = useMarkDirty();
  const [rows, setRowsState] = useState<Row[]>(
    defaultValue.map((c) => ({ id: c.id, brand: c.brand, name: c.name, fee: num(c.fee), freeThreshold: num(c.freeThreshold), note: c.note ?? "", logoUrl: c.logoUrl, active: c.active })),
  );
  const setRows = (fn: (p: Row[]) => Row[]) => {
    setRowsState(fn);
    markDirty();
  };
  const patch = (i: number, v: Partial<Row>) => setRows((p) => p.map((r, n) => (n === i ? { ...r, ...v } : r)));
  const move = (i: number, d: number) =>
    setRows((p) => {
      const j = i + d;
      if (j < 0 || j >= p.length) return p;
      const next = [...p];
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });
  const add = () => {
    const used = new Set(rows.map((r) => r.brand));
    const brand = (CARRIER_BRANDS.find((b) => !used.has(b.key) && b.key !== "other")?.key ?? "other") as CarrierBrandKey;
    setRows((p) => [...p, { id: newId(), brand, name: CARRIER_BRANDS.find((b) => b.key === brand)!.label, fee: "", freeThreshold: "", note: "", logoUrl: null, active: true }]);
  };

  const input = "min-h-10 w-full rounded-xs border border-neutral-300 px-2 text-sm outline-none focus:border-ink";
  return (
    <div>
      <input type="hidden" name="carriers" value={JSON.stringify(rows.map(({ logoUrl: _l, ...r }) => r))} />
      {rows.length ? (
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={r.id} className="rounded-sm border border-neutral-200 bg-white p-3">
              <div className="flex flex-wrap items-center gap-3">
                <CarrierBadge brand={r.brand} name={r.name || "Kargo"} logoUrl={r.logoUrl} />
                <label className="ml-auto flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={r.active} onChange={(e) => patch(i, { active: e.target.checked })} className="h-4 w-4 accent-neutral-900" />
                  Ödeme sayfasında göster
                </label>
                <div className="flex">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Yukarı taşı" className="flex h-9 w-9 items-center justify-center hover:bg-neutral-100 disabled:opacity-30">
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Aşağı taşı" className="flex h-9 w-9 items-center justify-center hover:bg-neutral-100 disabled:opacity-30">
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setRows((p) => p.filter((_, n) => n !== i))} aria-label="Firmayı sil" className="flex h-9 w-9 items-center justify-center text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[160px_1fr_120px_140px_1fr]">
                <label className="text-xs font-medium text-neutral-600">
                  Firma
                  <select
                    value={r.brand}
                    onChange={(e) => {
                      const b = e.target.value as CarrierBrandKey;
                      const prevLabel = CARRIER_BRANDS.find((x) => x.key === r.brand)?.label;
                      patch(i, { brand: b, name: !r.name || r.name === prevLabel ? CARRIER_BRANDS.find((x) => x.key === b)!.label : r.name });
                    }}
                    className={`${input} mt-1 bg-white`}
                  >
                    {CARRIER_BRANDS.map((b) => (
                      <option key={b.key} value={b.key}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-medium text-neutral-600">
                  Görünen ad
                  <input value={r.name} maxLength={60} onChange={(e) => patch(i, { name: e.target.value })} className={`${input} mt-1`} />
                </label>
                <label className="text-xs font-medium text-neutral-600">
                  Ücret (₺)
                  <input value={r.fee} inputMode="decimal" placeholder="ör. 79,90" onChange={(e) => patch(i, { fee: e.target.value })} className={`${input} mt-1`} />
                </label>
                <label className="text-xs font-medium text-neutral-600">
                  Ücretsiz kargo eşiği (₺)
                  <input value={r.freeThreshold} inputMode="decimal" placeholder="Genel eşik" onChange={(e) => patch(i, { freeThreshold: e.target.value })} className={`${input} mt-1`} />
                </label>
                <label className="text-xs font-medium text-neutral-600">
                  Not (müşteri görür)
                  <input value={r.note} maxLength={80} placeholder="ör. 1–3 iş günü teslimat" onChange={(e) => patch(i, { note: e.target.value })} className={`${input} mt-1`} />
                </label>
              </div>
              <div className="mt-3 max-w-xs">
                <ImagePicker name={`carrierLogo_${r.id}`} label="Logo (isteğe bağlı — yüklenmezse renkli isim etiketi gösterilir)" defaultValue={r.logoUrl} aspect="aspect-[3/1]" nameHint={`${r.name} logo`} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-sm border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-600">Henüz kargo firması eklenmedi. Firma eklenmezse yukarıdaki sabit kargo ücreti kullanılır.</p>
      )}
      <button type="button" onClick={add} disabled={rows.length >= 12} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xs border border-neutral-300 bg-white px-3 text-sm font-medium hover:border-neutral-900 disabled:opacity-40">
        <Plus className="h-4 w-4" /> Kargo firması ekle
      </button>
    </div>
  );
}
