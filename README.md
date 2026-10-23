# Bıcırıklar Kids — E-Ticaret

Çocuklar için keçe dikiş kitleri ve eğitici aktivite setleri satan Bıcırıklar Kids'in yeni e-ticaret platformu.
Next.js 16 (App Router, React 19, Server Components) · TypeScript strict · Tailwind CSS 4 · Neon PostgreSQL · Drizzle ORM · Zod · React Hook Form · Radix UI.

## Kurulum

```bash
npm install
cp .env.example .env.local      # DATABASE_URL, DATABASE_URL_DIRECT, NEXT_PUBLIC_SITE_URL, IP_HASH_SALT
npm run db:migrate              # drizzle/ altındaki migration'ları uygular (doğrudan host)
npm run db:seed                 # ayarlar, 7 kategori, yasal sayfalar, ana sayfa bölümleri, video alanları, eski URL 301'leri
npm run admin:create -- eposta@alanadi.com "Ad Soyad"   # ilk yönetici (geçici şifre bir kez ekrana basılır)
npm run dev
```

İsteğe bağlı: `npm run db:seed-demo` → tasarım testi için 12 **DEMO PRODUCT** (illüstrasyon görselli, "DEMO ÜRÜN" etiketli).
Gerçek ürünler eklenince `npm run demo:clear` ile hepsi (görselleriyle) silinir. Demo ürünler sitemap, Merchant feed ve
Product şemasına girmez; sayfaları `noindex`'tir.

| Komut | Açıklama |
|---|---|
| `npm run build` / `start` | Production build / sunucu |
| `npm run typecheck` / `lint` | TypeScript / ESLint |
| `npm run db:generate` | Şema değişikliğinden yeni migration üretir (`src/lib/db/schema`) |
| `npm run db:migrate` | Migration uygular |
| `npm run db:studio` | Drizzle Studio |

> Production'da `NEXT_PUBLIC_SITE_URL` **https** ve gerçek alan adı olmalı (yoksa build bilinçli olarak durur).
> Yerelde production build denemek için: `SITE_URL_ALLOW_INSECURE=1 npm run build`.

## Mimari

```
src/
  app/
    (shop)/          Mağaza: ana sayfa, /urun/[slug], /kategori/[slug], /urunler, koleksiyonlar,
                     /arama, /sepet, /odeme, /siparis/[no], /siparis-takibi, /hesabim, /favoriler,
                     /blog, /sss, /iletisim, /[slug] (yasal + bilgi sayfaları)
    admin/           /admin/giris + (panel)/… tüm yönetim modülleri
    api/             cart, cart/coupon, wishlist, search, products/preview, reviews, newsletter
    og/              Dinamik Open Graph görselleri (site, urun, kategori, blog) — 1200×630
    feeds/google-merchant.xml   Merchant Center feed'i
    sitemap.ts · robots.ts · llms.txt · manifest.ts · uploads/[...path] (Range destekli)
  components/        layout · homepage · product · category · commerce · marketing · video · seo · blog · ui · admin
  lib/
    db/              Drizzle client + şema (catalog, commerce, content, auth, relations)
    catalog/         Ürün/kategori sorguları, filtre parametreleri, arama
    commerce/        Sepet, fiyat hesabı (kuruş), sipariş (transaction + stok kilidi), favoriler
    payments/        Sağlayıcıdan bağımsız ödeme katmanı (bkz. payments/README.md)
    seo/ schema/     Metadata üreticileri, JSON-LD, OG
    analytics/       GA4 e-ticaret olayları (+ Meta Pixel eşleşmesi)
    consent/         KVKK çerez izni
    auth/            Admin + müşteri oturumları (argon2id, httpOnly çerez, DB oturumu)
  proxy.ts           Admin yönlendirmesi, 301/302 tablosu, eski Wix URL'leri
```

### Önemli kararlar
- **SEO kritik sayfalar sunucuda render edilir** (ISR 5 dk + admin kaydında anında yenileme). Sepet/favori/oturum
  verisi istemcide yüklenir → sayfa HTML'i önbelleklenebilir kalır.
- **Fiyat her zaman sunucuda, DB'den hesaplanır.** Sipariş tek transaction'da: ürün satırları `FOR UPDATE` ile
  kilitlenir, stok tekrar doğrulanır, düşülür; kupon kullanımı artırılır.
- **Yalnızca gerçek veri:** yorum/puan yalnızca onaylı gerçek yorumlardan; kampanya, kargo ücreti, sosyal hesaplar,
  analytics ID'leri admin'den girilmezse sitede hiç görünmez.
- **Video alanları:** URL yoksa aynı ölçüde "VideoTest" yer tutucusu (`<VideoPlaceholder label="VideoTest" />`);
  Admin › Videolar'dan URL girildiğinde düzen değişmeden gerçek video oynar (lazy, ekran dışında durur, reduced-motion).
- **Görseller:** yükleme sırasında açıklayıcı dosya adı (`avokado-figurlu-kece-canta-dikis-kiti.webp`), gerçek
  genişlik/yükseklik, zorunlu alt metin. Dosyalar asla üzerine yazılmaz → kalıcı URL.

## Açık işler (dış servis bilgisi gerektiren)

| Konu | Durum |
|---|---|
| Kart ile ödeme (iyzico / PayTR / sanal POS) | Mimari hazır, sağlayıcı yok — `src/lib/payments/README.md` |
| Havale/EFT | Hazır; Admin › Ayarlar'a IBAN girilince açılır |
| E-posta (sipariş onayı, şifre sıfırlama, bülten double opt-in) | `src/lib/email.ts` arayüzü hazır, SMTP/ESP bekleniyor |
| Kargo entegrasyonu | Yok (takip no admin'den elle girilir) |
| Dosya deposu | Yerel disk (`storage/uploads`); Vercel gibi geçici diskli ortamda S3/R2 sürücüsü gerekir |
| GTM / GA4 / Ads / Meta Pixel | ID girilince çerez izniyle yüklenir |
| Yasal metinler | Mevcut siteden aktarıldı; iade kargo ücreti "NETLEŞTİRİLECEK", mesafeli satış/ön bilgilendirme şablon — hukuk onayı gerekli |
| Content-Security-Policy | Nonce tabanlı CSP ayrıca tasarlanmalı |
