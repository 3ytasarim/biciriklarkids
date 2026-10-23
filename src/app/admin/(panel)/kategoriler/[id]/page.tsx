import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { isUuid } from "@/lib/admin/form";
import { Flash, PageHeader } from "@/components/admin/ui";
import { categoryOptions } from "../../urunler/data";
import { CategoryForm } from "../CategoryForm";
import { saveCategoryAction } from "../actions";

export const metadata = { title: "Kategoriyi düzenle" };

export default async function EditCategory({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ kaydedildi?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [c] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!c) notFound();
  return (
    <>
      <PageHeader title={c.name} back={{ label: "Kategoriler", href: "/admin/kategoriler" }} />
      <Link href={`/kategori/${c.slug}`} target="_blank" className="mb-6 inline-flex min-h-10 items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 text-sm hover:border-ink">
        <ExternalLink aria-hidden="true" className="h-4 w-4" /> Sitede gör
      </Link>
      <Flash message={(await searchParams).kaydedildi ? "Kategori oluşturuldu." : null} />
      <CategoryForm action={saveCategoryAction.bind(null, c.id)} category={c} parents={await categoryOptions()} />
    </>
  );
}
