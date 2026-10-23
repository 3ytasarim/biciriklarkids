import { getSiteSettings } from "@/lib/settings";
import { renderSiteOg } from "@/lib/seo/og";

export const runtime = "nodejs";
export const revalidate = 86400;

export async function GET() {
  const s = await getSiteSettings();
  return renderSiteOg(s.brand.tagline || "Minik Eller İçin Büyük Hayaller");
}
