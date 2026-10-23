import "server-only";
import { z } from "zod";
import { SLUG_PATTERN, slugify } from "@/lib/slug";
import { sanitizeRichText } from "@/lib/sanitize";

/** Tüm admin form action'larının ortak dönüş tipi (useActionState). */
export type ActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  errors?: Record<string, string>;
};

export type Result = { ok: true } | { ok: false; error: string };

export function fail(message: string, errors?: Record<string, string>): ActionState {
  return { status: "error", message, errors };
}
export function ok(message: string): ActionState {
  return { status: "success", message };
}

export function zodErrors(error: z.ZodError): ActionState {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return fail("Lütfen işaretli alanları düzeltin.", errors);
}

// ── FormData → alan dönüştürücüleri ──

export const text = (max = 250) => z.string().trim().max(max, `En fazla ${max} karakter.`);
export const required = (label: string, max = 250) => text(max).min(1, `${label} zorunlu.`);
export const optional = (max = 250) => text(max).transform((v) => (v === "" ? null : v));

/** Checkbox: işaretliyse "on" gelir; işaretsizse alan formda HİÇ yoktur. */
export const bool = z
  .union([z.literal("on"), z.literal("true"), z.literal("")])
  .optional()
  .transform((v) => v === "on" || v === "true");

export const int = (min = 0, max = 1_000_000) =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(z.number({ error: "Sayı girin." }).int("Tam sayı girin.").min(min, `En az ${min}.`).max(max));

export const optionalInt = (max = 1_000_000) =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .pipe(z.number({ error: "Sayı girin." }).int("Tam sayı girin.").min(0).max(max).nullable());

/** Para alanı: "1.250,50" / "1250.50" / "1250" → 1250.5 */
export const moneyField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} zorunlu.`)
    .transform((v) => Number(v.replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".")))
    .pipe(z.number({ error: "Geçerli bir tutar girin." }).min(0, "Negatif olamaz.").max(10_000_000));

export const optionalMoney = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : Number(v.replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."))))
  .pipe(z.number({ error: "Geçerli bir tutar girin." }).min(0).max(10_000_000).nullable());

/** Site içi yol (/...) veya http(s) URL. javascript: vb. şemalar reddedilir. */
export const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || (v.startsWith("/") && !v.startsWith("//")) || /^https?:\/\//i.test(v), "Site içi yol (/...) veya http(s):// adres girin.")
  .transform((v) => (v === "" ? null : v));

/** Yüklenen görsel/video yolu (/uploads/...), public yolu veya https URL. */
export const optionalMedia = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || (v.startsWith("/") && !v.startsWith("//")) || /^https:\/\//i.test(v), "Geçersiz dosya yolu.")
  .transform((v) => (v === "" ? null : v));

export const slugField = z
  .string()
  .trim()
  .transform((v) => slugify(v))
  .pipe(z.string().min(1, "Slug zorunlu.").regex(SLUG_PATTERN, "Yalnızca küçük harf, rakam ve tire."));

export const richText = (max = 200_000) =>
  z
    .string()
    .max(max)
    .transform((v) => sanitizeRichText(v));

export function jsonArray<T extends z.ZodTypeAny>(item: T, max = 200) {
  return z
    .string()
    .transform((v, ctx) => {
      if (!v) return [];
      try {
        return JSON.parse(v) as unknown;
      } catch {
        ctx.addIssue({ code: "custom", message: "Geçersiz liste verisi." });
        return z.NEVER;
      }
    })
    .pipe(z.array(item).max(max));
}

export const faqItems = jsonArray(z.object({ question: z.string().trim().max(300), answer: z.string().trim().max(4000) }), 40).transform((list) =>
  list.filter((f) => f.question && f.answer).map((f) => ({ question: f.question, answer: sanitizeRichText(f.answer) || f.answer.replace(/[<>]/g, "") })),
);

/** Formdaki tüm alanları düz obje olarak (string) alır. */
export function formObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string" && !(k in out)) out[k] = v;
  return out;
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

/** SEO alanları (ürün, kategori, blog, sayfa için ortak). */
export const seoShape = {
  seoTitle: optional(160),
  seoDescription: optional(320),
  seoKeywords: optional(300),
  canonicalUrl: optionalUrl,
  ogTitle: optional(160),
  ogDescription: optional(320),
  ogImage: optionalMedia,
  noIndex: bool,
};

/** PostgreSQL unique ihlali (23505). */
export function isUniqueViolation(e: unknown): boolean {
  const err = e as { code?: string; cause?: { code?: string } } | null;
  return err?.code === "23505" || err?.cause?.code === "23505";
}
