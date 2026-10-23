import "./env";
import { rm } from "node:fs/promises";
import path from "node:path";
import { eq, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/lib/db/schema";

/** Tüm DEMO ürünlerini, görsellerini ve medya kayıtlarını siler. Gerçek ürünlere dokunmaz (isDemo=false). */
async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL, max: 1 });
  const db = drizzle(pool, { schema, casing: "snake_case" });
  const removed = await db.delete(schema.products).where(eq(schema.products.isDemo, true)).returning({ name: schema.products.name });
  await db.delete(schema.media).where(like(schema.media.url, "/uploads/demo/%"));
  const root = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "storage", "uploads"));
  await rm(path.join(root, "demo"), { recursive: true, force: true });
  console.log(`✓ ${removed.length} demo ürün silindi.`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
