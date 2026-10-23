import "./env";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

/** drizzle/ klasöründeki sürümlü migration'ları uygular (doğrudan host — pooler değil). */
async function main() {
  const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL_DIRECT / DATABASE_URL tanımlı değil.");
  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    await migrate(drizzle(pool, { casing: "snake_case" }), { migrationsFolder: "./drizzle" });
    console.log("✓ Migration'lar uygulandı.");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
