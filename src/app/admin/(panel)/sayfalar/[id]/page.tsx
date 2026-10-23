import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { isUuid } from "@/lib/admin/form";
import { Flash, PageHeader } from "@/components/admin/ui";
import { PageForm } from "../PageForm";
import { savePageAction } from "../actions";

export const metadata = { title: "Sayfa" };

export default async function EditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ kaydedildi?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const isNew = id === "yeni";
  if (!isNew && !isUuid(id)) notFound();
  const [p] = isNew ? [] : await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  if (!isNew && !p) notFound();
  return (
    <>
      <PageHeader title={isNew ? "Yeni sayfa" : p!.title} back={{ label: "Sayfalar", href: "/admin/sayfalar" }} />
      {p?.isActive ? (
        <Link href={`/${p.slug}`} target="_blank" className="mb-6 inline-flex min-h-10 items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 text-sm hover:border-ink">
          <ExternalLink aria-hidden="true" className="h-4 w-4" /> Sitede gör
        </Link>
      ) : null}
      <Flash message={(await searchParams).kaydedildi ? "Sayfa oluşturuldu." : null} />
      <PageForm action={savePageAction.bind(null, isNew ? null : p!.id)} page={p ?? null} />
    </>
  );
}
