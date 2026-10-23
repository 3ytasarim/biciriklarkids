import type { SiteSettings } from "@/lib/settings";

/**
 * Sağlayıcıdan bağımsız ödeme mimarisi.
 *
 * Akış: sipariş (status=pending, paymentStatus=pending) DB'de oluşturulur → seçilen sağlayıcının `initiate`
 * metodu çağrılır → sonuç türüne göre müşteri yönlendirilir (talimat sayfası / sağlayıcı ödeme sayfası /
 * 3D Secure formu). Ödeme sonucu YALNIZCA sağlayıcının sunucudan sunucuya doğrulanmış geri çağrısı
 * (callback/webhook) ile "paid" yapılır — istemciden gelen "başarılı" bilgisine asla güvenilmez.
 *
 * Yeni sağlayıcı eklemek (iyzico, PayTR, banka sanal POS):
 * 1) providers/<ad>.ts içinde PaymentProvider'ı uygula (kart verisi bu sunucuya HİÇ gelmemeli: hosted page/iframe/3DS)
 * 2) registry.ts'te listeye ekle; isEnabled ilgili ENV anahtarları varken true dönsün
 * 3) app/api/payments/<ad>/callback/route.ts ile imzalı geri çağrıyı doğrula → markOrderPaid()
 */

export type PaymentInitContext = {
  order: { id: string; orderNumber: string; grandTotal: number; currency: string; email: string; phone: string; firstName: string; lastName: string };
  items: { name: string; quantity: number; unitPrice: number; categoryName: string | null }[];
  settings: SiteSettings;
  /** Sağlayıcının müşteriyi döndüreceği adres (onay sayfası). */
  returnUrl: string;
  /** Sipariş görüntüleme anahtarı (ham) — sağlayıcı geri çağrısından onay sayfasına dönüş için. */
  accessToken: string;
  ipAddress: string;
  /** Kart sağlayıcılarının istediği ayrıntılar (sepet kalemleri, adresler, indirim/kargo). */
  checkout: {
    customerId: string | null;
    shipping: PaymentAddress;
    billing: PaymentAddress;
    shippingTotal: number;
    discountTotal: number;
    lines: { id: string; name: string; categoryName: string | null; lineTotal: number }[];
  };
};

export type PaymentAddress = { firstName: string; lastName: string; phone: string; city: string; district: string; postalCode?: string | null; addressLine: string };

export type PaymentInitResult =
  /** Ek işlem gerekmez; müşteri onay sayfasında talimatları görür (ör. havale/EFT). */
  | { kind: "instructions"; paymentStatus: "awaiting_transfer" | "pending" }
  /** Sağlayıcının barındırdığı ödeme sayfasına yönlendir. */
  | { kind: "redirect"; url: string }
  /** Sağlayıcının döndürdüğü otomatik gönderilen form / iframe içeriği (3D Secure). */
  | { kind: "html"; html: string };

export interface PaymentProvider {
  id: string;
  label: string;
  description: string;
  /** Yalnızca gerekli ayarlar/anahtarlar mevcutsa true. */
  isEnabled(settings: SiteSettings): boolean;
  initiate(ctx: PaymentInitContext): Promise<PaymentInitResult>;
}

/** İstemciye gönderilebilir özet (anahtar/sır içermez). */
export type PaymentMethodOption = { id: string; label: string; description: string };
