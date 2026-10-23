import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CategoryNode } from "@/lib/catalog/types";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CategoryTile } from "@/components/category/CategoryTile";
import { cn } from "@/lib/utils";

/**
 * Kategori keşfi — TEK liste, iki düzen (DOM'da tekrar yok):
 * - Mobil/tablet: yatay kaydırmalı büyük karolar
 * - Masaüstü (lg+): 5+ kategoride ilk karo büyük (2×2) mozaik; daha azında eşit sütunlar
 */
export function CategoryDiscovery({ categories, eyebrow, title, subtitle, limit = 6 }: { categories: CategoryNode[]; eyebrow?: string | null; title: string; subtitle?: string | null; limit?: number }) {
  if (!categories.length) return null;
  // Gerçek fotoğrafı olan kategoriler önce (sıralama kararlı; menü sırası etkilenmez)
  const list = [...categories].sort((a, b) => Number(Boolean(b.image)) - Number(Boolean(a.image))).slice(0, limit);
  const desktopCount = Math.min(list.length, 5);
  const mosaic = desktopCount >= 5;
  const rest = categories.length - desktopCount;

  return (
    <section aria-labelledby="kategori-kesfi" className="py-10 sm:py-20 lg:py-28">
      <div className="shell">
        <SectionHeading id="kategori-kesfi" eyebrow={eyebrow} title={title} description={subtitle} link={{ href: "/kategoriler", label: "Tüm kategoriler" }} className="reveal" />
        <ul
          className={cn("scroller reveal -mx-4 mt-7 px-4 sm:mt-10 sm:-mx-6 sm:px-6 lg:mx-0 lg:mt-12 lg:grid lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0", mosaic && "lg:grid-cols-4 lg:grid-rows-2")}
          style={!mosaic ? { gridTemplateColumns: `repeat(${Math.max(2, desktopCount)}, minmax(0, 1fr))` } : undefined}
        >
          {list.map((c, i) => (
            <li key={c.id} className={cn("w-[72%] shrink-0 min-[520px]:w-[46%] lg:w-auto", mosaic && i === 0 && "lg:col-span-2 lg:row-span-2", i >= desktopCount && "lg:hidden")}>
              <CategoryTile category={c} size={mosaic && i === 0 ? "lg" : "md"} />
            </li>
          ))}
        </ul>
        {rest > 0 ? (
          <div className="mt-8 hidden justify-center lg:flex">
            <Link href="/kategoriler" className="btn-outline">
              {rest} kategori daha <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
