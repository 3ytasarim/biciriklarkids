import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, productImages, products } from "@/lib/db/schema";
import { getSiteSettings } from "@/lib/settings";
import { absoluteUrl } from "@/lib/seo/site";
import { htmlToText } from "@/lib/sanitize";
import { defaultCarrier, shippingRuleFor } from "@/lib/commerce/carriers";

export const revalidate = 3600;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const money = (n: number) => `${n.toFixed(2)} TRY`;

/**
 * Google Merchant Center ürün feed'i (RSS 2.0 + g: ad alanı), sunucuda üretilir.
 * Yalnızca aktif, demo olmayan, görseli olan ürünler. Alanlar: id, title, description, link, image_link,
 * additional_image_link, availability, price, sale_price, brand, condition, gtin, mpn, google_product_category,
 * product_type, identifier_exists, shipping (admin'deki en ucuz kargo firması ya da sabit ücret; eşik üstünde 0).
 */
export async function GET() {
  const settings = await getSiteSettings();
  // Kargo: en ucuz aktif firma, yoksa sabit ücret; eşik üstü ürünlerde 0. Ücret yoksa etiket yazılmaz.
  const ship = shippingRuleFor(settings.shipping, defaultCarrier(settings.shipping));
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      barcode: products.barcode,
      mpn: products.mpn,
      brand: products.brand,
      shortDescription: products.shortDescription,
      description: products.description,
      price: products.price,
      compareAtPrice: products.compareAtPrice,
      stock: products.stock,
      trackStock: products.trackStock,
      condition: products.condition,
      googleProductCategory: products.googleProductCategory,
      productType: products.productType,
      categoryName: categories.name,
      ageMin: products.ageMin,
      weightGrams: products.weightGrams,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.status, "active"), eq(products.isDemo, false), eq(products.noIndex, false)))
    .orderBy(asc(products.name));

  const imgs = rows.length
    ? await db
        .select({ productId: productImages.productId, url: productImages.imageUrl })
        .from(productImages)
        .where(inArray(productImages.productId, rows.map((r) => r.id)))
        .orderBy(desc(productImages.isPrimary), asc(productImages.sortOrder))
    : [];
  const imagesBy = new Map<string, string[]>();
  for (const i of imgs) imagesBy.set(i.productId, [...(imagesBy.get(i.productId) ?? []), i.url]);

  const items = rows
    .filter((r) => r.price > 0 && imagesBy.get(r.id)?.length)
    .map((r) => {
      const images = imagesBy.get(r.id)!;
      const inStock = !r.trackStock || r.stock > 0;
      const onSale = r.compareAtPrice != null && r.compareAtPrice > r.price;
      const gtin = r.barcode?.replace(/\D/g, "") ?? "";
      const validGtin = [8, 12, 13, 14].includes(gtin.length);
      const mpn = r.mpn || r.sku;
      const description = (htmlToText(r.description) || r.shortDescription || r.name).slice(0, 5000);
      const gpc = r.googleProductCategory || settings.commerce.googleProductCategory;
      const tags = [
        `<g:id>${esc(r.sku || r.id)}</g:id>`,
        `<g:title>${esc(r.name.slice(0, 150))}</g:title>`,
        `<g:description>${esc(description)}</g:description>`,
        `<g:link>${esc(absoluteUrl(`/urun/${r.slug}`))}</g:link>`,
        `<g:image_link>${esc(absoluteUrl(images[0]!))}</g:image_link>`,
        ...images.slice(1, 11).map((u) => `<g:additional_image_link>${esc(absoluteUrl(u))}</g:additional_image_link>`),
        `<g:availability>${inStock ? "in_stock" : "out_of_stock"}</g:availability>`,
        // Merchant kuralı: indirim varsa price = normal fiyat, sale_price = indirimli fiyat.
        `<g:price>${money(onSale ? r.compareAtPrice! : r.price)}</g:price>`,
        onSale ? `<g:sale_price>${money(r.price)}</g:sale_price>` : "",
        `<g:brand>${esc(r.brand)}</g:brand>`,
        `<g:condition>${r.condition === "new" ? "new" : "used"}</g:condition>`,
        validGtin ? `<g:gtin>${gtin}</g:gtin>` : "",
        mpn ? `<g:mpn>${esc(mpn)}</g:mpn>` : "",
        !validGtin && !mpn ? "<g:identifier_exists>no</g:identifier_exists>" : "",
        gpc ? `<g:google_product_category>${esc(gpc)}</g:google_product_category>` : "",
        r.categoryName ? `<g:product_type>${esc([r.categoryName, r.productType].filter(Boolean).join(" > "))}</g:product_type>` : "",
        "<g:age_group>kids</g:age_group>",
        r.weightGrams ? `<g:shipping_weight>${r.weightGrams} g</g:shipping_weight>` : "",
        ship.flatFee != null ? `<g:shipping><g:country>TR</g:country><g:price>${money(ship.freeThreshold != null && r.price >= ship.freeThreshold ? 0 : ship.flatFee)}</g:price></g:shipping>` : "",
      ].filter(Boolean);
      return `<item>${tags.join("")}</item>`;
    });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>${esc(settings.brand.name)}</title>
<link>${esc(absoluteUrl("/"))}</link>
<description>${esc(`${settings.brand.name} ürün feed'i`)}</description>
${items.join("\n")}
</channel>
</rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=900, s-maxage=3600", "X-Robots-Tag": "noindex" } });
}
