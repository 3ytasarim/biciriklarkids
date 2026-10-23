"use client";

import { useState } from "react";
import { Checkbox, CountedInput, Section, TextInput } from "./fields";
import { ImagePicker } from "./ImagePicker";

type SeoDefaults = {
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  canonicalUrl?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  noIndex?: boolean;
};

const brand = (t: string) => (/b[ıi]c[ıi]r[ıi]klar/i.test(t) ? t : `${t} | Bıcırıklar Kids`);

/**
 * İçerik SEO alanları + Google sonuç önizlemesi. Boş alanlar otomatik doldurulur
 * (başlık: şablon, açıklama: kısa açıklama/içerikten, OG: dinamik görsel).
 */
export function SeoFields({ defaults, fallbackTitle, fallbackDescription, urlPath, ogHint }: { defaults: SeoDefaults; fallbackTitle: string; fallbackDescription?: string; urlPath: string; ogHint?: string }) {
  const [title, setTitle] = useState(defaults.seoTitle ?? "");
  const [desc, setDesc] = useState(defaults.seoDescription ?? "");
  const shownTitle = title.trim() ? brand(title) : fallbackTitle || "Başlık";
  const shownDesc = desc.trim() || fallbackDescription || "Açıklama boşsa içerikten otomatik üretilir.";
  return (
    <Section title="SEO & paylaşım" description="Boş bıraktığınız alanlar otomatik üretilir; elle yazılmış başlık/açıklama arama sonuçlarında daha iyi tıklanma sağlar.">
      <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4" aria-label="Google önizlemesi">
        <p className="truncate text-xs text-neutral-600">biciriklar.com.tr{urlPath}</p>
        <p className="mt-1 line-clamp-1 text-lg text-[#1a0dab]">{shownTitle}</p>
        <p className="mt-1 line-clamp-2 text-sm text-neutral-700">{shownDesc}</p>
      </div>
      <CountedInput name="seoTitle" label="SEO başlığı" hint="Boşsa şablon kullanılır." defaultValue={defaults.seoTitle} recommended={[30, 60]} value={title} onValue={setTitle} />
      <CountedInput name="seoDescription" label="Meta açıklama" multiline defaultValue={defaults.seoDescription} recommended={[70, 160]} value={desc} onValue={setDesc} />
      <TextInput name="seoKeywords" label="Anahtar kelimeler" hint="Virgülle ayırın. Site içi aramada da kullanılır." defaultValue={defaults.seoKeywords ?? ""} maxLength={300} />
      <TextInput name="canonicalUrl" label="Canonical URL" hint="Genelde boş bırakın (sayfa kendi adresini kullanır). Yalnızca aynı site içindeki adres kabul edilir." defaultValue={defaults.canonicalUrl ?? ""} maxLength={500} />
      <TextInput name="ogTitle" label="Paylaşım başlığı (Open Graph)" hint="Boşsa SEO başlığı kullanılır." defaultValue={defaults.ogTitle ?? ""} maxLength={160} />
      <TextInput name="ogDescription" label="Paylaşım açıklaması" hint="Boşsa meta açıklama kullanılır." defaultValue={defaults.ogDescription ?? ""} maxLength={320} />
      <ImagePicker name="ogImage" label="Paylaşım görseli (OG, isteğe bağlı)" defaultValue={defaults.ogImage} hint={ogHint ?? "Boşsa 1200×630 dinamik paylaşım görseli otomatik üretilir."} aspect="aspect-[1200/630]" />
      <Checkbox name="noIndex" label="Arama motorlarında gösterme (noindex)" hint="İşaretlenirse sitemap ve Merchant feed dışında kalır." defaultChecked={defaults.noIndex} />
    </Section>
  );
}
