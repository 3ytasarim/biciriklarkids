import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FeltArt, motifFor } from "@/components/ui/FeltArt";
import { toAccent } from "@/lib/catalog/types";
import { cn, isStudioShot } from "@/lib/utils";

export type CategoryTileData = { name: string; slug: string; description: string | null; image: string | null; imageAlt: string | null; accent: string; productCount: number };

/** Büyük görselli kategori karosu: aktivite türünü hissettiren görsel + başlık + kısa CTA. */
export function CategoryTile({ category: c, size = "md", className, headingLevel: H = "h3" }: { category: CategoryTileData; size?: "lg" | "md"; className?: string; headingLevel?: "h2" | "h3" }) {
  const accent = toAccent(c.accent);
  return (
    <Link href={`/kategori/${c.slug}`} className={cn(`tint-${accent} group relative flex h-full flex-col overflow-hidden rounded-lg`, className)} style={{ background: "var(--tint)" }}>
      <div className={cn("relative w-full overflow-hidden", size === "lg" ? "aspect-[4/5] lg:aspect-auto lg:min-h-0 lg:flex-1" : "aspect-[4/5] lg:aspect-[5/4]")}>
        {c.image ? (
          <Image src={c.image} alt={c.imageAlt || c.name} fill sizes={size === "lg" ? "(min-width: 1024px) 40vw, 80vw" : "(min-width: 1024px) 25vw, 70vw"} className={cn("transition-transform duration-[1.2s] ease-(--ease-premium)", isStudioShot(c.image) ? "object-contain p-2 mix-blend-multiply group-hover:scale-[1.06]" : "object-cover group-hover:scale-[1.04]")} />
        ) : (
          <FeltArt accent={accent} motif={motifFor(c.slug)} className="absolute inset-0 transition-transform duration-[1.2s] ease-(--ease-premium) group-hover:scale-[1.04]" />
        )}
      </div>
      <div className="flex items-end justify-between gap-3 p-5 sm:p-6">
        <div className="min-w-0">
          <H className={cn("font-display leading-[1.1] font-extrabold tracking-[-0.015em]", size === "lg" ? "text-2xl sm:text-[1.9rem]" : "text-xl sm:text-[1.4rem]")}>{c.name}</H>
          <p className="mt-1.5 text-sm font-bold" style={{ color: "var(--tint-ink)" }}>
            {c.productCount ? `${c.productCount} ürün · ` : ""}Keşfet
          </p>
        </div>
        <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-soft transition-all duration-300 group-hover:bg-ink group-hover:text-white">
          <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:rotate-45" />
        </span>
      </div>
    </Link>
  );
}
