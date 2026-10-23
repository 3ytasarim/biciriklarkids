# Ödeme sağlayıcıları

Kayıtlı: `iyzico` (kart — Checkout Form, IYZICO_* ENV doluysa açılır), `bank_transfer` (Havale/EFT — admin'de IBAN girilince açılır), `dev_test` (yalnızca geliştirme).

## iyzico akışı
1. `placeOrderAction` siparişi oluşturur → `iyzicoProvider.initiate` Checkout Form başlatır → müşteri iyzico ödeme sayfasına yönlendirilir.
2. iyzico müşteriyi `/api/payments/iyzico/callback?n=<sipariş>&t=<anahtar>` adresine `token` POST ederek döndürür.
3. `handleIyzicoCallback` token ile `checkoutform/auth/ecom/detail` sorgular; basketId=sipariş no, conversationId=sipariş id, price=sipariş toplamı ve fraudStatus=1 ise `markOrderPaid` (idempotent). fraudStatus=0 → inceleme notu, ödeme "bekliyor" kalır.
4. Başarısız/terk edilmiş ödeme: sipariş "Ödeme bekleniyor" kalır; müşteri sipariş sayfasındaki "Ödemeyi tamamla" ile `/api/payments/iyzico/tekrar` üzerinden yeniden dener.
5. Sepet: indirim kalemlere orantılı dağıtılır, kargo ayrı kalem; toplam tutmazsa ödeme başlatılmaz.

## Diğer sağlayıcılar (gerekirse)

| Sağlayıcı | Gerekli ENV | Notlar |
|---|---|---|
| PayTR | `PAYTR_MERCHANT_ID`, `PAYTR_MERCHANT_KEY`, `PAYTR_MERCHANT_SALT` | iFrame API → token al, `kind: "html"`; bildirim URL'inde hash doğrula |
| Banka sanal POS | Bankaya göre | 3D Secure form → `kind: "html"`; dönüşte MAC/hash doğrula |

Kurallar:
- Kart numarası bu sunucuya **asla** gelmez / saklanmaz (hosted page, iFrame veya 3DS formu).
- Siparişi "ödendi" yapan tek yer, imzası doğrulanmış sunucu geri çağrısıdır (`markOrderPaid`).
- Her geri çağrı `payment_transactions` tablosuna ham yanıt (kart verisi hariç) ile kaydedilir.
- Geri çağrı idempotent olmalı (aynı bildirim iki kez gelirse ikinci kez stok/kupon işlemi yapılmaz).
