"use client";

import { AdminForm, SaveBar } from "@/components/admin/AdminForm";
import { Section, SelectInput, TextArea, TextInput } from "@/components/admin/fields";
import { SlugFields } from "@/components/admin/SlugFields";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { SeoFields } from "@/components/admin/SeoFields";
import type { ActionState } from "@/lib/admin/form";
import type { blogPosts } from "@/lib/db/schema";

type Post = typeof blogPosts.$inferSelect;
const local = (d: Date | null | undefined) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

export function PostForm({ action, post: p, categories }: { action: (s: ActionState, fd: FormData) => Promise<ActionState>; post?: Post | null; categories: { value: string; label: string }[] }) {
  return (
    <AdminForm action={action} className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-6">
        <Section title="Yazı">
          <SlugFields nameField="title" nameLabel="Başlık" defaultName={p?.title} defaultSlug={p?.slug} prefix="/blog/" />
          <TextArea name="excerpt" label="Özet" rows={3} maxLength={500} defaultValue={p?.excerpt ?? ""} hint="Liste kartlarında ve meta açıklama yedeği olarak kullanılır." />
          <RichTextEditor name="content" label="İçerik" defaultValue={p?.content} placeholder="Kısa paragraflar, ara başlıklar (H2/H3) ve soru-cevap biçimi hem okurlar hem arama motorları için idealdir." />
        </Section>
        <SeoFields defaults={{ ...p, noIndex: p?.noIndex ?? false }} fallbackTitle={`${p?.title ?? "{Başlık}"} | Bıcırıklar Kids`} fallbackDescription={p?.excerpt ?? undefined} urlPath={`/blog/${p?.slug ?? "…"}`} ogHint="Boşsa kapak görseli, o da yoksa dinamik paylaşım görseli kullanılır." />
      </div>
      <div className="space-y-6">
        <Section title="Yayın">
          <SelectInput
            name="status"
            label="Durum"
            defaultValue={p?.status ?? "draft"}
            options={[
              { value: "draft", label: "Taslak" },
              { value: "published", label: "Yayında" },
            ]}
          />
          <TextInput name="publishedAt" label="Yayın tarihi" type="datetime-local" defaultValue={local(p?.publishedAt)} hint="İleri tarih verilirse o tarihte yayına girer." />
          <SelectInput name="categoryId" label="Kategori" defaultValue={p?.categoryId ?? ""} placeholder="— Kategorisiz —" options={categories} />
          <TextInput name="tags" label="Etiketler" defaultValue={p?.tags.join(", ") ?? ""} hint="Virgülle ayırın." />
        </Section>
        <Section title="Kapak">
          <ImagePicker name="coverImage" label="Kapak görseli" defaultValue={p?.coverImage} altName="coverImageAlt" altDefault={p?.coverImageAlt} aspect="aspect-video" />
        </Section>
        <Section title="Yazar (E-E-A-T)">
          <TextInput name="authorName" label="Yazar adı" defaultValue={p?.authorName ?? ""} />
          <TextArea name="authorBio" label="Kısa biyografi" rows={3} defaultValue={p?.authorBio ?? ""} />
        </Section>
      </div>
      <div className="xl:col-span-2">
        <SaveBar />
      </div>
    </AdminForm>
  );
}
