import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";
import type { PostCard } from "@/lib/content/queries";
import type { FaqItem } from "@/lib/db/schema";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FaqList } from "@/components/ui/FaqList";
import { NewsletterForm } from "@/components/marketing/NewsletterForm";
import { PostCardView } from "@/components/blog/PostCardView";
import { Cloud } from "@/components/ui/Clouds";
import { formatDate } from "@/lib/utils";

export type HomeReview = { id: string; authorName: string; rating: number; title: string | null; body: string; verifiedPurchase: boolean; createdAt: Date; productName: string; productSlug: string };

/** Müşteri yorumları — YALNIZCA onaylı gerçek yorumlar; hiç yoksa bölüm render edilmez. */
export function ReviewsSection({ eyebrow, title, reviews }: { eyebrow?: string | null; title: string; reviews: HomeReview[] }) {
  if (!reviews.length) return null;
  return (
    <section aria-labelledby="reviews-title" className="bg-cream py-12 sm:py-24">
      <div className="shell">
        <SectionHeading id="reviews-title" eyebrow={eyebrow} title={title} className="reveal" />
        <ul className="scroller reveal -mx-4 mt-10 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0">
          {reviews.map((r) => (
            <li key={r.id} className="w-[85%] shrink-0 sm:w-[46%] lg:w-auto">
              <figure className="flex h-full flex-col rounded-lg bg-white p-6 shadow-soft sm:p-7">
                <div className="flex items-center gap-0.5" role="img" aria-label={`5 üzerinden ${r.rating} yıldız`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} aria-hidden="true" className={`h-4 w-4 ${i < r.rating ? "fill-sun stroke-sun" : "stroke-line-strong"}`} />
                  ))}
                </div>
                {r.title ? <p className="mt-4 font-display text-lg font-extrabold">{r.title}</p> : null}
                <blockquote className="mt-2 line-clamp-6 flex-1 text-[15px] leading-relaxed text-ink-soft">“{r.body}”</blockquote>
                <figcaption className="mt-5 border-t border-dashed border-line-strong pt-4 text-sm">
                  <span className="flex items-center gap-1.5 font-extrabold">
                    {r.authorName}
                    {r.verifiedPurchase ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-leaf-ink">
                        <BadgeCheck aria-hidden="true" className="h-4 w-4" /> Doğrulanmış alışveriş
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-muted">
                    <Link href={`/urun/${r.productSlug}`} className="underline-offset-2 hover:underline">
                      {r.productName}
                    </Link>{" "}
                    · {formatDate(r.createdAt)}
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function BlogTeaser({ eyebrow, title, posts, link }: { eyebrow?: string | null; title: string; posts: PostCard[]; link?: { href: string; label: string } | null }) {
  if (!posts.length) return null;
  return (
    <section aria-labelledby="blog-title" className="py-10 sm:py-24">
      <div className="shell">
        <SectionHeading id="blog-title" eyebrow={eyebrow} title={title} link={link} className="reveal" />
        <ul className="reveal mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <li key={p.id}>
              <PostCardView post={p} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function NewsletterSection({ title, subtitle }: { title: string; subtitle?: string | null }) {
  return (
    <section aria-labelledby="newsletter-title" className="py-6 sm:py-16">
      <div className="shell">
        <div className="reveal relative overflow-hidden rounded-xl bg-brand-ink [container-type:inline-size] px-6 py-12 text-white sm:px-12 sm:py-16 lg:px-20">
          <Cloud className="cloud-drift-a absolute -top-6 right-6 w-52 text-white/12 sm:w-72" />
          <Cloud className="cloud-drift-b absolute -bottom-8 left-[30%] w-44 text-white/10 sm:w-60" />
          <Cloud className="cloud-cross absolute top-[38%] left-0 w-24 text-white/8 sm:w-32" />
          <div className="relative grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 id="newsletter-title" className="display-2 text-white">
                {title}
              </h2>
              {subtitle ? <p className="mt-4 max-w-lg text-[1.05rem] leading-relaxed text-white/85">{subtitle}</p> : null}
            </div>
            <NewsletterForm tone="dark" source="homepage" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** SEO / GEO marka içeriği: kısa giriş + görünür SSS (FAQPage şeması sayfada bu içerikle eşleşir). */
export function SeoContent({ title, faq }: { title: string; faq: FaqItem[] }) {
  return (
    <section aria-labelledby="seo-title" className="py-10 sm:py-24">
      <div className="shell grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <h2 id="seo-title" className="display-3">
            {title}
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
            <strong className="text-ink">Bıcırıklar Kids</strong>, İstanbul merkezli bir çocuk aktivite markasıdır. Keçe çanta dikiş kitleri, figürlü elyaf dolgulu keçe oyuncak kitleri, eğitim dikiş setleri, punch
            örgü setleri ve ahşap boyama setleri üretir; ürünlerini bu site üzerinden Türkiye geneline satar.
          </p>
        </div>
        <FaqList items={faq} openFirst className="lg:col-span-8" />
      </div>
    </section>
  );
}
