"use server";

import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { categories, productImages, products, productVariants } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import {
  bool,
  faqItems,
  fail,
  formObject,
  int,
  isUniqueViolation,
  isUuid,
  jsonArray,
  moneyField,
  optional,
  optionalInt,
  optionalMoney,
  required,
  richText,
  seoShape,
  slugField,
  zodErrors,
  type ActionState,
  type Result,
} from "@/lib/admin/form";
import { revalidateSite } from "@/lib/admin/revalidate";
import { recordSlugChange } from "@/lib/redirects";
import { buildSearchText } from "@/lib/catalog/search-text";
import { nextSku } from "@/lib/catalog/sku";
import { getMediaDimensions } from "@/lib/upload";

const localPath = z.string().trim().max(500).refine((v) => v.startsWith("/") && !v.startsWith("//"), "Geçersiz dosya yolu.");

const schema = z
  .object({
    name: required("Ürün adı", 200),
    slug: slugField,
    sku: optional(64),
    barcode: optional(32).refine((v) => !v || /^\d{8,14}$/.test(v), "Barkod (GTIN) 8–14 haneli rakam olmalı."),
    mpn: optional(64),
    brand: required("Marka", 120),
    categoryId: z.string().refine((v) => v === "" || isUuid(v), "Geçersiz kategori.").transform((v) => v || null),
    productType: optional(80),
    shortDescription: optional(400),
    description: richText(),
    price: moneyField("Fiyat"),
    compareAtPrice: optionalMoney,
    costPrice: optionalMoney,
    stock: int(0, 1_000_000),
    trackStock: bool,
    lowStockThreshold: int(0, 1000),
    status: z.enum(["draft", "active", "archived"]),
    featured: bool,
    bestseller: bool,
    newProduct: bool,
    giftProduct: bool,
    ageMin: optionalInt(99),
    ageMax: optionalInt(99),
    difficulty: z.enum(["", "easy", "medium", "hard"]).transform((v) => (v === "" ? null : v)),
    material: optional(2000),
    contents: optional(4000),
    usageInformation: optional(6000),
    safetyInformation: optional(4000),
    weightGrams: optionalInt(100_000),
    condition: z.enum(["new", "used", "refurbished"]),
    googleProductCategory: optional(255),
    sortOrder: int(-100_000, 100_000),
    images: jsonArray(z.object({ url: localPath, alt: z.string().trim().max(250), title: z.string().trim().max(250).optional() }), 30),
    variants: jsonArray(z.object({ name: z.string().trim().max(80), value: z.string().trim().max(120), sku: z.string().trim().max(64).optional(), priceAdjustment: z.string().optional(), stock: z.string().optional() }), 100),
    faq: faqItems,
    ...seoShape,
  })
  .superRefine((v, ctx) => {
    if (v.compareAtPrice != null && v.compareAtPrice <= v.price) ctx.addIssue({ code: "custom", path: ["compareAtPrice"], message: "Eski fiyat, satış fiyatından yüksek olmalı (yoksa boş bırakın)." });
    if (v.ageMin != null && v.ageMax != null && v.ageMin > v.ageMax) ctx.addIssue({ code: "custom", path: ["ageMax"], message: "Üst yaş, alt yaştan küçük olamaz." });
    if (v.status === "active" && !v.images.length) ctx.addIssue({ code: "custom", path: ["images"], message: "Yayındaki ürünün en az bir görseli olmalı." });
    if (v.images.some((i) => !i.alt)) ctx.addIssue({ code: "custom", path: ["images"], message: "Tüm görsellere alt metin girin (Google Görseller ve erişilebilirlik)." });
  });

export async function saveProductAction(id: string | null, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = schema.safeParse({ ...formObject(formData), images: formData.get("images") ?? "[]", variants: formData.get("variants") ?? "[]", faq: formData.get("faq") ?? "[]" });
  if (!parsed.success) return zodErrors(parsed.error);
  const { images, variants, faq, ...d } = parsed.data;

  const [cat] = d.categoryId ? await db.select({ name: categories.name }).from(categories).where(eq(categories.id, d.categoryId)).limit(1) : [];
  const dims = await getMediaDimensions(images.map((i) => i.url));
  const existing = id ? (await db.select({ slug: products.slug, status: products.status, publishedAt: products.publishedAt }).from(products).where(eq(products.id, id)).limit(1))[0] : null;
  if (id && !existing) return fail("Ürün bulunamadı.");

  // SKU boşsa kategori grubuna göre otomatik kod (BK-CNT-001 …)
  const sku = d.sku ?? (await nextSku(db, d.categoryId));

  const values = {
    ...d,
    sku,
    faq,
    searchText: buildSearchText(d, cat?.name),
    publishedAt: d.status === "active" ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null),
  };

  let productId = id;
  try {
    await db.transaction(async (tx) => {
      if (productId) {
        await tx.update(products).set(values).where(eq(products.id, productId));
      } else {
        const [row] = await tx.insert(products).values(values).returning({ id: products.id });
        productId = row!.id;
      }
      // Görseller ve varyantlar formdaki haliyle yeniden yazılır (sıra korunur, ilk görsel ana görsel).
      await tx.delete(productImages).where(eq(productImages.productId, productId!));
      if (images.length) {
        await tx.insert(productImages).values(
          images.map((img, i) => ({
            productId: productId!,
            imageUrl: img.url,
            alt: img.alt,
            title: img.title || null,
            width: dims.get(img.url)?.width ?? null,
            height: dims.get(img.url)?.height ?? null,
            sortOrder: i,
            isPrimary: i === 0,
          })),
        );
      }
      await tx.delete(productVariants).where(eq(productVariants.productId, productId!));
      const cleanVariants = variants.filter((v) => v.name && v.value);
      if (cleanVariants.length) {
        await tx.insert(productVariants).values(
          cleanVariants.map((v, i) => ({
            productId: productId!,
            name: v.name,
            value: v.value,
            sku: v.sku || null,
            priceAdjustment: Number((v.priceAdjustment || "0").replace(",", ".")) || 0,
            stock: Math.max(0, Math.floor(Number(v.stock || "0")) || 0),
            sortOrder: i,
          })),
        );
      }
    });
  } catch (e) {
    if (isUniqueViolation(e)) {
      const msg = String((e as { detail?: string; cause?: { detail?: string } }).cause?.detail ?? (e as { detail?: string }).detail ?? "");
      return fail("Bu değer başka bir üründe kullanılıyor.", msg.includes("sku") ? { sku: "Bu SKU başka bir üründe kullanılıyor." } : { slug: "Bu URL başka bir üründe kullanılıyor." });
    }
    console.error("[admin] ürün kaydedilemedi", e);
    return fail("Ürün kaydedilemedi. Lütfen tekrar deneyin.");
  }

  if (existing && existing.slug !== d.slug && existing.status === "active") await recordSlugChange(`/urun/${existing.slug}`, `/urun/${d.slug}`);
  revalidateSite();
  if (!id) redirect(`/admin/urunler/${productId}?kaydedildi=1`);
  return { status: "success", message: "Ürün kaydedildi." };
}

export async function duplicateProductAction(id: string): Promise<void> {
  await requireAdmin();
  const [p] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!p) redirect("/admin/urunler");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _omit, createdAt: _c, updatedAt: _u, ...rest } = p;
  let slug = `${p.slug}-kopya`;
  for (let i = 2; (await db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).limit(1)).length; i++) slug = `${p.slug}-kopya-${i}`;
  const [copy] = await db
    .insert(products)
    .values({ ...rest, name: `${p.name} (kopya)`, slug, sku: null, barcode: null, status: "draft", salesCount: 0, publishedAt: null })
    .returning({ id: products.id });
  const imgs = await db.select().from(productImages).where(eq(productImages.productId, id));
  if (imgs.length) await db.insert(productImages).values(imgs.map(({ id: _i, createdAt: _ca, ...img }) => // eslint-disable-line @typescript-eslint/no-unused-vars
 ({ ...img, productId: copy!.id })));
  const vars = await db.select().from(productVariants).where(eq(productVariants.productId, id));
  if (vars.length) await db.insert(productVariants).values(vars.map(({ id: _i, createdAt: _ca, ...v }) => // eslint-disable-line @typescript-eslint/no-unused-vars
 ({ ...v, sku: null, productId: copy!.id })));
  redirect(`/admin/urunler/${copy!.id}?kopya=1`);
}

export async function setProductStatusAction(id: string, status: "active" | "draft" | "archived"): Promise<Result> {
  await requireAdmin();
  if (status === "active") {
    const [img] = await db.select({ id: productImages.id }).from(productImages).where(eq(productImages.productId, id)).limit(1);
    if (!img) return { ok: false, error: "Görseli olmayan ürün yayına alınamaz." };
  }
  await db.update(products).set({ status }).where(eq(products.id, id));
  if (status === "active") await db.update(products).set({ publishedAt: new Date() }).where(and(eq(products.id, id), isNull(products.publishedAt)));
  revalidateSite();
  return { ok: true };
}

/** Siparişlerde geçen ürün silinmez → arşive alınır (sipariş geçmişi bozulmasın). */
export async function deleteProductAction(id: string): Promise<Result> {
  await requireAdmin("admin");
  try {
    await db.delete(products).where(eq(products.id, id));
  } catch {
    await db.update(products).set({ status: "archived" }).where(eq(products.id, id));
    revalidateSite();
    return { ok: false, error: "Ürün silinemedi; arşive alındı." };
  }
  revalidateSite();
  return { ok: true };
}
