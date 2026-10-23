"use server";

import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { bool, faqItems, fail, formObject, int, isUniqueViolation, isUuid, optional, optionalMedia, required, richText, seoShape, slugField, zodErrors, type ActionState, type Result } from "@/lib/admin/form";
import { revalidateSite } from "@/lib/admin/revalidate";
import { recordSlugChange } from "@/lib/redirects";
import { buildSearchText } from "@/lib/catalog/search-text";

const schema = z.object({
  name: required("Kategori adı", 160),
  slug: slugField,
  parentId: z.string().refine((v) => v === "" || isUuid(v), "Geçersiz üst kategori.").transform((v) => v || null),
  description: optional(600),
  content: richText(),
  image: optionalMedia,
  imageAlt: optional(250),
  accent: z.enum(["coral", "sun", "leaf", "sky", "berry", "lilac"]),
  showInMenu: bool,
  sortOrder: int(-10_000, 10_000),
  status: z.enum(["active", "hidden"]),
  faq: faqItems,
  ...seoShape,
});

/** Döngü kontrolü: kategori kendi alt dalına taşınamaz. */
async function wouldCycle(id: string, parentId: string | null): Promise<boolean> {
  let cur = parentId;
  for (let i = 0; cur && i < 20; i++) {
    if (cur === id) return true;
    const [row] = await db.select({ parentId: categories.parentId }).from(categories).where(eq(categories.id, cur)).limit(1);
    cur = row?.parentId ?? null;
  }
  return false;
}

export async function saveCategoryAction(id: string | null, _prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = schema.safeParse({ ...formObject(fd), faq: fd.get("faq") ?? "[]" });
  if (!parsed.success) return zodErrors(parsed.error);
  const d = parsed.data;
  if (id && (await wouldCycle(id, d.parentId))) return fail("Kategori kendi alt kategorisinin altına taşınamaz.", { parentId: "Geçersiz üst kategori." });
  const existing = id ? (await db.select({ slug: categories.slug, name: categories.name }).from(categories).where(eq(categories.id, id)).limit(1))[0] : null;
  let newId = id;
  try {
    if (id) await db.update(categories).set(d).where(eq(categories.id, id));
    else newId = (await db.insert(categories).values(d).returning({ id: categories.id }))[0]!.id;
  } catch (e) {
    if (isUniqueViolation(e)) return fail("Bu URL başka bir kategoride kullanılıyor.", { slug: "Bu URL kullanımda." });
    throw e;
  }
  if (existing && existing.slug !== d.slug) await recordSlugChange(`/kategori/${existing.slug}`, `/kategori/${d.slug}`);
  // Kategori adı değiştiyse ürünlerin arama metni güncellenir.
  if (existing && existing.name !== d.name) {
    const rows = await db.select().from(products).where(eq(products.categoryId, id!));
    for (const p of rows) await db.update(products).set({ searchText: buildSearchText(p, d.name) }).where(eq(products.id, p.id));
  }
  revalidateSite();
  if (!id) redirect(`/admin/kategoriler/${newId}?kaydedildi=1`);
  return { status: "success", message: "Kategori kaydedildi." };
}

export async function deleteCategoryAction(id: string): Promise<Result> {
  await requireAdmin("admin");
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(products).where(eq(products.categoryId, id));
  if (n > 0) return { ok: false, error: `Bu kategoride ${n} ürün var. Önce ürünleri başka kategoriye taşıyın.` };
  await db.update(categories).set({ parentId: null }).where(eq(categories.parentId, id));
  await db.delete(categories).where(eq(categories.id, id));
  revalidateSite();
  return { ok: true };
}

export async function moveCategoryAction(id: string, direction: -1 | 1): Promise<Result> {
  await requireAdmin();
  await db
    .update(categories)
    .set({ sortOrder: sql`${categories.sortOrder} + ${direction * 15}` })
    .where(eq(categories.id, id));
  revalidateSite();
  return { ok: true };
}
