"use client";

import { useEffect, useRef, useState } from "react";
import { RevealText } from "@/components/ui/RevealText";
import { cn } from "@/lib/utils";

export type HowToStep = { title: string; text: string };

const STEP_MS = 950; // adımlar arası süre

/**
 * Yapım adımları — bölüm görünüme girince adımlar sırayla "dolar":
 * numara dairesi renklenir, aradaki dikiş çizgisi dolar, başlık harf harf netleşir, açıklama ardından belirir.
 * - Metnin tamamı sunucu HTML'inde vardır (SEO + JS'siz); gizleme yalnızca `.js` varken CSS ile yapılır.
 * - prefers-reduced-motion: tüm adımlar anında görünür.
 */
export function HowToSteps({ steps }: { steps: HowToStep[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer = 0;
    const start = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setActive(steps.length);
      let n = 0;
      const tick = () => {
        n++;
        setActive(n);
        if (n < steps.length) timer = window.setTimeout(tick, STEP_MS);
      };
      tick();
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        io.disconnect();
        start();
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [steps.length]);

  return (
    <ol ref={ref} className="mt-8">
      {steps.map((s, i) => {
        const on = i < active;
        const lineOn = i < active - 1;
        return (
          <li key={s.title} className={cn("howto-step relative flex gap-5 pb-8 last:pb-0", on && "is-on")}>
            {i < steps.length - 1 ? (
              <span aria-hidden="true" className="absolute top-12 bottom-1 left-[21px] w-[3px] overflow-hidden rounded-full bg-[repeating-linear-gradient(180deg,var(--color-line-strong)_0_6px,transparent_6px_11px)]">
                <span className={cn("block w-full origin-top rounded-full bg-brand transition-transform duration-700 ease-(--ease-premium)", lineOn ? "scale-y-100" : "scale-y-0")} style={{ height: "100%" }} />
              </span>
            ) : null}
            <span
              aria-hidden="true"
              className={cn(
                "howto-num relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-lg font-extrabold transition-all duration-500 ease-(--ease-premium)",
                on ? "scale-100 bg-brand text-white shadow-[0_10px_24px_-10px_var(--color-brand)]" : "scale-90 bg-white text-muted ring-1 ring-line",
              )}
            >
              {on ? <span className="absolute inset-0 animate-ping rounded-full bg-brand/30 [animation-iteration-count:1]" /> : null}
              <span className="relative">{i + 1}</span>
            </span>
            <div className="min-w-0 pt-1.5">
              <h3 className="font-sans text-[17px] font-extrabold">
                <span className="sr-only">{s.title}</span>
                <RevealText text={s.title} />
              </h3>
              <p className="howto-text mt-1 text-[15px] leading-relaxed text-ink-soft">{s.text}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
