"use client";

import { useEffect } from "react";

/**
 * `.reveal` öğelerini görünüme girdiklerinde gösterir (tek IntersectionObserver).
 * Sağlamlık: React bir öğenin className'ini yeniden yazarsa (yeniden render, HMR, istemci tarafı gezinme)
 * eklenen `is-visible` silinebilir → öğe görünmez kalırdı. MutationObserver DOM'daki yeni/değişen `.reveal`
 * öğelerini yakalayıp yeniden gözlemler; zaten ekrandaysa hemen görünür olur. Gözlenen öğe görünür olunca bırakılır.
 */
export function RevealObserver() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!("IntersectionObserver" in window) || reduce) {
      const showAll = () => document.querySelectorAll<HTMLElement>(".reveal:not(.is-visible)").forEach((el) => el.classList.add("is-visible"));
      showAll();
      const mo = new MutationObserver(showAll);
      mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
      return () => mo.disconnect();
    }

    const watched = new WeakSet<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
          watched.delete(e.target);
        }
      },
      { rootMargin: "0px 0px -4% 0px", threshold: 0.01 },
    );

    let frame = 0;
    const scan = () => {
      frame = 0;
      document.querySelectorAll(".reveal:not(.is-visible)").forEach((el) => {
        if (watched.has(el)) return;
        watched.add(el);
        io.observe(el);
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(scan);
    };
    scan();
    // Performans: yalnızca .reveal ile ilgili değişikliklerde tara (animasyonlu bileşenlerin her
    // sınıf/metin değişikliğinde tüm sayfayı querySelectorAll ile taramayalım).
    const relevant = (records: MutationRecord[]) =>
      records.some((r) => {
        if (r.type === "attributes") {
          const t = r.target as Element;
          return t.classList.contains("reveal") && !t.classList.contains("is-visible");
        }
        for (const n of r.addedNodes) {
          if (n.nodeType === 1 && ((n as Element).matches(".reveal") || (n as Element).querySelector(".reveal"))) return true;
        }
        return false;
      });
    const mo = new MutationObserver((records) => {
      if (relevant(records)) schedule();
    });
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    return () => {
      mo.disconnect();
      io.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
