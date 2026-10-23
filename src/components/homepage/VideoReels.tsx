import Link from "next/link";
import { inArray } from "drizzle-orm";
import { ArrowUpRight } from "lucide-react";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import type { VideoSlot as VideoRow } from "@/lib/content/queries";
import { LazyVideo } from "@/components/video/LazyVideo";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollerArrows } from "@/components/ui/ScrollerArrows";

/**
 * Dikey (9:16) atölye videoları — Reels tarzı yatay kaydırmalı şerit.
 * Performans: her video LazyVideo ile yalnızca görünüme yaklaşınca yüklenir, ekrandan çıkınca durur;
 * ilk yüklemede yalnızca küçük posterler iner. Video bir ürüne bağlıysa kartta ürün bağlantısı görünür.
 * Video yoksa bölüm hiç render edilmez.
 */
export async function VideoReels({ id, videos, eyebrow, title, subtitle }: { id: string; videos: VideoRow[]; eyebrow?: string | null; title: string; subtitle?: string | null }) {
  if (!videos.length) return null;
  const ids = [...new Set(videos.map((v) => v.productId).filter((x): x is string => Boolean(x)))];
  const linked = ids.length ? await db.select({ id: products.id, slug: products.slug, name: products.name }).from(products).where(inArray(products.id, ids)) : [];
  const byId = new Map(linked.map((p) => [p.id, p]));

  return (
    <section aria-labelledby={`${id}-title`} className="overflow-hidden py-10 sm:py-20">
      <div className="shell">
        <div className="flex items-end justify-between gap-6">
          <SectionHeading id={`${id}-title`} eyebrow={eyebrow} title={title} description={subtitle} className="reveal" />
          <ScrollerArrows targetId={`${id}-list`} label={title} className="hidden shrink-0 md:flex" />
        </div>
        <ul id={`${id}-list`} className="scroller reveal -mx-4 mt-7 gap-4 px-4 sm:-mx-6 sm:mt-10 sm:gap-5 sm:px-6 lg:mx-0 lg:px-0">
          {videos.map((v, i) => {
            const product = v.productId ? byId.get(v.productId) : undefined;
            return (
              <li key={v.id} className="w-[62%] shrink-0 snap-start min-[480px]:w-[40%] md:w-[30%] lg:w-[calc((100%-3*1.25rem)/4)]" style={{ "--reveal-delay": `${i * 70}ms` } as React.CSSProperties}>
                <figure className="group relative overflow-hidden rounded-[22px] bg-ink shadow-[0_24px_50px_-30px_rgb(16_40_74/0.55)] ring-1 ring-line">
                  <LazyVideo src={v.desktopUrl!} mobileSrc={v.mobileUrl} poster={v.posterUrl} mobilePoster={v.mobilePosterUrl} aspectRatio="9/16" title={v.title} autoplay={v.autoplay} loop={v.loop} rounded={false} />
                  <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 via-ink/35 to-transparent p-4 pt-14 pr-16 text-white">
                    <span className="block text-[15px] leading-snug font-extrabold [text-shadow:0_1px_8px_rgb(0_0_0/0.35)]">{v.title}</span>
                    {product ? (
                      <Link href={`/urun/${product.slug}`} className="pointer-events-auto mt-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-xs font-extrabold text-ink transition-colors hover:bg-white">
                        Ürünü incele <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                      </Link>
                    ) : null}
                  </figcaption>
                </figure>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
