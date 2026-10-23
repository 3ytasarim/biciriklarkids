/**
 * Admin › SEO'da yönetilen statik sayfalar. `defaults`, admin alanları boşken kullanılan otomatik SEO'dur —
 * sayfa hiçbir zaman SEO'suz kalmaz. Başlıklar markayı içerir (withBrand tekrar eklemez).
 */
export const STATIC_PAGES = {
  home: {
    label: "Ana Sayfa",
    path: "/",
    defaults: {
      title: "Çocuklar İçin Keçe Dikiş Kitleri | Bıcırıklar Kids",
      description:
        "Keçe çanta ve oyuncak dikiş kitleri, punch ve boyama setleri. Bıcırıklar Kids ile çocuklar kendi oyuncağını kendi elleriyle üretmenin mutluluğunu yaşar.",
    },
  },
  products: {
    label: "Tüm Ürünler",
    path: "/urunler",
    defaults: {
      title: "Tüm Ürünler | Çocuk DIY ve Eğitici Aktivite Kitleri | Bıcırıklar Kids",
      description: "Bıcırıklar Kids'in tüm keçe dikiş kitleri, eğitici aktivite ve kendin yap setleri. Yaş grubuna ve kategoriye göre filtreleyin.",
    },
  },
  categories: {
    label: "Kategoriler",
    path: "/kategoriler",
    defaults: {
      title: "Kategoriler | Bıcırıklar Kids",
      description: "Keçe çanta dikiş kitleri, keçe oyuncak kitleri, eğitim dikiş setleri, punch ve boyama setleri: tüm Bıcırıklar Kids kategorileri.",
    },
  },
  bestsellers: {
    label: "En Çok Satanlar",
    path: "/en-cok-satanlar",
    defaults: {
      title: "En Çok Satanlar | Bıcırıklar Kids",
      description: "Bıcırıklar Kids'in en çok tercih edilen keçe dikiş kitleri ve eğitici aktivite setleri.",
    },
  },
  newArrivals: {
    label: "Yeni Ürünler",
    path: "/yeni-urunler",
    defaults: {
      title: "Yeni Ürünler | Bıcırıklar Kids",
      description: "Bıcırıklar Kids koleksiyonuna yeni eklenen dikiş kitleri ve yaratıcı aktivite setleri.",
    },
  },
  gifts: {
    label: "Hediyelik Ürünler",
    path: "/hediyelik",
    defaults: {
      title: "Çocuklar İçin Hediyelik Aktivite Setleri | Bıcırıklar Kids",
      description: "Doğum günü ve özel günler için hediye etmeye hazır, eğlenceli ve eğitici çocuk aktivite kitleri.",
    },
  },
  sale: {
    label: "İndirimli Ürünler",
    path: "/indirimli-urunler",
    defaults: {
      title: "İndirimli Ürünler | Bıcırıklar Kids",
      description: "İndirimdeki Bıcırıklar Kids keçe çanta ve oyuncak dikiş kitleri, punch ve boyama setleri. Kampanyalı ürünleri yaş grubuna ve kategoriye göre filtreleyin.",
    },
  },
  blog: {
    label: "Blog / İlham",
    path: "/blog",
    defaults: {
      title: "İlham ve Rehberler | Bıcırıklar Kids Blog",
      description: "Çocuklarla yaratıcı aktivite fikirleri, dikiş kiti kullanım rehberleri ve yaşa göre aktivite seçimi üzerine içerikler.",
    },
  },
  contact: {
    label: "İletişim",
    path: "/iletisim",
    defaults: {
      title: "İletişim | Bıcırıklar Kids",
      description: "Siparişleriniz, ürünlerimiz ve toplu alımlar için Bıcırıklar Kids ile iletişime geçin.",
    },
  },
  faq: {
    label: "Sıkça Sorulan Sorular",
    path: "/sss",
    defaults: {
      title: "Sıkça Sorulan Sorular | Bıcırıklar Kids",
      description: "Sipariş, kargo, iade ve dikiş kitlerinin kullanımı hakkında sıkça sorulan sorular.",
    },
  },
} as const;

export type StaticPageKey = keyof typeof STATIC_PAGES;
export const STATIC_PAGE_KEYS = Object.keys(STATIC_PAGES) as StaticPageKey[];
export function isStaticPageKey(key: string): key is StaticPageKey {
  return key in STATIC_PAGES;
}
