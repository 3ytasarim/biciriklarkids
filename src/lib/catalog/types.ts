export type CardImage = { url: string; alt: string; width: number | null; height: number | null };

/** ProductCard'ın ihtiyaç duyduğu minimum veri (liste sorgularının çıktısı, istemciye serileştirilebilir). */
export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  inStock: boolean;
  /** Stok takibi açıksa ve eşik altındaysa gerçek kalan adet; değilse null. */
  lowStock: number | null;
  newProduct: boolean;
  bestseller: boolean;
  giftProduct: boolean;
  isDemo: boolean;
  category: { name: string; slug: string } | null;
  image: CardImage | null;
  hoverImage: CardImage | null;
  ageMin: number | null;
  ageMax: number | null;
  /** Yalnızca onaylı gerçek yorum varsa. */
  rating: { average: number; count: number } | null;
};

export type CategoryNode = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  imageAlt: string | null;
  accent: string;
  showInMenu: boolean;
  sortOrder: number;
  productCount: number;
  children: CategoryNode[];
};

export type SortKey = "onerilen" | "yeni" | "fiyat-artan" | "fiyat-azalan" | "cok-satan";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "onerilen", label: "Önerilen" },
  { value: "yeni", label: "En Yeniler" },
  { value: "fiyat-artan", label: "Fiyat (Artan)" },
  { value: "fiyat-azalan", label: "Fiyat (Azalan)" },
  { value: "cok-satan", label: "Çok Satanlar" },
];

/** Yaş grupları — ürünün yaş aralığı grupla kesişiyorsa eşleşir. */
export const AGE_GROUPS = [
  { value: "3-5", label: "3–5 yaş", min: 3, max: 5 },
  { value: "6-8", label: "6–8 yaş", min: 6, max: 8 },
  { value: "9-12", label: "9–12 yaş", min: 9, max: 12 },
  { value: "12+", label: "12 yaş ve üzeri", min: 12, max: 99 },
] as const;

export type ListingFilters = {
  categoryIds?: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
  ages?: string[];
  types?: string[];
  inStock?: boolean;
  isNew?: boolean;
  onSale?: boolean;
  bestseller?: boolean;
  gift?: boolean;
  featured?: boolean;
  ids?: string[];
  excludeIds?: string[];
};

export const ACCENTS = ["coral", "sun", "leaf", "sky", "berry", "lilac"] as const;
export type Accent = (typeof ACCENTS)[number];
export function toAccent(v: string | null | undefined): Accent {
  return (ACCENTS as readonly string[]).includes(v ?? "") ? (v as Accent) : "coral";
}

export const DIFFICULTY_LABELS = { easy: "Kolay", medium: "Orta", hard: "İleri" } as const;

export function ageLabel(min: number | null, max: number | null): string | null {
  if (min && max) return `${min}–${max} yaş`;
  if (min) return `${min}+ yaş`;
  if (max) return `${max} yaşa kadar`;
  return null;
}
