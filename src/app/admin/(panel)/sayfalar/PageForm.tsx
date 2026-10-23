"use client";

import { AdminForm, SaveBar } from "@/components/admin/AdminForm";
import { Checkbox, Section, SelectInput, TextArea, TextInput } from "@/components/admin/fields";
import { SlugFields } from "@/components/admin/SlugFields";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { FaqEditor } from "@/components/admin/FaqEditor";
import { SeoFields } from "@/components/admin/SeoFields";
import type { ActionState } from "@/lib/admin/form";
import type { pages } from "@/lib/db/schema";

type Page = typeof pages.$inferSelect;

export function PageForm({ action, page: p }: { action: (s: ActionState, fd: FormData) => Promise<ActionState>; page?: Page | null }) {
  return (
    <AdminForm action={action} className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-6">
        <Section title="Sayfa">
          <SlugFields nameField="title" nameLabel="Başlık" defaultName={p?.title} defaultSlug={p?.slug} prefix="/" />
          <TextArea name="excerpt" label="Giriş metni (isteğe bağlı)" rows={2} defaultValue={p?.excerpt ?? ""} />
          <RichTextEditor name="content" label="İçerik" defaultValue={p?.content} />
        </Section>
        <Section title="Sıkça sorulan sorular (isteğe bağlı)">
          <FaqEditor defaultValue={p?.faq ?? []} />
        </Section>
        <SeoFields defaults={{ ...p, noIndex: p?.noIndex ?? false }} fallbackTitle={`${p?.title ?? "{Başlık}"} | Bıcırıklar Kids`} fallbackDescription={p?.excerpt ?? undefined} urlPath={`/${p?.slug ?? "…"}`} />
      </div>
      <div className="space-y-6">
        <Section title="Ayarlar">
          <SelectInput
            name="kind"
            label="Tür"
            defaultValue={p?.kind ?? "info"}
            options={[
              { value: "info", label: "Bilgi sayfası" },
              { value: "legal", label: "Yasal metin (footer altı)" },
            ]}
          />
          <TextInput name="sortOrder" label="Sıra" inputMode="numeric" defaultValue={String(p?.sortOrder ?? 0)} />
          <Checkbox name="isActive" label="Yayında" defaultChecked={p?.isActive ?? true} />
          <Checkbox name="showInFooter" label="Footer'da bağlantı göster" defaultChecked={p?.showInFooter ?? true} />
        </Section>
      </div>
      <div className="xl:col-span-2">
        <SaveBar />
      </div>
    </AdminForm>
  );
}
