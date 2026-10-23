import "server-only";
import { headers } from "next/headers";
import { createHash } from "node:crypto";

/** İstemci IP'si (nginx X-Forwarded-For / X-Real-IP arkasında). Ham hali saklanmaz. */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "unknown";
}

/** IP'nin tuzlu SHA-256 özeti — rate limit ve spam takibi için yeterli, kişisel veri olarak IP tutulmaz. */
export async function getIpHash(): Promise<string> {
  const ip = await getClientIp();
  const salt = process.env.IP_HASH_SALT ?? "biciriklar";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}
