"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useMarkDirty } from "./AdminForm";

type Faq = { question: string; answer: string };

/**
 * SSS editörü (ürün, kategori, sayfa). Yalnızca sayfada GÖRÜNEN sorular FAQPage şemasına girer;
 * boş satırlar sunucuda atılır. Değer `name` gizli alanında JSON.
 */
export function FaqEditor({ name = "faq", defaultValue }: { name?: string; defaultValue: Faq[] }) {
  const [rows, setRowsState] = useState<Faq[]>(defaultValue);
  const markDirty = useMarkDirty();
  const setRows = (fn: (p: Faq[]) => Faq[]) => {
    setRowsState(fn);
    markDirty();
  };
  const move = (i: number, d: number) =>
    setRows((p) => {
      const n = [...p];
      const j = i + d;
      if (j < 0 || j >= n.length) return p;
      [n[i], n[j]] = [n[j]!, n[i]!];
      return n;
    });
  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      <ol className="space-y-3">
        {rows.map((r, i) => (
          <li key={i} className="rounded-md border border-neutral-200 bg-white p-3">
            <div className="flex items-start gap-2">
              <span className="mt-2.5 text-xs font-bold text-neutral-400">{i + 1}.</span>
              <div className="flex-1 space-y-2">
                <input
                  aria-label={`Soru ${i + 1}`}
                  placeholder="Soru (ör. Kit kaç yaş için uygun?)"
                  value={r.question}
                  maxLength={300}
                  onChange={(e) => setRows((p) => p.map((x, n) => (n === i ? { ...x, question: e.target.value } : x)))}
                  className="block min-h-10 w-full rounded-xs border border-neutral-300 px-2 text-sm font-semibold outline-none focus:border-ink"
                />
                <textarea
                  aria-label={`Cevap ${i + 1}`}
                  placeholder="Kısa, net ve doğrulanabilir cevap"
                  value={r.answer}
                  rows={3}
                  maxLength={4000}
                  onChange={(e) => setRows((p) => p.map((x, n) => (n === i ? { ...x, answer: e.target.value } : x)))}
                  className="block w-full rounded-xs border border-neutral-300 px-2 py-2 text-sm outline-none focus:border-ink"
                />
              </div>
              <div className="flex flex-col">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Yukarı taşı" className="flex h-9 w-9 items-center justify-center hover:bg-neutral-100 disabled:opacity-30">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Aşağı taşı" className="flex h-9 w-9 items-center justify-center hover:bg-neutral-100 disabled:opacity-30">
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setRows((p) => p.filter((_, n) => n !== i))} aria-label="Soruyu sil" className="flex h-9 w-9 items-center justify-center text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" onClick={() => setRows((p) => [...p, { question: "", answer: "" }])} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 text-sm hover:border-ink">
        <Plus aria-hidden="true" className="h-4 w-4" /> Soru ekle
      </button>
    </div>
  );
}
