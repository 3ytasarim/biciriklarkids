"use client";

import { AdminForm, SaveBar } from "@/components/admin/AdminForm";
import { Checkbox, Section, SelectInput, TextInput } from "@/components/admin/fields";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { RowsEditor } from "@/components/admin/RowsEditor";
import { FaqEditor } from "@/components/admin/FaqEditor";
import { CarriersEditor } from "@/components/admin/CarriersEditor";
import type { SiteSettings } from "@/lib/settings";
import { saveSettingsAction } from "./actions";

const n = (v: number | null | undefined) => (v == null ? "" : String(v));

export type IyzicoStatus = { fromEnv: boolean; active: boolean; secretStored: boolean; secretReadable: boolean };

export function SettingsForm({ s, envOverrides, iyzicoStatus }: { s: SiteSettings; envOverrides: string[]; iyzicoStatus: IyzicoStatus }) {
  return (
    <AdminForm action={saveSettingsAction} className="max-w-4xl space-y-6">
      <Section title="Marka">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput name="brandName" label="Marka adı" required defaultValue={s.brand.name} />
          <TextInput name="legalName" label="Ticari ünvan" required defaultValue={s.brand.legalName} hint="Footer telif satırı ve faturada." />
        </div>
        <TextInput name="tagline" label="Slogan" defaultValue={s.brand.tagline} />
        <div className="grid gap-5 sm:grid-cols-2">
          <ImagePicker name="logoUrl" label="Logo (PNG/WebP)" defaultValue={s.brand.logoUrl} aspect="aspect-[3/1]" hint="Organization şemasında kullanılır. Boşsa kod tabanlı logo." />
          <ImagePicker name="defaultOgImage" label="Varsayılan paylaşım görseli" defaultValue={s.brand.defaultOgImage} aspect="aspect-[1200/630]" hint="Boşsa dinamik marka görseli." />
        </div>
      </Section>

      <Section title="İletişim" description="Sitede, JSON-LD'de ve yasal metinlerde kullanılır.">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput name="email" label="E-posta" type="email" defaultValue={s.contact.email ?? ""} />
          <TextInput name="phone" label="Telefon" defaultValue={s.contact.phone ?? ""} />
          <TextInput name="whatsapp" label="WhatsApp (isteğe bağlı)" defaultValue={s.contact.whatsapp ?? ""} />
          <TextInput name="workingHours" label="Çalışma saatleri" defaultValue={s.contact.workingHours ?? ""} />
          <TextInput name="street" label="Adres" defaultValue={s.contact.street ?? ""} />
          <TextInput name="district" label="İlçe" defaultValue={s.contact.district ?? ""} />
          <TextInput name="city" label="İl" defaultValue={s.contact.city ?? ""} />
          <TextInput name="postalCode" label="Posta kodu" defaultValue={s.contact.postalCode ?? ""} />
        </div>
      </Section>

      <Section title="Sosyal medya" description="Yalnızca gerçek hesapları girin; boş olanlar sitede ve şemada görünmez.">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput name="instagram" label="Instagram" placeholder="https://www.instagram.com/..." defaultValue={s.social.instagram ?? ""} />
          <TextInput name="facebook" label="Facebook" defaultValue={s.social.facebook ?? ""} />
          <TextInput name="youtube" label="YouTube" defaultValue={s.social.youtube ?? ""} />
          <TextInput name="tiktok" label="TikTok" defaultValue={s.social.tiktok ?? ""} />
          <TextInput name="pinterest" label="Pinterest" defaultValue={s.social.pinterest ?? ""} />
        </div>
      </Section>

      <Section title="Duyuru çubuğu" description="Header üzerindeki ince kampanya şeridi. Birden fazla mesaj varsa yavaşça kayar. Gerçek olmayan kampanya yazmayın.">
        <Checkbox name="announcementEnabled" label="Duyuru çubuğunu göster" defaultChecked={s.announcement.enabled} />
        <RowsEditor
          name="announcementItems"
          addLabel="Mesaj ekle"
          defaultValue={s.announcement.items.map((i) => ({ text: i.text, href: i.href ?? "" }))}
          columns={[
            { key: "text", label: "Metin", placeholder: "ör. 500 TL ve üzeri siparişlerde kargo ücretsiz", maxLength: 140 },
            { key: "href", label: "Bağlantı", placeholder: "/urunler (isteğe bağlı)", width: "w-48", maxLength: 300 },
          ]}
        />
      </Section>

      <Section
        title="Kampanya popup'ı"
        description="Mağazada açılan kampanya penceresi. Tarih girerseniz yalnızca bu aralıkta gösterilir (İstanbul saati); boş bırakılan tarih o yönde sınır koymaz. Sepet ve ödeme sayfalarında açılmaz."
      >
        <Checkbox name="popupEnabled" label="Popup'ı göster" defaultChecked={s.popup.enabled} />
        <div className="grid gap-5 sm:grid-cols-[minmax(0,240px)_1fr]">
          <ImagePicker name="popupImage" label="Popup görseli" defaultValue={s.popup.imageUrl} aspect="aspect-[4/5]" hint="Dikey 4:5 önerilir (ör. 1080×1350)." />
          <div className="space-y-5">
            <TextInput name="popupAlt" label="Görsel açıklaması" defaultValue={s.popup.alt} maxLength={200} hint="Ekran okuyucular için görseldeki metin, ör. “1. yıla özel tüm ürünlerde %50 indirim”." />
            <TextInput name="popupHref" label="Tıklayınca gidilecek sayfa" placeholder="/urunler" defaultValue={s.popup.href ?? ""} hint="/ ile başlayan site içi yol veya https:// adres. Boşsa görsel tıklanmaz." />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextInput name="popupStartsAt" label="Başlangıç" type="datetime-local" defaultValue={s.popup.startsAt ?? ""} />
              <TextInput name="popupEndsAt" label="Bitiş" type="datetime-local" defaultValue={s.popup.endsAt ?? ""} />
              <TextInput name="popupDelay" label="Açılma gecikmesi (sn)" inputMode="numeric" defaultValue={String(s.popup.delaySeconds)} />
              <TextInput name="popupHideDays" label="Kapatınca tekrar gösterme (gün)" inputMode="numeric" defaultValue={String(s.popup.hideDays)} hint="0: her ziyarette yeniden." />
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Kargo"
        description="Kargo firması eklerseniz müşteri ödeme adımında firmayı seçer ve o firmanın ücreti uygulanır. Firma yoksa aşağıdaki sabit ücret kullanılır; o da boşsa ödeme özetinde “Kargo: sipariş onayında bildirilir” yazar."
      >
        <div className="grid gap-5 sm:grid-cols-3">
          <TextInput name="flatFee" label="Sabit kargo ücreti (₺)" inputMode="decimal" defaultValue={n(s.shipping.flatFee)} hint="Yalnızca kargo firması tanımlı değilken kullanılır." />
          <TextInput name="freeThreshold" label="Ücretsiz kargo eşiği (₺)" inputMode="decimal" defaultValue={n(s.shipping.freeThreshold)} hint="Tüm firmalar için geçerli (firmaya özel eşik girilmemişse)." />
          <TextInput name="dispatchTime" label="Kargoya teslim süresi" placeholder="ör. 1–3 iş günü" defaultValue={s.shipping.dispatchTime ?? ""} />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-neutral-800">Kargo firmaları</p>
          <CarriersEditor defaultValue={s.shipping.carriers} />
        </div>
      </Section>

      <Section
        title="Kartla ödeme (iyzico)"
        description="iyzico panelinizdeki (Ayarlar › Firma Ayarları) API ve gizli anahtarı girin. Gizli anahtar şifreli saklanır ve bir daha ekranda gösterilmez; değiştirmek için yenisini yazmanız yeterli, boş bırakırsanız kayıtlı olan korunur."
      >
        {iyzicoStatus.fromEnv ? (
          <p className="rounded-sm bg-amber-50 p-3 text-sm text-amber-900">Sunucuda IYZICO_* ortam değişkenleri tanımlı; kartla ödeme onlarla çalışıyor ve buradaki değerler kullanılmıyor.</p>
        ) : (
          <p className={`rounded-sm p-3 text-sm font-medium ${iyzicoStatus.active ? "bg-emerald-50 text-emerald-900" : "bg-neutral-100 text-neutral-700"}`}>
            {iyzicoStatus.active
              ? `Durum: AÇIK — ödeme sayfasında “Kredi / Banka Kartı” görünüyor (${s.iyzico.mode === "live" ? "canlı" : "test/sandbox"}).`
              : iyzicoStatus.secretStored && !iyzicoStatus.secretReadable
                ? "Durum: KAPALI — kayıtlı gizli anahtar bu sunucuda çözülemedi; lütfen gizli anahtarı yeniden girin."
                : "Durum: KAPALI — anahtarları girip “Kartla ödemeyi aç”ı işaretleyin."}
          </p>
        )}
        <Checkbox name="iyzicoEnabled" label="Kartla ödemeyi aç" defaultChecked={s.iyzico.enabled} />
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectInput
            name="iyzicoMode"
            label="Ortam"
            defaultValue={s.iyzico.mode}
            options={[
              { value: "live", label: "Canlı (gerçek ödeme) — api.iyzipay.com" },
              { value: "sandbox", label: "Test (sandbox) — sandbox-api.iyzipay.com" },
            ]}
            hint="Canlı anahtarlarla “Canlı”, sandbox anahtarlarıyla “Test” seçin."
          />
          <TextInput name="iyzicoInstallments" label="Taksit seçenekleri" defaultValue={s.iyzico.installments} placeholder="1,2,3,6,9" hint="Virgülle: 1, 2, 3, 6, 9, 12. Tek çekim her zaman açıktır." />
          <TextInput name="iyzicoApiKey" label="API anahtarı" defaultValue={s.iyzico.apiKey ?? ""} autoComplete="off" spellCheck={false} />
          <TextInput
            name="iyzicoSecretKey"
            label="Gizli anahtar (Secret key)"
            type="password"
            autoComplete="new-password"
            spellCheck={false}
            placeholder={s.iyzico.secretLast4 ? `Kayıtlı (sonu ••••${s.iyzico.secretLast4}) — değiştirmek için yenisini yazın` : "Gizli anahtarı yapıştırın"}
          />
        </div>
      </Section>

      <Section title="Ödeme: Havale / EFT" description="IBAN girilmeden bu yöntem ödeme sayfasında görünmez. Kartla ödeme yukarıdaki iyzico bölümünden açılır.">
        <Checkbox name="bankEnabled" label="Havale/EFT ile ödemeyi aç" defaultChecked={s.payments.bankTransfer.enabled} />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput name="bankName" label="Banka" defaultValue={s.payments.bankTransfer.bankName ?? ""} />
          <TextInput name="accountHolder" label="Hesap sahibi" defaultValue={s.payments.bankTransfer.accountHolder ?? ""} />
          <TextInput name="iban" label="IBAN" placeholder="TR00 0000 0000 0000 0000 0000 00" defaultValue={s.payments.bankTransfer.iban ?? ""} />
          <TextInput name="bankNote" label="Not" defaultValue={s.payments.bankTransfer.note ?? ""} placeholder="ör. Ödemeniz 1 iş günü içinde kontrol edilir." />
        </div>
      </Section>

      <Section title="Analitik ve reklam" description="ID girilmezse ilgili script hiç yüklenmez. Script'ler yalnızca ziyaretçi çerez izni verdikten sonra yüklenir (Consent Mode v2).">
        {envOverrides.length ? <p className="rounded-sm bg-amber-50 p-3 text-sm text-amber-900">Ortam değişkeninde tanımlı olduğu için şu değerler buradakini ezer: {envOverrides.join(", ")}</p> : null}
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput name="gtmId" label="Google Tag Manager" placeholder="GTM-XXXXXXX" defaultValue={s.analytics.gtmId ?? ""} hint="GTM varsa GA4/Ads etiketlerini GTM içinden yönetin." />
          <TextInput name="ga4Id" label="Google Analytics 4" placeholder="G-XXXXXXXXXX" defaultValue={s.analytics.ga4Id ?? ""} />
          <TextInput name="googleAdsId" label="Google Ads" placeholder="AW-123456789" defaultValue={s.analytics.googleAdsId ?? ""} />
          <TextInput name="metaPixelId" label="Meta Pixel" placeholder="123456789012345" defaultValue={s.analytics.metaPixelId ?? ""} />
        </div>
      </Section>

      <Section title="Mağaza ve Merchant Center">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput name="returnDays" label="Cayma hakkı (gün)" inputMode="numeric" defaultValue={String(s.commerce.returnDays)} hint="Ürün şemasında MerchantReturnPolicy olarak yayınlanır." />
          <TextInput name="googleProductCategory" label="Varsayılan Google ürün kategorisi" defaultValue={s.commerce.googleProductCategory ?? ""} hint="Google ürün taksonomisinden ID veya tam yol." />
        </div>
      </Section>

      <Section title="SSS sayfası (sipariş ve teslimat)" description="/sss sayfasında görünür.">
        <FaqEditor name="siteFaq" defaultValue={s.siteFaq} />
      </Section>

      <SaveBar label="Ayarları kaydet" />
    </AdminForm>
  );
}
