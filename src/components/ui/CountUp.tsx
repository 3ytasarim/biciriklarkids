"use client";

import { useEffect, useRef } from "react";

/**
 * Görünür olunca 0'dan hedefe sayan rakam. Sunucu HTML'inde gerçek değer yazar (SEO ve JS'siz
 * ziyaretçi için); sayma yalnızca istemcide, metni doğrudan güncelleyerek yapılır (yeniden render yok).
 */
export function CountUp({ value, suffix = "", duration = 1400 }: { value: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 4);
          el.textContent = `${Math.round(value * eased)}${suffix}`;
          if (t < 1) raf = requestAnimationFrame(step);
        };
        el.textContent = `0${suffix}`;
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, suffix, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {value}
      {suffix}
    </span>
  );
}
