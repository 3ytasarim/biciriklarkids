"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const DOTS = ["bg-brand", "bg-sun", "bg-leaf", "bg-sky"];
const CHAR_MS = 42; // harf başına
const LINE_GAP_MS = 260; // satırlar arası
const HOLD_MS = 5000; // tamamı yazıldıktan sonra bekleme

/**
 * "Kutunun içinde" kartı — daktilo animasyonu.
 * - Satırlar sırayla harf harf yazılır; satır başlarken nokta belirir, yazılırken nabız atar
 * - Tamamı yazılınca 5 sn bekler, sonra baştan yazar
 * - Kart boyutu sabit: her satırın tam metni görünmez yer tutucu olarak durur (CLS yok)
 * - Ekran dışındayken durur (IntersectionObserver); reduced-motion'da animasyon yok
 * - Ekran okuyucular tam listeyi okur; animasyonlu kopya aria-hidden
 * - Sunucu HTML'inde metin tam halde gelir (JS'siz ve botlar için)
 */
export function KitCard({ items, title = "Kutunun içinde", note }: { items: string[]; title?: string; note?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  // null → animasyon devre dışı (ilk render, reduced-motion): tam metin gösterilir
  const [pos, setPos] = useState<{ line: number; chars: number } | null>(null);
  const [visible, setVisible] = useState(false);

  // Görünürlük takibi
  useEffect(() => {
    const el = rootRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => setVisible(Boolean(e?.isIntersecting)), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Yazma döngüsü (yalnızca görünürken)
  useEffect(() => {
    if (!visible) return;
    let t: number;
    const total = items.length;
    const step = (line: number, chars: number) => {
      setPos({ line, chars });
      const len = items[line]!.length;
      if (chars < len) t = window.setTimeout(() => step(line, chars + 1), CHAR_MS);
      else if (line < total - 1) t = window.setTimeout(() => step(line + 1, 0), LINE_GAP_MS);
      else t = window.setTimeout(() => step(0, 0), HOLD_MS);
    };
    // Performans: ilk yazımı sayfa yüklenip boşa çıkınca başlat (LCP/hydration ile yarışmasın)
    let idle = 0;
    const begin = () => (t = window.setTimeout(() => step(0, 0), 600));
    if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(begin, { timeout: 3000 });
    else t = window.setTimeout(() => step(0, 0), 2000);
    return () => {
      window.clearTimeout(t);
      if (idle) window.cancelIdleCallback(idle);
    };
  }, [visible, items]);

  return (
    <div ref={rootRef} className="rounded-md bg-white p-4 shadow-lift ring-1 ring-line sm:p-5">
      <p className="text-xs font-extrabold tracking-[0.14em] text-brand-ink uppercase">{title}</p>
      <ul className="sr-only">
        {items.map((k) => (
          <li key={k}>{k}</li>
        ))}
      </ul>
      <ul aria-hidden="true" className="mt-3 space-y-2 text-sm font-bold">
        {items.map((k, i) => {
          const started = !pos || i < pos.line || (i === pos.line);
          const done = !pos || i < pos.line || (i === pos.line && pos.chars >= k.length);
          const typing = Boolean(pos) && i === pos!.line && !done;
          const shown = !pos ? k : i < pos.line ? k : i === pos.line ? k.slice(0, pos.chars) : "";
          return (
            <li key={k} className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                {typing ? <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-70", DOTS[i % 4])} /> : null}
                <span
                  className={cn(
                    "relative inline-flex h-2.5 w-2.5 rounded-full transition-[transform,opacity] duration-300 ease-(--ease-premium)",
                    DOTS[i % 4],
                    started ? "scale-100 opacity-100" : "scale-0 opacity-0",
                  )}
                />
              </span>
              {/* Görünmez tam metin genişliği/yüksekliği sabitler; yazılan metin üstüne biner */}
              <span className="relative">
                <span className="invisible">{k}</span>
                <span className="absolute inset-0 whitespace-nowrap">
                  {shown}
                  {typing ? <span className="ml-px inline-block h-[1.05em] w-[2px] translate-y-[2px] animate-pulse bg-brand-ink align-baseline" /> : null}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      {note ? <p className="mt-3 text-[11px] text-muted">{note}</p> : null}
    </div>
  );
}
