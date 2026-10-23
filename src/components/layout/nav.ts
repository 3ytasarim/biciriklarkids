/** Header/menü için serileştirilebilir kategori verisi (sunucudan istemciye). */
export type NavCategory = {
  name: string;
  slug: string;
  accent: string;
  image: string | null;
  imageAlt: string | null;
  productCount: number;
  children: { name: string; slug: string }[];
};

export const MAIN_NAV = [
  { label: "Ürünler", href: "/urunler" },
  { label: "Kategoriler", href: "/kategoriler", mega: true },
  { label: "En Çok Satanlar", href: "/en-cok-satanlar" },
  { label: "Yeni Ürünler", href: "/yeni-urunler" },
  { label: "Hakkımızda", href: "/hakkimizda", wide: true },
  { label: "Blog / İlham", href: "/blog" },
] as const;
