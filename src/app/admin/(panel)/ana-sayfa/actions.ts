"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { banners, homepageSectionProducts, homepageSections } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { bool, formObject, int, isUuid, optional, optionalMedia, optionalUrl, required, zodErrors, type ActionState, type Result } from "@/lib/admin/form";
import { revalidateSite } from "@/lib/admin/revalidate";

const heroSchema = z.object({
  eyebrow: optional(80),
  title: required("Başlık", 160),
  subtitle: optional(400),
  ctaLabel: optional(60),
  ctaUrl: optionalUrl,
  secondaryCtaLabel: optional(60),
  secondaryCtaUrl: optionalUrl,
  imageUrl: optionalMedia,
  imageAlt: optional(250),
  mobileImageUrl: optionalMedia,
  isActive: bool,
});

/** Hero içeriği (banners tablosunda placement=hero, ilk kayıt). Pasifse sitede varsayılan hero metni görünür. */
export async function saveHeroAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = heroSchema.safeParse(formObject(fd));
  if (!parsed.success) return zodErrors(parsed.error);
  const [existing] = await db.select({ id: banners.id }).from(banners).where(eq(banners.placement, "hero")).orderBy(banners.sortOrder).limit(1);
  if (existing) await db.update(banners).set(parsed.data).where(eq(banners.id, existing.id));
  else await db.insert(banners).values({ ...parsed.data, placement: "hero" });
  revalidateSite();
  return { status: "success", message: "Hero kaydedildi." };
}

const sectionSchema = z.object({
  eyebrow: optional(80),
  title: optional(160),
  subtitle: optional(600),
  isActive: bool,
  source: z.enum(["", "bestseller", "new", "gift", "featured", "discounted", "manual", "category"]).optional(),
  categoryId: z.string().optional(),
  limit: int(1, 24).optional(),
  ctaLabel: optional(60).optional(),
  ctaUrl: optionalUrl.optional(),
});

export async function saveSectionAction(id: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  if (!isUuid(id)) return { status: "error", message: "Geçersiz bölüm." };
  const parsed = sectionSchema.safeParse(formObject(fd));
  if (!parsed.success) return zodErrors(parsed.error);
  const [s] = await db.select().from(homepageSections).where(eq(homepageSections.id, id)).limit(1);
  if (!s) return { status: "error", message: "Bölüm bulunamadı." };
  const d = parsed.data;
  const config = { ...s.config };
  if (s.type === "product_grid") {
    if (d.source) config.source = d.source;
    config.categoryId = d.categoryId && isUuid(d.categoryId) ? d.categoryId : null;
  }
  if (d.limit) config.limit = d.limit;
  if (d.ctaLabel !== undefined) config.ctaLabel = d.ctaLabel;
  if (d.ctaUrl !== undefined) config.ctaUrl = d.ctaUrl;
  await db.update(homepageSections).set({ eyebrow: d.eyebrow, title: d.title, subtitle: d.subtitle, isActive: d.isActive, config }).where(eq(homepageSections.id, id));

  if (s.type === "product_grid") {
    const picks = fd.getAll("productIds").map(String).filter(isUuid).slice(0, 24);
    await db.delete(homepageSectionProducts).where(eq(homepageSectionProducts.sectionId, id));
    if (picks.length) await db.insert(homepageSectionProducts).values(picks.map((productId, i) => ({ sectionId: id, productId, sortOrder: i })));
  }
  revalidateSite();
  revalidatePath("/admin/ana-sayfa");
  return { status: "success", message: "Bölüm kaydedildi." };
}

export async function moveSectionAction(id: string, direction: -1 | 1): Promise<Result> {
  await requireAdmin();
  const all = await db.select({ id: homepageSections.id, sortOrder: homepageSections.sortOrder }).from(homepageSections).orderBy(homepageSections.sortOrder);
  const i = all.findIndex((s) => s.id === id);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= all.length) return { ok: true };
  // Sıra değerlerini normalize edip yer değiştir.
  const order = all.map((s) => s.id);
  [order[i], order[j]] = [order[j]!, order[i]!];
  await db.transaction(async (tx) => {
    for (const [n, sid] of order.entries()) await tx.update(homepageSections).set({ sortOrder: n * 10 }).where(eq(homepageSections.id, sid));
  });
  revalidateSite();
  revalidatePath("/admin/ana-sayfa");
  return { ok: true };
}

