import { discountPercent, formatPrice } from "@/lib/commerce/money";
import { cn } from "@/lib/utils";

/** Fiyat gösterimi: indirimli fiyat + üstü çizili eski fiyat + yüzde (yalnızca gerçek indirim varsa). */
export function Price({ price, compareAtPrice, size = "md", showPercent = false, className }: { price: number; compareAtPrice?: number | null; size?: "sm" | "md" | "lg"; showPercent?: boolean; className?: string }) {
  const main = { sm: "text-[15px]", md: "text-[17px]", lg: "text-[1.9rem] sm:text-[2.1rem]" }[size];
  // Fiyatı henüz girilmemiş ürün (0): satışa kapalıdır, "0,00 ₺" yerine bilgi notu gösterilir
  if (price <= 0) {
    return <p className={cn("font-extrabold text-muted", size === "lg" ? "text-xl" : "text-[15px]", className)}>Fiyat yakında</p>;
  }
  const pct = discountPercent(price, compareAtPrice);
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span className="sr-only">{pct ? "İndirimli fiyat:" : "Fiyat:"}</span>
      <span className={cn("font-extrabold tracking-tight tabular-nums", main, pct ? "text-coral-ink" : "text-ink")}>{formatPrice(price)}</span>
      {pct ? (
        <>
          <span className="sr-only">Normal fiyat:</span>
          <s className={cn("text-muted tabular-nums", size === "lg" ? "text-lg" : "text-sm")}>{formatPrice(compareAtPrice!)}</s>
          {showPercent ? <span className="rounded-full bg-coral-50 px-2 py-0.5 text-xs font-extrabold text-coral-ink">%{pct} indirim</span> : null}
        </>
      ) : null}
    </p>
  );
}
