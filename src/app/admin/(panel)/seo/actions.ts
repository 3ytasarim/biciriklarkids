"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { redirects, seoSettings } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { bool, fail, formObject, isUniqueViolation, optional, optionalMedia, optionalUrl, zodErrors, type ActionState, type Result } from "@/lib/admin/form";
import { revalidateSite } from "@/lib/admin/revalidate";
import { invalidateRedirectCache, normalizePath } from "@/lib/redirects";
import { isStaticPageKey } from "@/lib/seo/static-pages";

const pageSchema = z.object({
  title: optional(160),
  description: optional(320),
  keywords: optional(300),
  canonicalUrl: optionalUrl,
  ogTitle: optional(160),
  ogDescription: optional(320),
  ogImage: optionalMedia,
  robotsIndex: bool,
  robotsFollow: bool,
});

export async function saveSeoPageAction(key: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  if (!isStaticPageKey(key)) return fail("Geçersiz sayfa.");
  const parsed = pageSchema.safeParse(formObject(fd));
  if (!parsed.success) return zodErrors(parsed.error);
  await db.insert(seoSettings).values({ key, ...parsed.data }).onConflictDoUpdate({ target: seoSettings.key, set: { ...parsed.data, updatedAt: new Date() } });
  revalidateSite();
  return { status: "success", message: "SEO ayarları kaydedildi." };
}

const path = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} zorunlu.`)
    .max(500)
    .refine((v) => v.startsWith("/") && !v.startsWith("//"), "Site içi yol olmalı (/ ile başlar).");

const redirectSchema = z.object({
  sourcePath: path("Eski adres"),
  destinationPath: path("Yeni adres"),
  statusCode: z.enum(["301", "302"]).transform(Number),
  note: optional(250),
});

export async function saveRedirectAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = redirectSchema.safeParse(formObject(fd));
  if (!parsed.success) return zodErrors(parsed.error);
  const source = normalizePath(parsed.data.sourcePath);
  if (source === normalizePath(parsed.data.destinationPath)) return fail("Eski ve yeni adres aynı olamaz.", { destinationPath: "Döngü." });
  try {
    await db.insert(redirects).values({ ...parsed.data, sourcePath: source });
  } catch (e) {
    if (isUniqueViolation(e)) return fail("Bu eski adres için zaten bir yönlendirme var.", { sourcePath: "Kayıtlı." });
    throw e;
  }
  invalidateRedirectCache();
  revalidatePath("/admin/seo");
  return { status: "success", message: "Yönlendirme eklendi." };
}

export async function deleteRedirectAction(id: string): Promise<Result> {
  await requireAdmin();
  await db.delete(redirects).where(eq(redirects.id, id));
  invalidateRedirectCache();
  revalidatePath("/admin/seo");
  return { ok: true };
}
