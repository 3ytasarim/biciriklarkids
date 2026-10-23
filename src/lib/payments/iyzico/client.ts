import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * iyzico REST istemcisi (resmî SDK'ya bağımlılık yok; yalnızca kullandığımız iki uç nokta).
 * Kimlik doğrulama: IYZWSv2 — HMAC-SHA256(randomKey + uriPath + body, secretKey) → hex;
 * Authorization: "IYZWSv2 " + base64("apiKey:..&randomKey:..&signature:..").
 * Kaynak: docs.iyzico.com › Authentication › HMACSHA256; iyzipay-node lib/utils.js.
 *
 * ENV:
 *  IYZICO_API_KEY, IYZICO_SECRET_KEY  — iyzico panelinden (sandbox veya canlı)
 *  IYZICO_BASE_URL                    — https://sandbox-api.iyzipay.com (test) | https://api.iyzipay.com (canlı)
 *  IYZICO_INSTALLMENTS                — isteğe bağlı, ör. "1,2,3,6,9" (varsayılan tek çekim + 2,3,6,9)
 */
export type IyzicoConfig = { apiKey: string; secretKey: string; baseUrl: string };

export function iyzicoConfig(): IyzicoConfig | null {
  const apiKey = process.env.IYZICO_API_KEY?.trim();
  const secretKey = process.env.IYZICO_SECRET_KEY?.trim();
  const baseUrl = process.env.IYZICO_BASE_URL?.trim().replace(/\/+$/, "");
  if (!apiKey || !secretKey || !baseUrl) return null;
  if (!/^https:\/\/(sandbox-)?api\.iyzipay\.com$/.test(baseUrl)) return null; // yanlış/şüpheli adres → kapalı
  return { apiKey, secretKey, baseUrl };
}

export const isIyzicoSandbox = () => Boolean(process.env.IYZICO_BASE_URL?.includes("sandbox"));

export function installmentOptions(): number[] {
  const raw = process.env.IYZICO_INSTALLMENTS?.split(",").map((x) => Number(x.trim())).filter((n) => [1, 2, 3, 6, 9, 12].includes(n));
  return raw?.length ? [...new Set(raw)] : [1, 2, 3, 6, 9];
}

/** iyzico fiyat biçimi (SDK formatPrice ile aynı): 200 → "200.0", 199.9 → "199.9", 12.345 → "12.35". */
export function iyziPrice(n: number): string {
  const s = parseFloat(n.toFixed(2)).toString();
  return s.includes(".") ? s : `${s}.0`;
}

function authHeaders(cfg: IyzicoConfig, path: string, body: string) {
  const rnd = `${Date.now()}${randomBytes(6).toString("hex")}`;
  const signature = createHmac("sha256", cfg.secretKey).update(rnd + path + body).digest("hex");
  const auth = Buffer.from(`apiKey:${cfg.apiKey}&randomKey:${rnd}&signature:${signature}`, "utf8").toString("base64");
  return { Authorization: `IYZWSv2 ${auth}`, "x-iyzi-rnd": rnd, "Content-Type": "application/json", Accept: "application/json" };
}

export type IyziResponse = { status: "success" | "failure"; errorCode?: string; errorMessage?: string; errorGroup?: string; locale?: string; systemTime?: number; conversationId?: string } & Record<string, unknown>;

async function post<T extends IyziResponse>(cfg: IyzicoConfig, path: string, payload: object): Promise<T> {
  const body = JSON.stringify(payload);
  const res = await fetch(cfg.baseUrl + path, { method: "POST", headers: authHeaders(cfg, path, body), body, cache: "no-store", signal: AbortSignal.timeout(20_000) });
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return { status: "failure", errorMessage: `iyzico yanıtı okunamadı (HTTP ${res.status})` } as T;
  }
}

/** Yanıt bütünlük imzası: HMAC-SHA256(alanlar.join(":"), secretKey) hex. */
export function verifyResponseSignature(cfg: IyzicoConfig, fields: unknown[], signature: unknown): boolean | null {
  if (typeof signature !== "string" || !signature) return null; // imza dönmemiş
  const expected = createHmac("sha256", cfg.secretKey).update(fields.map((f) => (f == null ? "" : String(f))).join(":")).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

// ─── Checkout Form ───

export type CfInitResponse = IyziResponse & { token?: string; paymentPageUrl?: string; checkoutFormContent?: string; tokenExpireTime?: number; signature?: string };
export type CfRetrieveResponse = IyziResponse & {
  token?: string;
  paymentStatus?: "SUCCESS" | "FAILURE" | "INIT_THREEDS" | "CALLBACK_THREEDS" | "BKM_POS_SELECTED" | "CALLBACK_PECCO";
  fraudStatus?: number;
  paymentId?: string;
  price?: number;
  paidPrice?: number;
  currency?: string;
  basketId?: string;
  installment?: number;
  cardAssociation?: string;
  lastFourDigits?: string;
  signature?: string;
};

export const initializeCheckoutForm = (cfg: IyzicoConfig, payload: object) => post<CfInitResponse>(cfg, "/payment/iyzipos/checkoutform/initialize/auth/ecom", payload);
export const retrieveCheckoutForm = (cfg: IyzicoConfig, token: string, conversationId: string) =>
  post<CfRetrieveResponse>(cfg, "/payment/iyzipos/checkoutform/auth/ecom/detail", { locale: "tr", conversationId, token });
