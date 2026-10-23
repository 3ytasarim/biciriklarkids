import "./env";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { hash } from "@node-rs/argon2";
import * as schema from "../src/lib/db/schema";

/**
 * İlk yöneticiyi oluşturur (veya şifresini sıfırlar).
 *   npm run admin:create -- ornek@biciriklar.com.tr "Ad Soyad"
 * Şifre kodda yazılı DEĞİLDİR: rastgele güçlü şifre üretilir ve yalnızca bir kez ekrana basılır.
 * İlk girişte Admin › Hesap & yöneticiler bölümünden değiştirin.
 */
async function main() {
  const [email, name = "Yönetici"] = process.argv.slice(2);
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error('Kullanım: npm run admin:create -- e-posta@alan.com "Ad Soyad"');
    process.exit(1);
  }
  const password = randomBytes(12).toString("base64url");
  const passwordHash = await hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL, max: 1 });
  const db = drizzle(pool, { schema, casing: "snake_case" });
  const normalized = email.toLowerCase();
  const [existing] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.email, normalized)).limit(1);
  if (existing) {
    await db.update(schema.adminUsers).set({ passwordHash, isActive: true }).where(eq(schema.adminUsers.id, existing.id));
    await db.delete(schema.adminSessions).where(eq(schema.adminSessions.adminUserId, existing.id));
    console.log(`✓ ${normalized} şifresi sıfırlandı.`);
  } else {
    await db.insert(schema.adminUsers).values({ email: normalized, name, role: "owner", passwordHash });
    console.log(`✓ Sahip (owner) yöneticisi oluşturuldu: ${normalized}`);
  }
  console.log(`  Geçici şifre: ${password}`);
  console.log("  Giriş: /admin/giris — ilk girişte şifreyi değiştirin.");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
