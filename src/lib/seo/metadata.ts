import "server-only";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { seoSettings } from "@/lib/db/schema";
import { getSiteSettings } from "@/lib/settings";
import { htmlToText } from "@/lib/sanitize";
import { getImageMeta } from "./image-meta";
import { absoluteUrl, canonicalUrl, SITE_LOCALE, SITE_NAME } from "./site";
import { STATIC_PAGES, type StaticPageKey } from "./static-pages";

/** Dinamik OG görsel rotaları (/og/...) her zaman 1200×630 PNG üretir. */
export const OG_SIZE = { width: 1200, height: 630 } as const;

/** Marka yoksa ekler: "Keçe Oyuncak Kitleri" → "Keçe Oyuncak Kitleri | Bıcırıklar Kids". */
export function withBrand(title: string): string {
  const t = title.trim();
  return /b[ıi]c[ıi]r[ıi]klar/i.test(t) ? t : `${t} | ${SITE_NAME}`;
}

const TITLE_MAX = 60;
/** Arama sonucunda kesilmesin: 60 karakteri aşan başlıkta sondaki " | Bıcırıklar Kids" eki atılır. */
export function fitTitle(title: string): string {
  const t = title.trim();
  if (t.length <= TITLE_MAX) return t;
  const suffix = ` | ${SITE_NAME}`;
  return t.endsWith(suffix) ? t.slice(0, -suffix.length).trim() : t;
}

/** Meta description: gerçek içerikten (ilk cümleler) türetilmiş ~155 karakterlik özet. */
export function deriveDescription(...sources: (string | null | undefined)[]): string {
  // Kısa kaynak (ör. ürün kısa açıklaması) sonraki kaynakla tamamlanır → 120+ karakterlik doyurucu özet
  const texts = sources.map((s) => htmlToText(s)).filter((s) => s.length > 0);
  let text = texts[0] ?? "";
  for (const next of texts.slice(1)) {
    if (text.length >= 120) break;
    if (next.startsWith(text.slice(0, 40))) continue;
    text = `${text.trimEnd()}${/[.!?…]$/.test(text.trimEnd()) ? "" : "."} ${next}`;
  }
  const max = 158;
  if (text.length <= max) return text;
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [];
  let out = "";
  for (const s of sentences) {
    if ((out + s).trim().length > max) break;
    out = `${out}${s}`.trim() + " ";
  }
  out = out.trim();
  if (out.length >= 70) return out;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:\s]+$/, "")}…`;
}

export type SeoFields = {
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  canonicalUrl?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  noIndex?: boolean | null;
};

type BuildInput = {
  /** Nihai <title> (marka dahil). */
  title: string;
  description: string;
  path: string;
  canonical?: string | null;
  keywords?: string | null;
  /** Yüklenmiş görsel (/uploads/...) veya dinamik OG rotası (/og/...). */
  image?: string | null;
  imageAlt?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  index?: boolean;
  follow?: boolean;
  type?: "website" | "article";
  publishedTime?: Date | null;
  modifiedTime?: Date | null;
};

/**
 * Tüm public sayfaların metadata'sı buradan üretilir: title, description, keywords, self canonical,
 * robots, OpenGraph (gerçek görsel ölçüsüyle), Twitter/X summary_large_image.
 */
export async function buildMetadata(input: BuildInput): Promise<Metadata> {
  const settings = await getSiteSettings();
  const url = canonicalUrl(input.path, input.canonical);
  const imagePath = input.image || settings.brand.defaultOgImage || "/og/site";
  const imageUrl = absoluteUrl(imagePath);
  const meta = imagePath.startsWith("/og/") ? { ...OG_SIZE, type: "image/png" } : await getImageMeta(imagePath);
  const ogTitle = input.ogTitle?.trim() || fitTitle(input.title);
  const ogDescription = input.ogDescription?.trim() || input.description;
  const index = input.index ?? true;
  const follow = input.follow ?? true;
  const keywords = input.keywords
    ?.split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  return {
    title: { absolute: fitTitle(input.title) },
    description: input.description,
    ...(keywords?.length ? { keywords } : {}),
    alternates: { canonical: url },
    robots: {
      index,
      follow,
      ...(index ? { "max-image-preview": "large" as const, "max-snippet": -1, "max-video-preview": -1 } : {}),
    },
    openGraph: {
      type: input.type ?? "website",
      locale: SITE_LOCALE,
      siteName: settings.brand.name || SITE_NAME,
      url,
      title: ogTitle,
      description: ogDescription,
      images: [{ url: imageUrl, ...(meta ? { width: meta.width, height: meta.height, type: meta.type } : {}), alt: input.imageAlt || ogTitle }],
      ...(input.type === "article" && input.publishedTime ? { publishedTime: input.publishedTime.toISOString() } : {}),
      ...(input.type === "article" && input.modifiedTime ? { modifiedTime: input.modifiedTime.toISOString() } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [{ url: imageUrl, alt: input.imageAlt || ogTitle }],
    },
  };
}

/**
 * Varlık (ürün/kategori/blog/sayfa) için: DB'deki manuel SEO alanları varsa onlar, yoksa otomatik fallback.
 * `titlePattern` fallback başlığı üretir (ör. ürün: "{ad} | Bıcırıklar Kids").
 */
export function buildEntityMetadata(input: {
  name: string;
  fallbackTitle?: string;
  path: string;
  seo: SeoFields;
  fallbackDescription: (string | null | undefined)[];
  image?: string | null;
  imageAlt?: string | null;
  type?: "website" | "article";
  publishedTime?: Date | null;
  modifiedTime?: Date | null;
  forceNoIndex?: boolean;
}): Promise<Metadata> {
  const { seo } = input;
  return buildMetadata({
    title: seo.seoTitle?.trim() ? withBrand(seo.seoTitle) : input.fallbackTitle ?? withBrand(input.name),
    description: seo.seoDescription?.trim() || deriveDescription(...input.fallbackDescription) || `${input.name} — ${SITE_NAME}`,
    keywords: seo.seoKeywords,
    path: input.path,
    canonical: seo.canonicalUrl,
    image: seo.ogImage || input.image,
    imageAlt: input.imageAlt,
    ogTitle: seo.ogTitle,
    ogDescription: seo.ogDescription,
    index: !(seo.noIndex || input.forceNoIndex),
    follow: true,
    type: input.type,
    publishedTime: input.publishedTime,
    modifiedTime: input.modifiedTime,
  });
}

/** Admin › SEO'da yönetilen statik sayfa. Alan boşsa static-pages.ts'teki varsayılan kullanılır. */
export async function buildStaticPageMetadata(key: StaticPageKey, overrides?: { path?: string; index?: boolean; image?: string }): Promise<Metadata> {
  const def = STATIC_PAGES[key];
  let row: typeof seoSettings.$inferSelect | undefined;
  try {
    [row] = await db.select().from(seoSettings).where(eq(seoSettings.key, key)).limit(1);
  } catch {
    row = undefined;
  }
  return buildMetadata({
    title: row?.title?.trim() ? withBrand(row.title) : def.defaults.title,
    description: row?.description?.trim() || def.defaults.description,
    keywords: row?.keywords,
    path: overrides?.path ?? def.path,
    canonical: row?.canonicalUrl,
    image: row?.ogImage || overrides?.image,
    ogTitle: row?.ogTitle,
    ogDescription: row?.ogDescription,
    index: overrides?.index ?? row?.robotsIndex ?? true,
    follow: row?.robotsFollow ?? true,
  });
}

/** Özel (indexlenmeyen) sayfalar: sepet, ödeme, hesap, arama sonuçları. */
export function privateMetadata(title: string): Metadata {
  return { title: { absolute: withBrand(title) }, robots: { index: false, follow: false } };
}
