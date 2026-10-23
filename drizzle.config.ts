import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Migration doğrudan host üzerinden (Neon pooler'da çok komutlu transaction güvenilir değil).
  dbCredentials: { url: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL! },
  strict: true,
  casing: "snake_case",
  verbose: true,
});
