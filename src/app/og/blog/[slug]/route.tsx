import { getPostBySlug } from "@/lib/content/queries";
import { renderOg, renderSiteOg } from "@/lib/seo/og";

export const runtime = "nodejs";
export const revalidate = 3600;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const row = await getPostBySlug((await params).slug);
  if (!row) return renderSiteOg("Minik Eller İçin Büyük Hayaller");
  return renderOg({ eyebrow: row.category?.name ?? "Blog / İlham", title: row.post.title, image: row.post.coverImage, tint: "#efecfb" });
}
