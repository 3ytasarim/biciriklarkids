"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, ChevronDown } from "lucide-react";
import { AdminForm, SaveBar } from "@/components/admin/AdminForm";
import { Checkbox, Section, SelectInput, TextArea, TextInput } from "@/components/admin/fields";
import { ImagePicker } from "@/components/admin/ImagePicker";
import type { banners, homepageSections } from "@/lib/db/schema";
import { moveSectionAction, saveHeroAction, saveSectionAction } from "./actions";

type Banner = typeof banners.$inferSelect;
type HSection = typeof homepageSections.$inferSelect & { productIds: string[] };

export function HeroForm({ hero }: { hero: Banner | null }) {
  return (
    <AdminForm action={saveHeroAction} className="space-y-6">
      <Section title="Hero (ana giriş)" description="Pasif veya boşsa sitede varsayılan metin ve marka illüstrasyonu gösterilir. Gerçek ürün/lifestyle fotoğrafı yüklediğinizde LCP görseli olur.">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-5">
            <TextInput name="eyebrow" label="Üst etiket" defaultValue={hero?.eyebrow ?? ""} placeholder="Çocuklar için keçe dikiş ve DIY kitleri" />
            <TextInput name="title" label="Başlık (H1)" required defaultValue={hero?.title ?? "Minik eller için büyük hayaller."} />
            <TextArea name="subtitle" label="Alt metin" rows={3} defaultValue={hero?.subtitle ?? ""} />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextInput name="ctaLabel" label="Ana buton metni" defaultValue={hero?.ctaLabel ?? "Ürünleri Keşfet"} />
              <TextInput name="ctaUrl" label="Ana buton bağlantısı" defaultValue={hero?.ctaUrl ?? "/urunler"} />
              <TextInput name="secondaryCtaLabel" label="İkinci buton metni" defaultValue={hero?.secondaryCtaLabel ?? "Hediyelik Setler"} />
              <TextInput name="secondaryCtaUrl" label="İkinci buton bağlantısı" defaultValue={hero?.secondaryCtaUrl ?? "/hediyelik"} />
            </div>
            <Checkbox name="isActive" label="Bu içeriği kullan" defaultChecked={hero?.isActive ?? false} />
          </div>
          <div className="space-y-5">
            <ImagePicker name="imageUrl" label="Hero görseli" defaultValue={hero?.imageUrl} altName="imageAlt" altDefault={hero?.imageAlt} aspect="aspect-[4/5]" hint="Dikey 4:5, en az 1200×1500 px önerilir." />
            <ImagePicker name="mobileImageUrl" label="Mobil görsel (isteğe bağlı)" defaultValue={hero?.mobileImageUrl} aspect="aspect-[4/5]" />
          </div>
        </div>
      </Section>
      <SaveBar label="Hero'yu kaydet" />
    </AdminForm>
  );
}

const TYPE_LABEL: Record<string, string> = {
  hero: "Hero",
  usp_strip: "Avantaj şeridi",
  category_discovery: "Kategori keşfi",
  product_grid: "Ürün bölümü",
  video: "Video alanı",
  editorial: "Editoryal (Minik Eller…)",
  why_us: "Neden Bıcırıklar Kids?",
  reviews: "Müşteri yorumları",
  blog: "Blog / İlham",
  newsletter: "Bülten",
  seo_content: "SEO / GEO içerik",
};

export function SectionRow({ section: s, index, total, categories, products }: { section: HSection; index: number; total: number; categories: { value: string; label: string }[]; products: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const move = (d: -1 | 1) =>
    start(async () => {
      await moveSectionAction(s.id, d);
      router.refresh();
    });
  return (
    <li className={`rounded-lg border bg-white ${s.isActive ? "border-neutral-200" : "border-dashed border-neutral-300 opacity-75"}`}>
      <div className="flex items-center gap-3 p-3">
        <div className="flex flex-col">
          <button type="button" onClick={() => move(-1)} disabled={pending || index === 0} aria-label="Yukarı taşı" className="flex h-7 w-8 items-center justify-center rounded-xs hover:bg-neutral-100 disabled:opacity-30">
            <ArrowUp className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => move(1)} disabled={pending || index === total - 1} aria-label="Aşağı taşı" className="flex h-7 w-8 items-center justify-center rounded-xs hover:bg-neutral-100 disabled:opacity-30">
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex flex-1 items-center justify-between gap-3 text-left">
          <span>
            <span className="block text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              {TYPE_LABEL[s.type] ?? s.type}
              {s.config.slot ? ` · ${s.config.slot}` : ""}
              {!s.isActive ? " · pasif" : ""}
            </span>
            <span className="font-semibold">{s.title || TYPE_LABEL[s.type]}</span>
          </span>
          <ChevronDown aria-hidden="true" className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open ? (
        <div className="border-t border-neutral-200 p-4">
          <AdminForm action={saveSectionAction.bind(null, s.id)} className="space-y-4">
            {s.type !== "hero" && s.type !== "usp_strip" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput name="eyebrow" label="Üst etiket" defaultValue={s.eyebrow ?? ""} />
                <TextInput name="title" label="Başlık" defaultValue={s.title ?? ""} />
                <div className="sm:col-span-2">
                  <TextArea name="subtitle" label="Alt metin" rows={2} defaultValue={s.subtitle ?? ""} />
                </div>
              </div>
            ) : null}
            {s.type === "product_grid" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectInput
                  name="source"
                  label="Ürün kaynağı"
                  defaultValue={s.config.source ?? "featured"}
                  options={[
                    { value: "bestseller", label: "“En Çok Satan” rozetliler" },
                    { value: "new", label: "“Yeni” rozetliler" },
                    { value: "gift", label: "“Tam Hediyelik” rozetliler" },
                    { value: "featured", label: "Öne çıkanlar" },
                    { value: "discounted", label: "İndirimdekiler" },
                    { value: "category", label: "Bir kategoriden" },
                    { value: "manual", label: "Elle seçilen ürünler" },
                  ]}
                />
                <SelectInput name="categoryId" label="Kategori (kaynak “Bir kategoriden” ise)" defaultValue={s.config.categoryId ?? ""} placeholder="—" options={categories} />
                <TextInput name="limit" label="Gösterilecek ürün sayısı" inputMode="numeric" defaultValue={String(s.config.limit ?? 8)} />
                <TextInput name="ctaLabel" label="“Tümünü gör” metni" defaultValue={s.config.ctaLabel ?? ""} />
                <TextInput name="ctaUrl" label="“Tümünü gör” bağlantısı" defaultValue={s.config.ctaUrl ?? ""} />
                <fieldset className="sm:col-span-2">
                  <legend className="mb-1.5 text-sm font-medium">Elle seçilen ürünler (kaynak “Elle seçilen” ise; işaretleme sırası korunmaz, ürün adına göre)</legend>
                  <div className="max-h-56 overflow-y-auto rounded-sm border border-neutral-200 p-2">
                    {products.map((p) => (
                      <label key={p.id} className="flex min-h-9 items-center gap-2 text-sm">
                        <input type="checkbox" name="productIds" value={p.id} defaultChecked={s.productIds.includes(p.id)} className="h-4 w-4" />
                        {p.name}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            ) : null}
            {s.type === "category_discovery" || s.type === "reviews" || s.type === "blog" ? <TextInput name="limit" label="En fazla öğe" inputMode="numeric" defaultValue={String(s.config.limit ?? 6)} /> : null}
            {s.type === "video" ? <p className="text-sm text-neutral-600">Videonun kendisi Admin › Videolar’daki “{s.config.slot}” alanından yönetilir. URL girilmezse sitede “VideoTest” yer tutucusu görünür.</p> : null}
            <Checkbox name="isActive" label="Bölüm aktif" defaultChecked={s.isActive} />
            <SaveBar label="Bölümü kaydet" />
          </AdminForm>
        </div>
      ) : null}
    </li>
  );
}
