"use client";

import { useEffect, useRef, useState } from "react";
import { SafeImage } from "@/components/ui/SafeImage";

/**
 * Kartın ikinci (hover) görseli — yalnızca fare kartın üzerine İLK geldiğinde yüklenir.
 * Önceden her kartta görünmez ama ekranda olduğu için indiriliyordu (liste sayfasında görsel trafiği 2×).
 * Dokunmatik cihazlarda (hover yok) hiç yüklenmez.
 */
export function CardHoverImage({ src, sizes }: { src: string; sizes: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    const card = ref.current?.closest("article");
    if (!card) return;
    const on = () => setShow(true);
    card.addEventListener("pointerenter", on, { once: true });
    card.addEventListener("focusin", on, { once: true });
    return () => {
      card.removeEventListener("pointerenter", on);
      card.removeEventListener("focusin", on);
    };
  }, []);

  return (
    <span ref={ref} aria-hidden="true" className="contents">
      {show ? <SafeImage src={src} alt="" fill sizes={sizes} className="card-hover-img object-cover opacity-0 transition-opacity duration-700 ease-(--ease-premium)" onLoad={() => ref.current?.closest("article")?.setAttribute("data-hover-ready", "")} /> : null}
    </span>
  );
}
