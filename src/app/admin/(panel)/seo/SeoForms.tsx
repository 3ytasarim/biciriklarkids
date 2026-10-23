"use client";

import { AdminForm, SaveBar } from "@/components/admin/AdminForm";
import { Checkbox, Section, SelectInput, TextArea, TextInput } from "@/components/admin/fields";
import { ImagePicker } from "@/components/admin/ImagePicker";
import type { seoSettings } from "@/lib/db/schema";
import { saveRedirectAction, saveSeoPageAction } from "./actions";

type Row = typeof seoSettings.$inferSelect;

export function SeoPageForm({ pageKey, row, defaults }: { pageKey: string; row: Row | null; defaults: { title: string; description: string } }) {
  return (
    <AdminForm action={saveSeoPageAction.bind(null, pageKey)} className="space-y-6">
      <Section title="Arama sonucu" description="Boş bırakılan alanlarda varsayılan metin kullanılır.">
        <TextInput name="title" label="Başlık" defaultValue={row?.title ?? ""} placeholder={defaults.title} maxLength={160} />
        <TextArea name="description" label="Meta açıklama" rows={3} defaultValue={row?.description ?? ""} placeholder={defaults.description} maxLength={320} />
        <TextInput name="keywords" label="Anahtar kelimeler" defaultValue={row?.keywords ?? ""} />
        <TextInput name="canonicalUrl" label="Canonical URL" defaultValue={row?.canonicalUrl ?? ""} hint="Genelde boş bırakın." />
        <div className="flex gap-6">
          <Checkbox name="robotsIndex" label="İndekslensin (index)" defaultChecked={row?.robotsIndex ?? true} />
          <Checkbox name="robotsFollow" label="Bağlantılar izlensin (follow)" defaultChecked={row?.robotsFollow ?? true} />
        </div>
      </Section>
      <Section title="Paylaşım (Open Graph)">
        <TextInput name="ogTitle" label="Paylaşım başlığı" defaultValue={row?.ogTitle ?? ""} />
        <TextArea name="ogDescription" label="Paylaşım açıklaması" rows={2} defaultValue={row?.ogDescription ?? ""} />
        <ImagePicker name="ogImage" label="Paylaşım görseli" defaultValue={row?.ogImage} aspect="aspect-[1200/630]" hint="Boşsa dinamik marka görseli (1200×630) kullanılır." />
      </Section>
      <SaveBar />
    </AdminForm>
  );
}

export function RedirectForm() {
  return (
    <AdminForm action={saveRedirectAction} resetOnSuccess className="grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 md:grid-cols-[1fr_1fr_120px_1fr_auto] md:items-end">
      <TextInput name="sourcePath" label="Eski adres" placeholder="/product-page/eski-urun" required />
      <TextInput name="destinationPath" label="Yeni adres" placeholder="/urun/yeni-urun" required />
      <SelectInput
        name="statusCode"
        label="Tür"
        defaultValue="301"
        options={[
          { value: "301", label: "301 kalıcı" },
          { value: "302", label: "302 geçici" },
        ]}
      />
      <TextInput name="note" label="Not" />
      <button type="submit" className="min-h-11 rounded-full bg-ink px-5 text-sm font-semibold text-white">
        Ekle
      </button>
    </AdminForm>
  );
}
