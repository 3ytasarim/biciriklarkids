"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { bool, faqItems, fail, formObject, int, isUniqueViolation, optional, required, richText, seoShape, slugField, zodErrors, type ActionState, type Result } from "@/lib/admin/form";
import { revalidateSite } from "@/lib/admin/revalidate";
import { recordSlugChange } from "@/lib/redirects";

/** Sistem rotalarıyla çakışan sayfa adresleri engellenir. */
const RESERVED = new Set(["urun", "urunler", "kategori", "kategoriler", "blog", "sepet", "odeme", "siparis", "siparis-takibi", "hesabim", "favoriler", "arama", "iletisim", "sss", "admin", "api", "og", "feeds", "uploads", "en-cok-satanlar", "yeni-urunler", "hediyelik", "indirimli-urunler"]);

const schema = z.object({
  title: required("Başlık", 200),
  slug: slugField.refine((s) => !RESERVED.has(s), "Bu adres sistem tarafından kullanılıyor."),
  kind: z.enum(["legal", "info"]),
  excerpt: optional(400),
  content: richText(),
  isActive: bool,
  showInFooter: bool,
  sortOrder: int(-1000, 1000),
  faq: faqItems,
  ...seoShape,
});

export async function savePageAction(id: string | null, _p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = schema.safeParse({ ...formObject(fd), faq: fd.get("faq") ?? "[]" });
  if (!parsed.success) return zodErrors(parsed.error);
  const d = parsed.data;
  const existing = id ? (await db.select({ slug: pages.slug }).from(pages).where(eq(pages.id, id)).limit(1))[0] : null;
  let newId = id;
  try {
    if (id) await db.update(pages).set(d).where(eq(pages.id, id));
    else newId = (await db.insert(pages).values(d).returning({ id: pages.id }))[0]!.id;
  } catch (e) {
    if (isUniqueViolation(e)) return fail("Bu adres başka bir sayfada kullanılıyor.", { slug: "Kullanımda." });
    throw e;
  }
  if (existing && existing.slug !== d.slug) await recordSlugChange(`/${existing.slug}`, `/${d.slug}`);
  revalidateSite();
  if (!id) redirect(`/admin/sayfalar/${newId}?kaydedildi=1`);
  return { status: "success", message: "Sayfa kaydedildi." };
}

export async function deletePageAction(id: string): Promise<Result> {
  await requireAdmin("admin");
  await db.delete(pages).where(eq(pages.id, id));
  revalidateSite();
  return { ok: true };
}
