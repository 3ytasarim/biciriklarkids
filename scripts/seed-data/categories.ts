import type { FaqItem } from "../../src/lib/db/schema";

/**
 * Başlangıç kategorileri (ana ürün grupları). Açıklamalar GEO odaklı: kısa, doğrulanabilir, soru-cevaba uygun.
 * Ürün özellikleri yalnızca mevcut sitede yazan bilgilerle sınırlıdır. Görseller admin'den yüklenecek.
 */
export type SeedCategory = { name: string; slug: string; accent: string; sortOrder: number; description: string; content?: string; faq?: FaqItem[]; seoTitle?: string; seoDescription?: string };

export const SEED_CATEGORIES: SeedCategory[] = [
  {
    name: "Keçe Çanta Dikiş Kitleri",
    slug: "kece-canta-dikis-kitleri",
    accent: "coral",
    sortOrder: 1,
    description: "Çocukların kendi keçe çantalarını adım adım dikerek tamamladığı figürlü çanta kitleri. Hazır keçe parçalar, plastik güvenli iğne ve dikiş ipi kutuda.",
    seoTitle: "Keçe Çanta Dikiş Kitleri | Çocuklar İçin DIY Çanta Seti",
    content: [
      "<h2>Keçe çanta dikiş kiti nedir?</h2>",
      "<p>Keçe çanta dikiş kiti, çocuğun hazır keçe parçalarını birbirine dikerek kendi çantasını oluşturduğu bir kendin yap (DIY) setidir. Çantanın ön yüzünde avokado, fil, kedi, roket gibi figürler yer alır; çocuk hem dikişi hem de figürün yerleşimini kendisi tamamlar.</p>",
      "<h2>Kutunun içinde neler var?</h2>",
      "<ul><li>Çanta için keçe parçalar</li><li>1 adet plastik güvenli iğne</li><li>Dikiş ipi (ihtiyaçtan fazla konur)</li></ul>",
      "<p>Kitlerin ana parçaları 3 mm, aksesuar parçaları 1 mm kalınlığında birinci kalite keçeden hazırlanır.</p>",
      "<h2>Nasıl kullanılır?</h2>",
      "<p>Önce figür parçaları çantanın ön yüzüne dikilir, ardından ön ve arka yüz kenar boyunca birleştirilir ve sap takılır. Her ilmek bir sonrakine hazırlık olduğu için ilk kez dikiş yapan çocuklar için de uygun bir başlangıçtır.</p>",
    ].join(""),
    faq: [
      { question: "Keçe çanta kiti kaç yaş için uygundur?", answer: "Önerilen yaş aralığı her ürünün sayfasında belirtilir. Küçük yaşlarda bir yetişkin eşliğinde yapılması önerilir." },
      { question: "Dikiş için makas veya makine gerekir mi?", answer: "Hayır. Kitler plastik güvenli iğne ve dikiş ipi ile tamamlanır; ipi kesmek için bir yetişkin yardımı yeterlidir." },
    ],
  },
  {
    name: "Keçe Oyuncak Dikiş Kitleri",
    slug: "kece-oyuncak-dikis-kitleri",
    accent: "sun",
    sortOrder: 2,
    description: "Figürlü, elyaf dolgulu keçe oyuncak kitleri: parçaları dik, elyafı doldur, kendi yumuşak oyuncağını yap. Deniz ve kara hayvanları figürleri.",
    seoTitle: "Figürlü Elyaf Dolgulu Keçe Oyuncak Dikiş Kitleri",
    content: [
      "<h2>Keçe oyuncak kiti nedir?</h2>",
      "<p>Keçe oyuncak kiti, figür şeklinde hazırlanmış keçe parçalarının dikilip içine elyaf dolgu konularak yumuşak bir oyuncağa dönüştürüldüğü bir settir. Zürafa, panda, kaplumbağa, denizyıldızı gibi figürler hem tekli hem de 4’lü ve 8’li setler halinde sunulur.</p>",
      "<h2>Nasıl yapılır?</h2>",
      "<p>Figürün iki yüzü üst üste getirilir ve kenarlar dikilir; küçük bir açıklık bırakılarak elyaf doldurulur ve açıklık kapatılır. Ortaya çocuğun oynayabileceği, kendi yaptığı bir oyuncak çıkar.</p>",
    ].join(""),
  },
  {
    name: "Eğitim Dikiş Setleri",
    slug: "egitim-dikis-setleri",
    accent: "sky",
    sortOrder: 3,
    description: "Birden fazla kitin bir arada sunulduğu, dikişe adım adım alışmak için hazırlanmış çoklu eğitim setleri.",
  },
  {
    name: "Punch / Örgü Setleri",
    slug: "punch-orgu-setleri",
    accent: "berry",
    sortOrder: 4,
    description: "Keçe üzerine punch tekniğiyle desen işlenen, farklı bir doku deneyimi sunan örgü setleri.",
  },
  {
    name: "Ahşap Boyama Setleri",
    slug: "ahsap-boyama-setleri",
    accent: "leaf",
    sortOrder: 5,
    description: "Ahşap figürlerin çocuk tarafından renklendirildiği boyama setleri: unicorn, orman hayvanları ve daha fazlası.",
  },
  {
    name: "Eğitici Aktivite Kitleri",
    slug: "egitici-aktivite-kitleri",
    accent: "lilac",
    sortOrder: 6,
    description: "Haftanın günleri, İngilizce kelimeler ve bayrak gibi temalarla oyun ile öğrenmeyi birleştiren eğitici keçe kitleri.",
  },
  {
    name: "DIY / Kendin Yap Setleri",
    slug: "kendin-yap-setleri",
    accent: "coral",
    sortOrder: 7,
    description: "Gece lambası gibi kullanılabilir objeleri çocuğun kendi elleriyle yaptığı kendin yap (DIY) setleri.",
  },
];
