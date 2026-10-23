"use client";

import { AdminForm, SaveBar } from "@/components/admin/AdminForm";
import { Checkbox, Section, SelectInput, TextArea, TextInput } from "@/components/admin/fields";
import { SlugFields } from "@/components/admin/SlugFields";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { FaqEditor } from "@/components/admin/FaqEditor";
import { SeoFields } from "@/components/admin/SeoFields";
import type { ActionState } from "@/lib/admin/form";
import type { categories } from "@/lib/db/schema";

type Category = typeof categories.$inferSelect;

const ACCENTS = [
  { value: "coral", label: "Mercan" },
  { value: "sun", label: "Güneş sarısı" },
  { value: "leaf", label: "Yaprak yeşili" },
  { value: "sky", label: "Gökyüzü mavisi" },
  { value: "berry", label: "Ahududu pembe" },
  { value: "lilac", label: "Lila" },
];

export function CategoryForm({ action, category: c, parents }: { action: (p: ActionState, fd: FormData) => Promise<ActionState>; category?: Category | null; parents: { value: string; label: string }[] }) {
  return (
    <AdminForm action={action} className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-6">
        <Section title="Kategori">
          <SlugFields nameField="name" nameLabel="Kategori adı" defaultName={c?.name} defaultSlug={c?.slug} prefix="/kategori/" />
          <TextArea name="description" label="Kısa açıklama" rows={3} maxLength={600} defaultValue={c?.description ?? ""} hint="Kategori başlığının altında görünür; meta açıklama yedeği. 1–2 net cümle." />
          <RichTextEditor name="content" label="Kategori içeriği (sayfa altı, GEO)" defaultValue={c?.content} placeholder="Örn. “Keçe dikiş kiti nedir?”, “Kutuda neler var?”, “Nasıl kullanılır?” — kısa, gerçek bilgiler." />
        </Section>
        <Section title="Sıkça sorulan sorular" description="Kategori sayfasında görünür; FAQPage şemasına eklenir.">
          <FaqEditor defaultValue={c?.faq ?? []} />
        </Section>
        <SeoFields defaults={{ ...c, noIndex: c?.noIndex ?? false }} fallbackTitle={`${c?.name ?? "{Kategori}"} | Eğitici Çocuk Aktivite Kitleri | Bıcırıklar Kids`} fallbackDescription={c?.description ?? undefined} urlPath={`/kategori/${c?.slug ?? "…"}`} />
      </div>
      <div className="space-y-6">
        <Section title="Yayın">
          <SelectInput
            name="status"
            label="Durum"
            defaultValue={c?.status ?? "active"}
            options={[
              { value: "active", label: "Aktif" },
              { value: "hidden", label: "Gizli" },
            ]}
          />
          <SelectInput name="parentId" label="Üst kategori" defaultValue={c?.parentId ?? ""} placeholder="— Ana kategori —" options={parents.filter((p) => p.value !== c?.id)} />
          <TextInput name="sortOrder" label="Sıra" inputMode="numeric" defaultValue={String(c?.sortOrder ?? 0)} />
          <Checkbox name="showInMenu" label="Menüde göster" defaultChecked={c?.showInMenu ?? true} />
        </Section>
        <Section title="Görsel">
          <ImagePicker name="image" label="Kategori görseli" defaultValue={c?.image} altName="imageAlt" altDefault={c?.imageAlt} aspect="aspect-[4/5]" hint="Önerilen dikey 4:5. Boşsa marka illüstrasyonu gösterilir." />
          <SelectInput name="accent" label="Vurgu rengi" defaultValue={c?.accent ?? "coral"} options={ACCENTS} />
        </Section>
      </div>
      <div className="xl:col-span-2">
        <SaveBar />
      </div>
    </AdminForm>
  );
}
