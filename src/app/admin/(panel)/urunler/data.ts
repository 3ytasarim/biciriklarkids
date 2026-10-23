import "server-only";
import { asc, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";

/** Kategori seçenekleri (alt kategoriler girintili). */
export async function categoryOptions(): Promise<{ value: string; label: string }[]> {
  const rows = await db.select({ id: categories.id, name: categories.name, parentId: categories.parentId }).from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
  const out: { value: string; label: string }[] = [];
  const walk = (parent: string | null, depth: number) => {
    for (const r of rows.filter((x) => x.parentId === parent)) {
      out.push({ value: r.id, label: `${"— ".repeat(depth)}${r.name}` });
      if (depth < 5) walk(r.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

export async function productTypeSuggestions(): Promise<string[]> {
  const rows = await db.selectDistinct({ t: products.productType }).from(products).where(isNotNull(products.productType)).orderBy(sql`1`);
  return rows.map((r) => r.t!).filter(Boolean);
}
