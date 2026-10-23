import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Tek bağlantı havuzu (dev'de HMR sırasında yeniden oluşmasın diye globalThis'te saklanır).
 * Neon pooled endpoint kullanılır; DATABASE_URL yalnızca ortam değişkeninden gelir (kodda credential yok).
 */
type Db = NodePgDatabase<typeof schema>;
const globalForDb = globalThis as unknown as { __bkPool?: Pool; __bkDb?: Db };

function createDb(): Db {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL tanımlı değil (.env.local).");
  const pool = globalForDb.__bkPool ?? new Pool({ connectionString, max: 10, idleTimeoutMillis: 30_000 });
  globalForDb.__bkPool = pool;
  return drizzle(pool, { schema, casing: "snake_case" });
}

export const db: Db = globalForDb.__bkDb ?? (globalForDb.__bkDb = createDb());
export { schema };
