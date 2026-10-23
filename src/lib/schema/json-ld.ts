import "server-only";
import type { FaqItem } from "@/lib/db/schema";
import type { SiteSettings } from "@/lib/settings";
import { absoluteUrl, getSiteUrl, SITE_LANG } from "@/lib/seo/site";
import type { ProductCardData } from "@/lib/catalog/types";
import { htmlToText } from "@/lib/sanitize";

/**
 * Schema.org JSON-LD üreticileri. İlke: yalnızca sayfada GÖRÜNEN ve GERÇEK veriler işaretlenir.
 * - AggregateRating / Review yalnızca onaylı gerçek yorum varsa
 * - FAQPage yalnızca sayfada görünen SSS varsa
 * - VideoObject yalnızca gerçek video URL'si varsa
 * - sameAs yalnızca admin'e girilmiş gerçek sosyal hesaplar
 */

type Json = Record<string, unknown>;

export const ORG_ID = () => `${getSiteUrl()}/#organization`;
export const WEBSITE_ID = () => `${getSiteUrl()}/#website`;

const clean = <T extends Json>(obj: T): T => JSON.parse(JSON.stringify(obj)) as T; // undefined alanları at

export function organizationSchema(s: SiteSettings): Json {
  const sameAs = Object.values(s.social).filter((v): v is string => Boolean(v && /^https?:\/\//.test(v)));
  const hasAddress = s.contact.street || s.contact.city;
  return clean({
    "@type": "OnlineStore",
    "@id": ORG_ID(),
    name: s.brand.name,
    legalName: s.brand.legalName || undefined,
    url: getSiteUrl(),
    logo: s.brand.logoUrl ? absoluteUrl(s.brand.logoUrl) : absoluteUrl("/brand/biciriklar-logo.png"),
    slogan: s.brand.tagline || undefined,
    description:
      "Bıcırıklar Kids; çocuklar için keçe çanta ve keçe oyuncak dikiş kitleri, eğitim dikiş setleri, punch ve ahşap boyama setleri gibi eğitici, kendin yap (DIY) aktivite kitleri üreten ve satan bir Türk markasıdır.",
    email: s.contact.email || undefined,
    telephone: s.contact.phone || undefined,
    address: hasAddress
      ? {
          "@type": "PostalAddress",
          streetAddress: s.contact.street || undefined,
          addressLocality: s.contact.district || undefined,
          addressRegion: s.contact.city || undefined,
          postalCode: s.contact.postalCode || undefined,
          addressCountry: "TR",
        }
      : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
    contactPoint:
      s.contact.email || s.contact.phone
        ? [{ "@type": "ContactPoint", contactType: "customer service", email: s.contact.email || undefined, telephone: s.contact.phone || undefined, availableLanguage: ["Turkish"] }]
        : undefined,
    hasMerchantReturnPolicy: returnPolicySchema(s),
  });
}

export function returnPolicySchema(s: SiteSettings): Json {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "TR",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: s.commerce.returnDays,
    returnMethod: "https://schema.org/ReturnByMail",
    merchantReturnLink: absoluteUrl("/iade-politikasi"),
  };
}

export function websiteSchema(s: SiteSettings): Json {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID(),
    url: getSiteUrl(),
    name: s.brand.name,
    inLanguage: SITE_LANG,
    publisher: { "@id": ORG_ID() },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${getSiteUrl()}/arama?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]): Json {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
  };
}

export function faqSchema(faq: FaqItem[]): Json | null {
  const items = faq.filter((f) => f.question.trim() && f.answer.trim());
  if (!items.length) return null;
  return {
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: htmlToText(f.answer) } })),
  };
}

type ProductForSchema = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  barcode: string | null;
  mpn: string | null;
  brand: string;
  description: string | null;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  inStock: boolean;
  condition: string;
  material: string | null;
  ageMin: number | null;
  ageMax: number | null;
  categoryName: string | null;
  images: { url: string }[];
  updatedAt: Date;
};

export function productSchema(
  p: ProductForSchema,
  s: SiteSettings,
  reviews: { summary: { average: number; count: number } | null; list: { authorName: string; rating: number; body: string; title: string | null; createdAt: Date }[] },
  video?: { name: string; description: string | null; contentUrl: string; thumbnailUrl: string | null; uploadDate: Date; duration: number | null } | null,
): Json {
  const url = absoluteUrl(`/urun/${p.slug}`);
  const priceValidUntil = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString().slice(0, 10);
  const shipping = s.shipping.flatFee != null ? shippingDetailsSchema(s) : undefined;
  const gtin = p.barcode?.replace(/\D/g, "");
  return clean({
    "@type": "Product",
    "@id": `${url}#product`,
    name: p.name,
    url,
    sku: p.sku || undefined,
    mpn: p.mpn || p.sku || undefined,
    ...(gtin && [8, 12, 13, 14].includes(gtin.length) ? { [`gtin${gtin.length}`]: gtin } : {}),
    brand: { "@type": "Brand", name: p.brand },
    description: htmlToText(p.description) || p.shortDescription || undefined,
    image: p.images.length ? p.images.map((i) => absoluteUrl(i.url)) : undefined,
    category: p.categoryName || undefined,
    material: p.material || undefined,
    audience:
      p.ageMin || p.ageMax
        ? { "@type": "PeopleAudience", suggestedMinAge: p.ageMin ?? undefined, suggestedMaxAge: p.ageMax ?? undefined }
        : undefined,
    // Fiyatı henüz girilmemiş (0) ürüne teklif yazılmaz (0 TL teklif Google için yanıltıcı)
    offers: p.price <= 0 ? undefined : {
      "@type": "Offer",
      url,
      priceCurrency: "TRY",
      price: p.price.toFixed(2),
      priceValidUntil,
      availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: p.condition === "new" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
      seller: { "@id": ORG_ID() },
      hasMerchantReturnPolicy: returnPolicySchema(s),
      shippingDetails: shipping,
      ...(p.compareAtPrice && p.compareAtPrice > p.price
        ? { priceSpecification: { "@type": "UnitPriceSpecification", priceType: "https://schema.org/StrikethroughPrice", price: p.compareAtPrice.toFixed(2), priceCurrency: "TRY" } }
        : {}),
    },
    aggregateRating: reviews.summary
      ? { "@type": "AggregateRating", ratingValue: reviews.summary.average, reviewCount: reviews.summary.count, bestRating: 5, worstRating: 1 }
      : undefined,
    review: reviews.list.length
      ? reviews.list.slice(0, 10).map((r) => ({
          "@type": "Review",
          author: { "@type": "Person", name: r.authorName },
          datePublished: r.createdAt.toISOString().slice(0, 10),
          name: r.title || undefined,
          reviewBody: r.body,
          reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
        }))
      : undefined,
    subjectOf: video ? videoSchema(video) : undefined,
  });
}

export function shippingDetailsSchema(s: SiteSettings): Json | undefined {
  if (s.shipping.flatFee == null) return undefined;
  return {
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: s.shipping.flatFee.toFixed(2), currency: "TRY" },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "TR" },
  };
}

export function videoSchema(v: { name: string; description: string | null; contentUrl: string; thumbnailUrl: string | null; uploadDate: Date; duration: number | null }): Json {
  return clean({
    "@type": "VideoObject",
    name: v.name,
    description: v.description || v.name,
    contentUrl: absoluteUrl(v.contentUrl),
    thumbnailUrl: v.thumbnailUrl ? absoluteUrl(v.thumbnailUrl) : undefined,
    uploadDate: v.uploadDate.toISOString(),
    duration: v.duration ? `PT${Math.floor(v.duration / 60)}M${v.duration % 60}S` : undefined,
  });
}

export function itemListSchema(name: string, path: string, items: ProductCardData[]): Json {
  return {
    "@type": "CollectionPage",
    "@id": `${absoluteUrl(path)}#collection`,
    name,
    url: absoluteUrl(path),
    isPartOf: { "@id": WEBSITE_ID() },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: absoluteUrl(`/urun/${p.slug}`), name: p.name })),
    },
  };
}

export function articleSchema(a: {
  title: string;
  slug: string;
  description: string;
  image: string | null;
  publishedAt: Date;
  updatedAt: Date;
  authorName: string | null;
  categoryName: string | null;
  tags: string[];
}): Json {
  const url = absoluteUrl(`/blog/${a.slug}`);
  return clean({
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: a.title,
    description: a.description,
    url,
    mainEntityOfPage: url,
    image: a.image ? [absoluteUrl(a.image)] : [absoluteUrl(`/og/blog/${a.slug}`)],
    datePublished: a.publishedAt.toISOString(),
    dateModified: a.updatedAt.toISOString(),
    inLanguage: SITE_LANG,
    author: a.authorName ? { "@type": "Person", name: a.authorName } : { "@id": ORG_ID() },
    publisher: { "@id": ORG_ID() },
    articleSection: a.categoryName || undefined,
    keywords: a.tags.length ? a.tags.join(", ") : undefined,
  });
}

/** Birden fazla düğümü tek @graph içinde döndürür (null'lar atılır). */
export function graph(...nodes: (Json | null | undefined)[]): Json {
  return { "@context": "https://schema.org", "@graph": nodes.filter(Boolean) };
}
