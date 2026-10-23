import { getCategoryBySlug, getCategoryTree } from "@/lib/catalog/queries";
import { renderOg, renderSiteOg } from "@/lib/seo/og";

export const runtime = "nodejs";
export const revalidate = 3600;

const TINT: Record<string, string> = { coral: "#fdede9", sun: "#fef4dc", leaf: "#e7f4ed", sky: "#e5f1fb", berry: "#fce9f1", lilac: "#efecfb" };

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const c = await getCategoryBySlug((await params).slug);
  if (!c) return renderSiteOg("Minik Eller İçin Büyük Hayaller");
  const node = (await getCategoryTree()).byId.get(c.id);
  return renderOg({
    eyebrow: node?.productCount ? `${node.productCount} ürün` : "Kategori",
    title: c.name,
    subtitle: c.description && c.description.length < 120 ? c.description : "Eğitici çocuk aktivite kitleri",
    image: c.image,
    tint: TINT[c.accent] ?? TINT.coral,
  });
}
