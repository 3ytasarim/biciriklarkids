"use client";

import { useEffect } from "react";

/**
 * Yatay kaydırmalı listeyi (carousel) belirli aralıklarla bir kart ilerletir; sona gelince başa döner.
 * Ziyaretçi üzerine geldiğinde, dokunduğunda, klavyeyle içinde gezindiğinde, liste ekranda değilken veya
 * sekme arka plandayken durur. Hareket azaltma tercihinde hiç çalışmaz. Kaydırılacak taşma yoksa boşta kalır.
 */
export function ScrollerAutoplay({ targetId, interval = 4000 }: { targetId: string; interval?: number }) {
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let hover = false;
    let focus = false;
    let visible = false;
    let resumeAt = 0;
    const pauseFor = (ms: number) => (resumeAt = Date.now() + ms);

    const step = () => {
      if (hover || focus || !visible || document.hidden || Date.now() < resumeAt) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 4) return;
      const first = el.firstElementChild as HTMLElement | null;
      const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
      const card = (first?.offsetWidth ?? el.clientWidth * 0.8) + gap;
      if (el.scrollLeft >= max - 4) el.scrollTo({ left: 0, behavior: "smooth" });
      else el.scrollBy({ left: card, behavior: "smooth" });
    };

    const timer = window.setInterval(step, interval);
    const io = new IntersectionObserver(([e]) => (visible = !!e?.isIntersecting), { threshold: 0.4 });
    io.observe(el);

    const on = (t: string, f: () => void) => {
      el.addEventListener(t, f, { passive: true });
      return () => el.removeEventListener(t, f);
    };
    const offs = [
      on("pointerenter", () => (hover = true)),
      on("pointerleave", () => (hover = false)),
      on("touchstart", () => pauseFor(8000)),
      on("wheel", () => pauseFor(8000)),
      on("focusin", () => (focus = true)),
      on("focusout", () => (focus = false)),
    ];

    return () => {
      window.clearInterval(timer);
      io.disconnect();
      offs.forEach((f) => f());
    };
  }, [targetId, interval]);

  return null;
}
