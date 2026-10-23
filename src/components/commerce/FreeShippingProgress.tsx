import { Truck } from "lucide-react";
import { formatPrice } from "@/lib/commerce/money";
import { cn } from "@/lib/utils";

/** Yalnızca admin'de ücretsiz kargo eşiği tanımlıysa gösterilir . */
export function FreeShippingProgress({ remaining, threshold, className }: { remaining: number | null; threshold: number; className?: string }) {
  const done = remaining == null || remaining <= 0;
  const pct = done ? 100 : Math.max(4, Math.min(100, ((threshold - remaining) / threshold) * 100));
  return (
    <div className={cn("rounded-md bg-leaf-50 px-4 py-3", className)}>
      <p className="flex items-center gap-2 text-sm font-bold text-leaf-ink">
        <Truck aria-hidden="true" className="h-4 w-4 shrink-0" />
        {done ? (
          "Kargo ücretsiz!"
        ) : (
          <span>
            Ücretsiz kargo için <strong className="tabular-nums">{formatPrice(remaining)}</strong> daha ekleyin.
          </span>
        )}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label="Ücretsiz kargo ilerlemesi">
        <div className="h-full rounded-full bg-leaf transition-[width] duration-700 ease-(--ease-premium)" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
