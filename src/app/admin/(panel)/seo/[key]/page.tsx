import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { seoSettings } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { isStaticPageKey, STATIC_PAGES } from "@/lib/seo/static-pages";
import { PageHeader } from "@/components/admin/ui";
import { SeoPageForm } from "../SeoForms";

export const metadata = { title: "Sayfa SEO" };

export default async function SeoPageEdit({ params }: { params: Promise<{ key: string }> }) {
  await requireAdmin();
  const { key } = await params;
  if (!isStaticPageKey(key)) notFound();
  const [row] = await db.select().from(seoSettings).where(eq(seoSettings.key, key)).limit(1);
  return (
    <>
      <PageHeader title={`SEO: ${STATIC_PAGES[key].label}`} description={STATIC_PAGES[key].path} back={{ label: "SEO", href: "/admin/seo" }} />
      <div className="max-w-3xl">
        <SeoPageForm pageKey={key} row={row ?? null} defaults={STATIC_PAGES[key].defaults} />
      </div>
    </>
  );
}
