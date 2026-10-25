/**
 * E-posta şablonları: olaylar, varsayılan Türkçe metinler ve yer tutucular.
 * Admin › E-posta'dan konu/başlık/metin düzenlenir; metin düz yazıdır (boş satır = yeni paragraf),
 * {{yer_tutucu}} değerleri gönderimde siparişe göre doldurulur. Sipariş özeti tablosu otomatik eklenir.
 */
export const MAIL_EVENTS = ["order_received", "payment_confirmed", "order_status", "order_shipped", "order_delivered", "order_cancelled", "admin_new_order"] as const;
export type MailEvent = (typeof MAIL_EVENTS)[number];

export type MailTemplate = { enabled: boolean; subject: string; heading: string; body: string };

export const MAIL_EVENT_INFO: Record<MailEvent, { label: string; when: string; audience: "customer" | "store" }> = {
  order_received: { label: "Sipariş alındı", when: "Havale/EFT ile verilen sipariş oluşturulunca (ödeme bekleniyor; banka bilgisi içerir).", audience: "customer" },
  payment_confirmed: { label: "Ödeme alındı / sipariş onaylandı", when: "Kartla ödeme başarılı olunca veya havale ödemesini panelden onaylayınca.", audience: "customer" },
  order_status: { label: "Sipariş durumu güncellendi", when: "Durum “Onaylandı” veya “Hazırlanıyor” yapılınca.", audience: "customer" },
  order_shipped: { label: "Kargoya verildi", when: "Durum “Kargoya verildi” yapılınca (kargo firması ve takip no ile).", audience: "customer" },
  order_delivered: { label: "Teslim edildi", when: "Durum “Teslim edildi” yapılınca.", audience: "customer" },
  order_cancelled: { label: "İptal / iade", when: "Durum “İptal edildi” veya “İade edildi” yapılınca.", audience: "customer" },
  admin_new_order: { label: "Mağazaya yeni sipariş bildirimi", when: "Yeni havale siparişi oluşunca ve kartla ödeme alınınca; “Bildirim adresi”ne gider.", audience: "store" },
};

export const MAIL_PLACEHOLDERS: { key: string; label: string }[] = [
  { key: "ad", label: "Müşteri adı" },
  { key: "soyad", label: "Müşteri soyadı" },
  { key: "siparis_no", label: "Sipariş numarası" },
  { key: "toplam", label: "Sipariş toplamı" },
  { key: "durum", label: "Sipariş durumu" },
  { key: "odeme_yontemi", label: "Ödeme yöntemi" },
  { key: "kargo_firmasi", label: "Kargo firması" },
  { key: "takip_no", label: "Kargo takip numarası" },
  { key: "siparis_linki", label: "Sipariş takip bağlantısı" },
  { key: "banka_bilgisi", label: "Havale/EFT banka bilgileri" },
  { key: "teslimat_adresi", label: "Teslimat adresi" },
  { key: "telefon", label: "Müşteri telefonu" },
  { key: "eposta", label: "Müşteri e-postası" },
  { key: "magaza", label: "Mağaza adı" },
];

export const DEFAULT_MAIL_TEMPLATES: Record<MailEvent, MailTemplate> = {
  order_received: {
    enabled: true,
    subject: "Siparişiniz alındı — {{siparis_no}}",
    heading: "Teşekkürler {{ad}}, siparişiniz bize ulaştı!",
    body: "{{siparis_no}} numaralı siparişinizi aldık. Ödemeniz hesabımıza geçtiğinde siparişinizi hemen hazırlamaya başlayacağız.\n\nHavale/EFT bilgileri:\n{{banka_bilgisi}}\n\nAçıklama kısmına lütfen sipariş numaranızı ({{siparis_no}}) yazın. Toplam tutar: {{toplam}}.\n\nSiparişinizin durumunu dilediğiniz zaman buradan takip edebilirsiniz: {{siparis_linki}}",
  },
  payment_confirmed: {
    enabled: true,
    subject: "Ödemeniz alındı, siparişiniz onaylandı — {{siparis_no}}",
    heading: "Siparişiniz onaylandı 🎉",
    body: "Merhaba {{ad}},\n\n{{siparis_no}} numaralı siparişinizin ödemesi ({{toplam}}) alındı. Kitleriniz özenle hazırlanıp kargoya verilecek; kargoya verildiğinde size ayrıca haber vereceğiz.\n\nSipariş takibi: {{siparis_linki}}",
  },
  order_status: {
    enabled: true,
    subject: "Siparişiniz {{siparis_no}}: {{durum}}",
    heading: "Siparişinizin durumu güncellendi",
    body: "Merhaba {{ad}},\n\n{{siparis_no}} numaralı siparişinizin yeni durumu: {{durum}}.\n\nSipariş takibi: {{siparis_linki}}",
  },
  order_shipped: {
    enabled: true,
    subject: "Siparişiniz kargoya verildi — {{siparis_no}}",
    heading: "Kitleriniz yola çıktı! 📦",
    body: "Merhaba {{ad}},\n\n{{siparis_no}} numaralı siparişiniz kargoya verildi.\n\nKargo firması: {{kargo_firmasi}}\nTakip numarası: {{takip_no}}\n\nSipariş takibi: {{siparis_linki}}",
  },
  order_delivered: {
    enabled: true,
    subject: "Siparişiniz teslim edildi — {{siparis_no}}",
    heading: "İyi eğlenceler, minik eller! ✂️",
    body: "Merhaba {{ad}},\n\n{{siparis_no}} numaralı siparişiniz teslim edildi. Umarız çocuğunuzla keyifli bir üretim zamanı geçirirsiniz.\n\nBir sorunuz olursa bu e-postayı yanıtlamanız yeterli.",
  },
  order_cancelled: {
    enabled: true,
    subject: "Siparişiniz hakkında — {{siparis_no}}: {{durum}}",
    heading: "Siparişiniz {{durum}}",
    body: "Merhaba {{ad}},\n\n{{siparis_no}} numaralı siparişinizin durumu “{{durum}}” olarak güncellendi. Ödeme yaptıysanız iade, ödeme yönteminize göre bankanızın süreçleri içinde hesabınıza yansır.\n\nBir sorunuz olursa bu e-postayı yanıtlamanız yeterli.",
  },
  admin_new_order: {
    enabled: true,
    subject: "Yeni sipariş: {{siparis_no}} — {{toplam}}",
    heading: "Yeni sipariş geldi",
    body: "Sipariş: {{siparis_no}}\nMüşteri: {{ad}} {{soyad}} — {{eposta}} — {{telefon}}\nÖdeme: {{odeme_yontemi}} ({{durum}})\nToplam: {{toplam}}\n\nTeslimat adresi:\n{{teslimat_adresi}}",
  },
};
