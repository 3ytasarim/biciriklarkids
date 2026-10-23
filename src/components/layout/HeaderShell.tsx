"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Kaydırınca kompaktlaşan sticky header kabuğu (pasif scroll dinleyici + rAF; yalnızca eşik geçişinde render). */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const [compact, setCompact] = useState(false);
  const ticking = useRef(false);

  useEffect(() => {
    const update = () => {
      ticking.current = false;
      setCompact(window.scrollY > 24);
    };
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-compact={compact || undefined}
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,box-shadow,border-color] duration-300 [--header-h:72px] lg:[--header-h:90px]",
        compact ? "border-line bg-paper/92 shadow-[0_10px_30px_-24px_rgb(35_31_58/0.45)] backdrop-blur-md lg:[--header-h:74px]" : "border-transparent bg-paper",
      )}
    >
      {children}
    </header>
  );
}
