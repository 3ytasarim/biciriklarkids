# SEO + GEO kontrol listesi

## Uygulanan (mimari seviye)
- [x] Her indexlenebilir sayfada benzersiz `title`, `description`, self `canonical` (sorgu dizesiz), `robots`, OG, Twitter/X card
- [x] Başlık şablonları: ürün `{Ad} | Bıcırıklar Kids`, kategori `{Ad} | Eğitici Çocuk Aktivite Kitleri | Bıcırıklar Kids`; DB'den override (seoTitle…)
- [x] Filtreli/sıralı/sayfalı liste varyasyonları `noindex,follow`; arama sonuçları `noindex`
- [x] Dinamik OG görselleri 1200×630 (`/og/site`, `/og/urun/[slug]`, `/og/kategori/[slug]`, `/og/blog/[slug]`), Türkçe font gömülü
- [x] JSON-LD: OnlineStore (Organization) + WebSite/SearchAction (ana sayfa), Product + Offer + MerchantReturnPolicy (+ shippingDetails yalnızca kargo ücreti tanımlıysa), AggregateRating/Review yalnızca onaylı yorum varsa, BreadcrumbList, CollectionPage + ItemList, BlogPosting, FAQPage yalnızca görünen SSS varsa, VideoObject yalnızca gerçek video varsa
- [x] Dinamik sitemap (+ image sitemap ürün görselleri), `lastModified` gerçek `updatedAt`; demo/noindex hariç
- [x] robots.txt: admin, api, hesap, sepet, ödeme, sipariş, favori, arama hariç; sitemap bildirimi
- [x] Google Merchant feed: `/feeds/google-merchant.xml` (price/sale_price kuralı, gtin/mpn/identifier_exists, availability)
- [x] 301 altyapısı: slug değişince otomatik; Admin › SEO'dan elle; eski Wix URL'leri (`/product-page/…`, `/category/…`, `/blank-*`) otomatik eşleme
- [x] `llms.txt` (marka, kategoriler, ürünler, SSS) — GEO
- [x] Kategori sayfası altı GEO içeriği + SSS (soru-cevap), ana sayfa "merak edilenler" bloğu
- [x] Semantik HTML: tek H1, bölüm başlıkları H2, kart başlıkları H3; breadcrumb nav; `details/summary` ile JS'siz akordeon (içerik ilk HTML'de)
- [x] `htmlLimitedBots: /.*/` → metadata tüm botlara `<head>` içinde
- [x] Var olmayan ürün/kategori/sayfa gerçek 404 döner (soft-404 yok)

## Yayın öncesi yapılacaklar
- [ ] `NEXT_PUBLIC_SITE_URL=https://www.biciriklar.com.tr` ile build
- [ ] Gerçek ürünler: açıklayıcı dosya adlı görseller, alt metin, barkod (GTIN), SKU, yaş aralığı, paket içeriği
- [ ] Kategori görselleri + her kategori için GEO içeriği / SSS (Admin › Kategoriler)
- [ ] Google Search Console + Bing Webmaster: alan doğrulama, sitemap gönderimi
- [ ] Merchant Center: feed URL'si, varsayılan Google ürün kategorisi (Admin › Ayarlar), kargo/iade ayarları
- [ ] Rich Results Test ile Product / Breadcrumb / FAQ doğrulaması (gerçek ürünle)
- [ ] Eski sitedeki ürün URL'leri ile yeni slug'ları karşılaştır; eşleşmeyenleri Admin › SEO › Yönlendirmeler'e ekle
- [ ] Blog: "Keçe dikiş kiti nedir?", "Yaşa göre aktivite seçimi" gibi pillar içerikler
