# Analytics planı

Kaynak: `src/lib/analytics/events.ts` (dataLayer), yükleyici: `src/components/marketing/Analytics.tsx`.
Script'ler yalnızca çerez izniyle yüklenir (Consent Mode v2: analytics_storage / ad_storage / ad_user_data / ad_personalization).
ID'ler Admin › Ayarlar veya ENV (`NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_GOOGLE_ADS_ID`, `NEXT_PUBLIC_META_PIXEL_ID`; ENV önceliklidir).

## GA4 e-ticaret olayları (doğrulandı: uçtan uca test)

| Olay | Nerede | Meta Pixel karşılığı |
|---|---|---|
| `view_item_list` | Ürün listesi görünür olduğunda (bir kez) | — |
| `select_item` | Karttaki ürün bağlantısı | — |
| `view_item` | Ürün sayfası, Hızlı İncele | ViewContent |
| `add_to_cart` | Kart/ürün sayfası/hızlı incele, sepette adet artışı | AddToCart |
| `remove_from_cart` | Sepette adet azaltma/silme | — |
| `view_cart` | Sepet çekmecesi / sepet sayfası | — |
| `begin_checkout` | Ödeme sayfası | InitiateCheckout |
| `add_shipping_info` / `add_payment_info` | Ödeme formu gönderimi | AddPaymentInfo |
| `purchase` | Sipariş onay sayfası (sipariş başına bir kez) | Purchase |
| `add_to_wishlist` | Favori | AddToWishlist |
| `search`, `newsletter_signup`, `form_submit`, `form_error` | Arama, bülten, iletişim | — |

Payload: GA4 standardı (`items[]`: item_id = SKU yoksa ürün id, item_name, item_brand, item_category, item_variant, price, discount, quantity, index, item_list_*).

## Yapılacak
- [ ] GTM'de GA4 Configuration + GA4 Event etiketleri (ecommerce dataLayer değişkeni)
- [ ] Google Ads dönüşüm etiketi (purchase), gelişmiş dönüşümler (izinle)
- [ ] Microsoft Clarity (pazarlama/analitik izni kategorisine bağlanarak)
- [ ] Server-side tagging (isteğe bağlı)
