"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityStepper({ value, onChange, min = 1, max = 99, disabled, size = "md", label = "Adet" }: { value: number; onChange: (v: number) => void; min?: number; max?: number; disabled?: boolean; size?: "sm" | "md"; label?: string }) {
  const h = size === "sm" ? "h-10" : "h-12";
  const w = size === "sm" ? "w-9" : "w-11";
  return (
    <div role="group" aria-label={label} className={cn("inline-flex items-center rounded-full border-[1.5px] border-line-strong bg-white", h)}>
      <button type="button" className={cn("flex h-full items-center justify-center rounded-l-full transition-colors hover:bg-ink/5 disabled:opacity-35", w)} onClick={() => onChange(Math.max(min, value - 1))} disabled={disabled || value <= min} aria-label="Azalt">
        <Minus aria-hidden="true" className="h-4 w-4" />
      </button>
      <output aria-live="polite" className="min-w-8 text-center text-[15px] font-extrabold tabular-nums">
        {value}
      </output>
      <button type="button" className={cn("flex h-full items-center justify-center rounded-r-full transition-colors hover:bg-ink/5 disabled:opacity-35", w)} onClick={() => onChange(Math.min(max, value + 1))} disabled={disabled || value >= max} aria-label="Artır">
        <Plus aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}
