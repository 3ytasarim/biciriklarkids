"use client";

import { AdminForm, SaveBar } from "@/components/admin/AdminForm";
import { Checkbox, Section, SelectInput, TextArea, TextInput } from "@/components/admin/fields";
import { SlugFields } from "@/components/admin/SlugFields";
import { GalleryEditor } from "@/components/admin/GalleryEditor";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { RowsEditor } from "@/components/admin/RowsEditor";
import { FaqEditor } from "@/components/admin/FaqEditor";
import { SeoFields } from "@/components/admin/SeoFields";
import type { ActionState } from "@/lib/admin/form";
import type { products } from "@/lib/db/schema";

type Product = typeof products.$inferSelect;
type Props = {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  product?: Product | null;
  images: { url: string; alt: string }[];
  variants: { name: string; value: string; sku: string; priceAdjustment: string; stock: string }[];
  categories: { value: string; label: string }[];
  productTypes: string[];
};

const num = (v: number | null | undefined) => (v == null ? "" : String(v));

export function ProductForm({ action, product: p, images, variants, categories, productTypes }: Props) {
  return (
    <AdminForm action={action} className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-6">
        <Section title="Temel bilgiler">
          <SlugFields nameField="name" nameLabel="Ürün adı" defaultName={p?.name} defaultSlug={p?.slug} prefix="/urun/" />
          <TextArea name="shortDescription" label="Kısa açıklama" rows={2} maxLength={400} defaultValue={p?.shortDescription ?? ""} hint="Ürün sayfasında başlığın altında ve meta açıklama yedeği olarak kullanılır (1–2 cümle)." />
          <RichTextEditor name="description" label="Ürün açıklaması" defaultValue={p?.description} />
        </Section>

        <Section title="Görseller" description="İlk görsel ana görseldir; ikincisi kartta hover görseli olur. Dosya adı ve alt metin açıklayıcı olmalı (ör. “avokado figürlü keçe çanta dikiş kiti”).">
          <GalleryEditor name="images" defaultValue={images} nameHint={p?.name ?? undefined} />
        </Section>

        <Section title="Fiyat ve stok">
          <div className="grid gap-5 sm:grid-cols-3">
            <TextInput name="price" label="Satış fiyatı (₺)" required inputMode="decimal" defaultValue={num(p?.price)} />
            <TextInput name="compareAtPrice" label="Eski fiyat (₺)" inputMode="decimal" defaultValue={num(p?.compareAtPrice)} hint="Yalnızca gerçek indirimde girin." />
            <TextInput name="costPrice" label="Maliyet (₺, gizli)" inputMode="decimal" defaultValue={num(p?.costPrice)} />
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <TextInput name="stock" label="Stok adedi" inputMode="numeric" defaultValue={num(p?.stock ?? 0)} />
            <TextInput name="lowStockThreshold" label="“Son ürünler” eşiği" inputMode="numeric" defaultValue={num(p?.lowStockThreshold ?? 3)} />
            <div className="pt-7">
              <Checkbox name="trackStock" label="Stok takibi" hint="Kapalıysa stok sınırsız kabul edilir." defaultChecked={p?.trackStock ?? true} />
            </div>
          </div>
        </Section>

        <Section title="Ürün detayları" description="Bu alanlar ürün sayfasındaki akordeon bölümlerini oluşturur; boş bırakılan bölüm gösterilmez.">
          <div className="grid gap-5 sm:grid-cols-3">
            <TextInput name="ageMin" label="Alt yaş" inputMode="numeric" defaultValue={num(p?.ageMin)} />
            <TextInput name="ageMax" label="Üst yaş" inputMode="numeric" defaultValue={num(p?.ageMax)} />
            <SelectInput
              name="difficulty"
              label="Zorluk"
              defaultValue={p?.difficulty ?? ""}
              placeholder="Seçilmedi"
              options={[
                { value: "easy", label: "Kolay" },
                { value: "medium", label: "Orta" },
                { value: "hard", label: "İleri" },
              ]}
            />
          </div>
          <TextArea name="contents" label="Paket içeriği" rows={4} defaultValue={p?.contents ?? ""} hint="Her satıra bir kalem yazın (ör. “1 adet 7 cm plastik güvenli iğne”)." />
          <TextArea name="usageInformation" label="Nasıl kullanılır?" rows={4} defaultValue={p?.usageInformation ?? ""} />
          <TextArea name="material" label="Materyal" rows={2} defaultValue={p?.material ?? ""} />
          <TextArea name="safetyInformation" label="Güvenlik bilgileri" rows={3} defaultValue={p?.safetyInformation ?? ""} hint="Yaş uyarıları, küçük parça uyarısı vb. — yalnızca doğrulanmış bilgiler." />
        </Section>

        <Section title="Varyantlar (isteğe bağlı)" description="Renk/figür gibi seçenekler. Varyant varsa stok varyant bazında takip edilir.">
          <RowsEditor
            name="variants"
            defaultValue={variants}
            addLabel="Varyant ekle"
            columns={[
              { key: "name", label: "Seçenek", placeholder: "Seçenek (ör. Renk)", width: "w-32" },
              { key: "value", label: "Değer", placeholder: "Değer (ör. Pembe)" },
              { key: "sku", label: "SKU", width: "w-28" },
              { key: "priceAdjustment", label: "Fiyat farkı", placeholder: "± ₺", width: "w-24" },
              { key: "stock", label: "Stok", width: "w-20", type: "number" },
            ]}
          />
        </Section>

        <Section title="Sıkça sorulan sorular" description="Ürün sayfasında görünür ve FAQPage şemasına eklenir.">
          <FaqEditor defaultValue={p?.faq ?? []} />
        </Section>

        <SeoFields defaults={{ ...p, noIndex: p?.noIndex ?? false }} fallbackTitle={p ? `${p.name} | Bıcırıklar Kids` : "{Ürün adı} | Bıcırıklar Kids"} fallbackDescription={p?.shortDescription ?? undefined} urlPath={`/urun/${p?.slug ?? "…"}`} />
      </div>

      <div className="space-y-6">
        <Section title="Yayın">
          <SelectInput
            name="status"
            label="Durum"
            defaultValue={p?.status ?? "draft"}
            options={[
              { value: "draft", label: "Taslak (sitede görünmez)" },
              { value: "active", label: "Yayında" },
              { value: "archived", label: "Arşiv" },
            ]}
          />
          <TextInput name="sortOrder" label="Sıra" inputMode="numeric" defaultValue={num(p?.sortOrder ?? 0)} hint="Küçük sayı önce gösterilir (Önerilen sıralama)." />
        </Section>
        <Section title="Organizasyon">
          <SelectInput name="categoryId" label="Kategori" defaultValue={p?.categoryId ?? ""} placeholder="Kategori seçin" options={categories} />
          <TextInput name="productType" label="Ürün türü (filtre)" defaultValue={p?.productType ?? ""} list="product-types" hint="Ör. Dikiş Kiti, Oyuncak Kiti, Boyama Seti" />
          <datalist id="product-types">
            {productTypes.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
          <TextInput name="brand" label="Marka" defaultValue={p?.brand ?? "Bıcırıklar Kids"} />
        </Section>
        <Section title="Rozetler">
          <Checkbox name="newProduct" label="Yeni" defaultChecked={p?.newProduct} />
          <Checkbox name="bestseller" label="En Çok Satan" hint="Ana sayfadaki “En Çok Satanlar” bölümünde gösterilir." defaultChecked={p?.bestseller} />
          <Checkbox name="giftProduct" label="Tam Hediyelik" defaultChecked={p?.giftProduct} />
          <Checkbox name="featured" label="Öne çıkan (Çok Sevilenler)" defaultChecked={p?.featured} />
          <p className="text-xs text-neutral-500">“İndirim” ve “Son Ürünler” rozetleri fiyat ve stoktan otomatik hesaplanır.</p>
        </Section>
        <Section title="Kodlar ve Merchant Center">
          <TextInput name="sku" label="SKU (stok kodu)" defaultValue={p?.sku ?? ""} placeholder="Boş bırakılırsa otomatik: BK-CNT-001" hint="Boş bırakırsanız kategoriye göre otomatik atanır." />
          <TextInput name="barcode" label="Barkod / GTIN (EAN-13)" inputMode="numeric" defaultValue={p?.barcode ?? ""} />
          <TextInput name="mpn" label="MPN" defaultValue={p?.mpn ?? ""} hint="Boşsa SKU kullanılır." />
          <TextInput name="googleProductCategory" label="Google ürün kategorisi" defaultValue={p?.googleProductCategory ?? ""} hint="Boşsa Ayarlar'daki varsayılan kullanılır." />
          <SelectInput
            name="condition"
            label="Durum (condition)"
            defaultValue={p?.condition ?? "new"}
            options={[
              { value: "new", label: "Yeni" },
              { value: "refurbished", label: "Yenilenmiş" },
              { value: "used", label: "İkinci el" },
            ]}
          />
          <TextInput name="weightGrams" label="Ağırlık (gram)" inputMode="numeric" defaultValue={num(p?.weightGrams)} />
        </Section>
      </div>
      <div className="xl:col-span-2">
        <SaveBar />
      </div>
    </AdminForm>
  );
}
