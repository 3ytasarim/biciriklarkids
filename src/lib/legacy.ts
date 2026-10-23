import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { slugify } from "@/lib/slug";

/**
 * Eski Wix URL'leri: /product-page/<türkçe-slug> ve /category/<türkçe-slug>.
 * Yeni slug, eski slug'ın Türkçe karakterleri sadeleştirilmiş hali olarak tahmin edilir; kayıt varsa 301,
 * yoksa (ürün henüz eklenmemiş olabilir) ilgili kelimelerle aramaya geçici 302.
 */
export async function findLegacyProductTarget(pathname: string): Promise<{ path: string; status: 301 | 302 } | null> {
  let raw = pathname;
  try {
    raw = decodeURIComponent(pathname);
  } catch {
    /* noop */
  }
  const [, kind, rest] = raw.split("/");
  if (!rest) return null;
  const slug = slugify(rest.normalize("NFC"));
  if (!slug) return null;

  if (kind === "product-page") {
    const [p] = await db.select({ slug: products.slug }).from(products).where(and(eq(products.slug, slug), eq(products.status, "active"))).limit(1);
    if (p) return { path: `/urun/${p.slug}`, status: 301 };
    return { path: `/arama?q=${encodeURIComponent(slug.replace(/-/g, " "))}`, status: 302 };
  }
  if (kind === "category") {
    const [c] = await db.select({ slug: categories.slug }).from(categories).where(and(eq(categories.slug, slug), eq(categories.status, "active"))).limit(1);
    return c ? { path: `/kategori/${c.slug}`, status: 301 } : { path: "/urunler", status: 302 };
  }
  return null;
}
