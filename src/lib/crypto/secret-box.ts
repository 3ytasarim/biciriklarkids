import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Admin'den girilen gizli değerlerin (ör. iyzico gizli anahtarı) veritabanında şifreli saklanması.
 * AES-256-GCM; anahtar sunucu ortamından türetilir: SETTINGS_SECRET tanımlıysa o, değilse DATABASE_URL.
 * Böylece yalnızca veritabanı yedeği/dökümü ele geçse bile değer okunamaz.
 * Not: Anahtar kaynağı değişirse (ör. veritabanı parolası yenilenirse) kayıtlı değer çözülemez;
 * admin'den yeniden girilmesi yeterlidir.
 */
const VERSION = "v1";

function key(): Buffer {
  const source = process.env.SETTINGS_SECRET?.trim() || process.env.DATABASE_URL?.trim();
  if (!source) throw new Error("Şifreleme anahtarı için SETTINGS_SECRET veya DATABASE_URL gerekli.");
  return createHash("sha256").update(`bk-settings:${source}`).digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), enc.toString("base64url")].join(":");
}

/** Çözülemezse (anahtar değişmiş / bozuk veri) null döner. */
export function decryptSecret(box: string | null | undefined): string | null {
  if (!box) return null;
  try {
    const [v, iv, tag, data] = box.split(":");
    if (v !== VERSION || !iv || !tag || !data) return null;
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
