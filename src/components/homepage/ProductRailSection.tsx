import type { ProductCardData } from "@/lib/catalog/types";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductGrid } from "@/components/product/ProductGrid";
import { cn } from "@/lib/utils";
import { ScrollerArrows } from "@/components/ui/ScrollerArrows";
import { ScrollerAutoplay } from "@/components/ui/ScrollerAutoplay";

/** Ürün carousel bölümü — kendiliğinden yavaşça akar, oklarla/kaydırarak gezilir; ürün yoksa render edilmez. */
export function ProductRailSection({
  id,
  eyebrow,
  title,
  subtitle,
  products,
  link,
  tinted = false,
}: {
  id: string;
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  products: ProductCardData[];
  link?: { href: string; label: string } | null;
  tinted?: boolean;
}) {
  if (!products.length) return null;
  return (
    <section aria-labelledby={`${id}-title`} className={cn("py-8 sm:py-20", tinted && "bg-cream")}>
      <div className="shell">
        <SectionHeading id={`${id}-title`} eyebrow={eyebrow} title={title} description={subtitle} link={link} className="reveal" />
        <ProductGrid products={products} listId={id} listName={title} layout="rail" scrollerId={`${id}-list`} className="reveal mt-7 sm:mt-10" />
        <ScrollerArrows targetId={`${id}-list`} label={title} className="mt-4 hidden justify-end md:flex" />
        <ScrollerAutoplay targetId={`${id}-list`} />
      </div>
    </section>
  );
}
