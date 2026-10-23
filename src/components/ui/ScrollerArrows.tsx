"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Yatay kaydırmalı listeler için önceki/sonraki düğmeleri (fare kullanıcıları için). Uçlarda pasifleşir. */
export function ScrollerArrows({ targetId, label, className }: { targetId: string; label: string; className?: string }) {
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const update = () => setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [targetId]);

  const go = (dir: 1 | -1) => {
    const el = document.getElementById(targetId);
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  if (edge.start && edge.end) return null;
  const btn = "flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-line-strong bg-white text-ink transition-colors hover:border-ink disabled:cursor-default disabled:opacity-35 disabled:hover:border-line-strong";
  return (
    <div className={cn("flex gap-2", className)}>
      <button type="button" onClick={() => go(-1)} disabled={edge.start} aria-controls={targetId} aria-label={`${label}: önceki`} className={btn}>
        <ChevronLeft aria-hidden="true" className="h-5 w-5" />
      </button>
      <button type="button" onClick={() => go(1)} disabled={edge.end} aria-controls={targetId} aria-label={`${label}: sonraki`} className={btn}>
        <ChevronRight aria-hidden="true" className="h-5 w-5" />
      </button>
    </div>
  );
}
