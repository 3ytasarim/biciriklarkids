import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Ziyaretçi anahtarı (sepet + favoriler). httpOnly çerezde rastgele token; DB'de yalnızca SHA-256 özeti
 * tutulur → DB sızsa bile çerez taklit edilemez. 90 gün.
 */
export const VISITOR_COOKIE = "bk_vid";
const MAX_AGE = 60 * 60 * 24 * 90;

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Mevcut ziyaretçi token özetini döner; yoksa null (okuma işlemleri çerez OLUŞTURMAZ). */
export async function readVisitorHash(): Promise<string | null> {
  const token = (await cookies()).get(VISITOR_COOKIE)?.value;
  return token && /^[a-f0-9]{64}$/.test(token) ? hashToken(token) : null;
}

/** Yazma işlemlerinde: token yoksa oluşturur. Yalnızca Route Handler / Server Action içinde çağrılabilir. */
export async function ensureVisitorHash(): Promise<string> {
  const store = await cookies();
  let token = store.get(VISITOR_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    token = randomBytes(32).toString("hex");
    store.set(VISITOR_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: MAX_AGE });
  }
  return hashToken(token);
}
