"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import type { CartLine } from "@/lib/commerce/cart";
import { formatPrice } from "@/lib/commerce/money";
import { SafeImage } from "@/components/ui/SafeImage";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { cn } from "@/lib/utils";
import { useCommerce } from "./CommerceProvider";

/** Sepet satırı (çekmece ve sepet sayfası ortak). */
export function CartLineItem({ line: l, onNavigate, large = false }: { line: CartLine; onNavigate?: () => void; large?: boolean }) {
  const { updateLine, busy } = useCommerce();
  return (
    <li className={cn("flex gap-4", large ? "py-6" : "py-4")}>
      <Link href={`/urun/${l.slug}`} onClick={onNavigate} className={cn("shot relative shrink-0 overflow-hidden rounded-sm", large ? "h-32 w-28 sm:h-36 sm:w-32" : "h-24 w-20")}>
        {l.image ? <SafeImage src={l.image.url} alt={l.image.alt || l.name} fill sizes={large ? "128px" : "80px"} className="object-cover" /> : null}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {large && l.categoryName ? <p className="text-xs font-bold tracking-wide text-muted uppercase">{l.categoryName}</p> : null}
            <Link href={`/urun/${l.slug}`} onClick={onNavigate} className={cn("line-clamp-2 leading-snug font-bold hover:text-brand-ink", large ? "text-base sm:text-lg" : "text-[15px]")}>
              {l.name}
            </Link>
            {l.variantLabel ? <p className="text-sm text-muted">{l.variantLabel}</p> : null}
            {large ? <p className="mt-1 text-sm text-ink-soft tabular-nums">Birim: {formatPrice(l.unitPrice)}</p> : null}
            {!l.available ? <p className="text-sm font-bold text-danger">Stokta yok</p> : l.maxQuantity < 99 && l.quantity >= l.maxQuantity ? <p className="text-xs text-sun-ink">Stoktaki son {l.maxQuantity} ürün</p> : null}
          </div>
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <QuantityStepper size="sm" value={l.quantity} max={Math.max(1, l.maxQuantity)} disabled={busy || !l.available} onChange={(q) => updateLine(l.id, q)} label={`${l.name} adedi`} />
          <div className="flex items-center gap-1">
            <span className={cn("font-extrabold tabular-nums", large ? "text-lg" : "text-[15px]")}>{formatPrice(l.lineTotal)}</span>
            <button type="button" onClick={() => updateLine(l.id, 0)} disabled={busy} className="icon-btn h-10 w-10 text-muted hover:text-danger" aria-label={`${l.name} ürününü sepetten çıkar`}>
              <Trash2 aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
