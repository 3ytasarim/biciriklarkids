import "./env";
import { asc, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/lib/db/schema";
import { formatSku, SKU_PREFIX, skuGroupCode } from "../src/lib/catalog/sku";

/**
 * SKU'su olmayan tüm ürünlere kategori grubuna göre kod atar (BK-<GRUP>-<SIRA>).
 * Sıra: kategori içinde sort_order, sonra eklenme tarihi. Var olan SKU'lara dokunmaz; tekrar çalıştırmak güvenlidir.
 * Kullanım: npx tsx scripts/assign-skus.ts [--dry]
 */
async function main() {
const dry = process.argv.includes("--dry");
const pool = new Pool({ connectionString: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL, max: 1 });
const db = drizzle(pool, { schema, casing: "snake_case" });
const { products, categories } = schema;

const cats = await db.select({ id: categories.id, slug: categories.slug }).from(categories);
const slugOf = new Map(cats.map((c) => [c.id, c.slug]));
const all = await db.select({ id: products.id, sku: products.sku, categoryId: products.categoryId }).from(products);
const used = new Map<string, number>();
for (const p of all) {
  const m = p.sku?.match(new RegExp(`^${SKU_PREFIX}-([A-Z]{3})-(\d+)$`));
  if (m) used.set(m[1]!, Math.max(used.get(m[1]!) ?? 0, Number(m[2])));
}
const missing = await db
  .select({ id: products.id, name: products.name, categoryId: products.categoryId })
  .from(products)
  .where(isNull(products.sku))
  .orderBy(asc(products.categoryId), asc(products.sortOrder), asc(products.createdAt));
let n = 0;
for (const p of missing) {
  const group = skuGroupCode(p.categoryId ? slugOf.get(p.categoryId) : null);
  const next = (used.get(group) ?? 0) + 1;
  used.set(group, next);
  const sku = formatSku(group, next);
  console.log(sku, "←", p.name);
  if (!dry) await db.update(products).set({ sku }).where(eq(products.id, p.id));
  n++;
}
console.log(dry ? `(deneme) ${n} ürün` : `${n} ürüne SKU atandı`);
await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
