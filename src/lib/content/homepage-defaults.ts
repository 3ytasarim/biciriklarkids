import type { HomepageSectionConfig } from "@/lib/db/schema";

type SectionType = "hero" | "usp_strip" | "category_discovery" | "product_grid" | "video" | "editorial" | "why_us" | "reviews" | "blog" | "newsletter" | "seo_content";

export type DefaultSection = {
  key: string;
  type: SectionType;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  config: HomepageSectionConfig;
  isActive?: boolean;
};

/**
 * Ana sayfa akışı (dönüşüm sırası). DB'de homepage_sections boşsa bu liste kullanılır; seed de bunu yazar.
 * Admin › Ana Sayfa'dan sıra, başlık, aktiflik ve kaynak değiştirilebilir. Ürün kaynağı boş dönerse bölüm gizlenir.
 */
export const DEFAULT_HOMEPAGE_SECTIONS: DefaultSection[] = [
  { key: "hero", type: "hero", config: {} },
  { key: "usp", type: "usp_strip", config: {} },
  {
    key: "categories",
    type: "category_discovery",
    eyebrow: "Kategoriler",
    title: "Bugün ne üretmek istersiniz?",
    subtitle: "Çanta dikmekten oyuncak doldurmaya, punch’tan ahşap boyamaya: her yaşa ve her merakın bir kiti var.",
    config: { limit: 6 },
  },
  {
    key: "bestsellers",
    type: "product_grid",
    eyebrow: "En çok tercih edilenler",
    title: "En Çok Satanlar",
    config: { source: "bestseller", limit: 8, ctaLabel: "Tümünü gör", ctaUrl: "/en-cok-satanlar" },
  },
  {
    key: "video-lifestyle",
    type: "video",
    eyebrow: "Atölyeden",
    title: "Küçük ellerde büyük işler",
    subtitle: "Bir keçe parçası, bir iğne, biraz sabır… ve ortaya çocuğunuzun kendi elleriyle yaptığı bir eser çıkıyor.",
    config: { slot: "home-lifestyle", tone: "plain" },
  },
  {
    key: "editorial",
    type: "editorial",
    eyebrow: "Neden dikiş?",
    title: "Minik Eller İçin Büyük Hayaller",
    config: {},
  },
  {
    key: "new-arrivals",
    type: "product_grid",
    eyebrow: "Koleksiyona yeni katılanlar",
    title: "Yeni Gelenler",
    config: { source: "new", limit: 4, ctaLabel: "Yeni ürünler", ctaUrl: "/yeni-urunler" },
  },
  {
    key: "video-howto",
    type: "video",
    eyebrow: "Adım adım",
    title: "Ürün nasıl kullanılır?",
    subtitle: "Kutuyu açtığınız andan bitmiş ürüne kadar her adım açık ve takip etmesi kolay.",
    config: { slot: "home-howto", tone: "tinted" },
  },
  { key: "why-us", type: "why_us", eyebrow: "Neden Bıcırıklar Kids?", title: "Çocuklar için düşünülmüş, ebeveynlerin içi rahat", config: {} },
  {
    key: "gifts",
    type: "product_grid",
    eyebrow: "Doğum günü, karne, bayram",
    title: "Hediyelik Seçimler",
    config: { source: "gift", limit: 4, ctaLabel: "Tüm hediyelikler", ctaUrl: "/hediyelik" },
  },
  {
    key: "loved",
    type: "product_grid",
    eyebrow: "Öne çıkanlar",
    title: "Çok Sevilenler",
    config: { source: "featured", limit: 4, ctaLabel: "Tüm ürünler", ctaUrl: "/urunler" },
  },
  {
    key: "educational",
    type: "product_grid",
    eyebrow: "Öğrenirken eğlenmek",
    title: "Eğitici Favoriler",
    config: { source: "category", categoryId: null, limit: 4 },
    isActive: false,
  },
  {
    key: "video-brand",
    type: "video",
    eyebrow: "Bıcırıklar Kids",
    title: "Yaratıcılık için bir masa, birkaç renk, bolca zaman",
    config: { slot: "home-brand", tone: "plain" },
    isActive: false,
  },
  { key: "reviews", type: "reviews", eyebrow: "Ailelerden", title: "Müşteri yorumları", config: { limit: 6 } },
  { key: "blog", type: "blog", eyebrow: "Blog / İlham", title: "Evde yaratıcı aktivite fikirleri", config: { limit: 3, ctaLabel: "Tüm yazılar", ctaUrl: "/blog" } },
  { key: "newsletter", type: "newsletter", title: "Yeni kitlerden ilk siz haberdar olun", subtitle: "Ayda birkaç e-posta; yeni ürünler, aktivite fikirleri ve size özel kampanyalar.", config: {} },
  { key: "seo", type: "seo_content", title: "Bıcırıklar Kids hakkında merak edilenler", config: {} },
];
