import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { getCategoryTree } from "@/lib/catalog/queries";
import { getSiteSettings } from "@/lib/settings";
import { BRAND_FAQ } from "@/lib/content/brand-faq";
import { absoluteUrl } from "@/lib/seo/site";

export const revalidate = 3600;

/**
 * llms.txt (GEO): yanıt motorlarına markayı, kategorileri ve önemli sayfaları kısa, doğrulanabilir
 * biçimde anlatan düz metin özet. İçerik sitedeki gerçek veriden üretilir.
 */
export async function GET() {
  const [s, tree, prods] = await Promise.all([
    getSiteSettings(),
    getCategoryTree(),
    db
      .select({ name: products.name, slug: products.slug })
      .from(products)
      .where(and(eq(products.status, "active"), eq(products.isDemo, false)))
      .orderBy(asc(products.name))
      .limit(200),
  ]);
  const lines = [
    `# ${s.brand.name}`,
    "",
    `> ${s.brand.name}, çocuklar için keçe çanta ve keçe oyuncak dikiş kitleri, eğitim dikiş setleri, punch (örgü) setleri, ahşap boyama setleri ve eğitici kendin yap (DIY) aktivite kitleri hazırlayan ve satan bir Türk markasıdır. Slogan: "${s.brand.tagline}".`,
    "",
    "## İletişim",
    s.contact.email ? `- E-posta: ${s.contact.email}` : "",
    s.contact.phone ? `- Telefon: ${s.contact.phone}` : "",
    [s.contact.street, s.contact.district, s.contact.city].filter(Boolean).length ? `- Adres: ${[s.contact.street, s.contact.district, s.contact.city].filter(Boolean).join(", ")}` : "",
    "",
    "## Kategoriler",
    ...tree.roots.map((c) => `- [${c.name}](${absoluteUrl(`/kategori/${c.slug}`)})${c.description ? `: ${c.description}` : ""}`),
    "",
    prods.length ? "## Ürünler" : "",
    ...prods.map((p) => `- [${p.name}](${absoluteUrl(`/urun/${p.slug}`)})`),
    "",
    "## Sık sorulan sorular",
    ...BRAND_FAQ.flatMap((f) => [`### ${f.question}`, f.answer, ""]),
    "## Önemli sayfalar",
    `- [Tüm ürünler](${absoluteUrl("/urunler")})`,
    `- [Hakkımızda](${absoluteUrl("/hakkimizda")})`,
    `- [Kargo ve teslimat](${absoluteUrl("/kargo-ve-teslimat")})`,
    `- [İade politikası](${absoluteUrl("/iade-politikasi")}) — teslimden itibaren ${s.commerce.returnDays} gün cayma hakkı`,
    `- [Sıkça sorulan sorular](${absoluteUrl("/sss")})`,
    `- [Blog / İlham](${absoluteUrl("/blog")})`,
  ];
  return new Response(lines.filter((l, i, arr) => !(l === "" && arr[i - 1] === "")).join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
