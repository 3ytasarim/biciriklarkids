import Image from "next/image";
import Link from "next/link";
import type { PostCard } from "@/lib/content/queries";
import { FeltArt, motifFor } from "@/components/ui/FeltArt";
import { formatDate } from "@/lib/utils";

export function PostCardView({ post: p, headingLevel: H = "h3" }: { post: PostCard; headingLevel?: "h2" | "h3" }) {
  return (
    <article className="group">
      <Link href={`/blog/${p.slug}`} className="block">
        <div className="relative aspect-[3/2] overflow-hidden rounded-lg bg-cream">
          {p.coverImage ? (
            <Image src={p.coverImage} alt={p.coverImageAlt || p.title} fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw" className="object-cover transition-transform duration-[1.2s] ease-(--ease-premium) group-hover:scale-[1.04]" />
          ) : (
            <FeltArt accent="lilac" motif={motifFor(p.slug)} />
          )}
        </div>
        <p className="mt-4 flex flex-wrap items-center gap-x-2 text-xs font-bold text-muted">
          {p.categoryName ? <span className="text-brand-ink uppercase tracking-wider">{p.categoryName}</span> : null}
          {p.publishedAt ? <time dateTime={p.publishedAt.toISOString()}>{formatDate(p.publishedAt)}</time> : null}
          {p.readingMinutes ? <span>· {p.readingMinutes} dk okuma</span> : null}
        </p>
        <H className="mt-2 font-display text-xl leading-snug font-extrabold tracking-[-0.01em] group-hover:text-brand-ink sm:text-[1.4rem]">{p.title}</H>
        {p.excerpt ? <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-ink-soft">{p.excerpt}</p> : null}
      </Link>
    </article>
  );
}
