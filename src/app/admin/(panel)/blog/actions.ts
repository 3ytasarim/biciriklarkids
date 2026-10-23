"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { blogCategories, blogPosts } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { fail, formObject, int, isUniqueViolation, isUuid, optional, optionalMedia, required, richText, seoShape, slugField, zodErrors, type ActionState, type Result } from "@/lib/admin/form";
import { revalidateSite } from "@/lib/admin/revalidate";
import { recordSlugChange } from "@/lib/redirects";
import { htmlToText } from "@/lib/sanitize";
import { slugify } from "@/lib/slug";

const postSchema = z.object({
  title: required("Başlık", 200),
  slug: slugField,
  excerpt: optional(500),
  content: richText(),
  coverImage: optionalMedia,
  coverImageAlt: optional(250),
  tags: z
    .string()
    .max(600)
    .transform((v) =>
      [...new Set(v.split(",").map((t) => t.trim().slice(0, 40)).filter(Boolean))].slice(0, 15),
    ),
  categoryId: z.string().refine((v) => v === "" || isUuid(v)).transform((v) => v || null),
  authorName: optional(120),
  authorBio: optional(400),
  status: z.enum(["draft", "published"]),
  publishedAt: z
    .string()
    .trim()
    .transform((v) => (v ? new Date(v) : null))
    .refine((d) => d === null || !Number.isNaN(d.getTime()), "Geçersiz tarih."),
  ...seoShape,
});

export async function savePostAction(id: string | null, _p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = postSchema.safeParse(formObject(fd));
  if (!parsed.success) return zodErrors(parsed.error);
  const d = parsed.data;
  const words = htmlToText(d.content).split(/\s+/).filter(Boolean).length;
  const values = { ...d, readingMinutes: Math.max(1, Math.round(words / 200)), publishedAt: d.status === "published" ? (d.publishedAt ?? new Date()) : d.publishedAt };
  const existing = id ? (await db.select({ slug: blogPosts.slug, status: blogPosts.status }).from(blogPosts).where(eq(blogPosts.id, id)).limit(1))[0] : null;
  let newId = id;
  try {
    if (id) await db.update(blogPosts).set(values).where(eq(blogPosts.id, id));
    else newId = (await db.insert(blogPosts).values(values).returning({ id: blogPosts.id }))[0]!.id;
  } catch (e) {
    if (isUniqueViolation(e)) return fail("Bu URL başka bir yazıda kullanılıyor.", { slug: "Kullanımda." });
    throw e;
  }
  if (existing && existing.status === "published" && existing.slug !== d.slug) await recordSlugChange(`/blog/${existing.slug}`, `/blog/${d.slug}`);
  revalidateSite();
  if (!id) redirect(`/admin/blog/${newId}?kaydedildi=1`);
  return { status: "success", message: "Yazı kaydedildi." };
}

export async function deletePostAction(id: string): Promise<Result> {
  await requireAdmin("admin");
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
  revalidateSite();
  return { ok: true };
}

const catSchema = z.object({ name: required("Ad", 120), description: optional(500), sortOrder: int(-1000, 1000) });

export async function saveBlogCategoryAction(id: string | null, _p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = catSchema.safeParse(formObject(fd));
  if (!parsed.success) return zodErrors(parsed.error);
  const slug = slugify(String(fd.get("slug") || parsed.data.name));
  try {
    if (id) await db.update(blogCategories).set({ ...parsed.data, slug }).where(eq(blogCategories.id, id));
    else await db.insert(blogCategories).values({ ...parsed.data, slug });
  } catch (e) {
    if (isUniqueViolation(e)) return fail("Bu kategori zaten var.");
    throw e;
  }
  revalidateSite();
  return { status: "success", message: "Kategori kaydedildi." };
}

export async function deleteBlogCategoryAction(id: string): Promise<Result> {
  await requireAdmin("admin");
  await db.update(blogPosts).set({ categoryId: null }).where(eq(blogPosts.categoryId, id));
  await db.delete(blogCategories).where(eq(blogCategories.id, id));
  revalidateSite();
  return { ok: true };
}
