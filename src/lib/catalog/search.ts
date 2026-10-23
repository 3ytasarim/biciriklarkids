import "server-only";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { normalizeSearch } from "@/lib/utils";
import { getProductCards } from "./queries";
import type { ProductCardData } from "./types";
export { buildSearchText } from "./search-text";

export function searchTokens(q: string): string[] {
  return normalizeSearch(q)
    .split(" ")
    .filter((t) => t.length >= 2)
    .slice(0, 6);
}

/** Tüm kelimeler eşleşmeli (AND); ad başında eşleşenler ve çok satanlar önce. */
export async function searchProducts(q: string, limit = 8): Promise<ProductCardData[]> {
  const tokens = searchTokens(q);
  if (!tokens.length) return [];
  const rows = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.status, "active"), ...tokens.map((t) => ilike(products.searchText, `%${t.replace(/[%_]/g, "")}%`))))
    .orderBy(desc(sql`(${products.searchText} like ${tokens[0] + "%"})`), desc(products.salesCount), asc(products.name))
    .limit(limit);
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const cards = await getProductCards({ ids }, "onerilen", ids.length);
  const order = new Map(ids.map((id, i) => [id, i]));
  return cards.sort((a, b) => order.get(a.id)! - order.get(b.id)!);
}

export async function searchCategories(q: string, limit = 4) {
  const tokens = searchTokens(q);
  if (!tokens.length) return [];
  const rows = await db
    .select({ name: categories.name, slug: categories.slug })
    .from(categories)
    .where(and(eq(categories.status, "active"), or(...tokens.map((t) => ilike(categories.name, `%${t}%`)), ilike(categories.slug, `%${tokens.join("-")}%`))))
    .orderBy(asc(categories.sortOrder))
    .limit(limit * 3);
  // Kategori adları Türkçe karakter içerir; normalize ederek ikinci kez süz.
  return rows.filter((c) => tokens.every((t) => normalizeSearch(c.name).includes(t))).slice(0, limit);
}
