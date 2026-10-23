import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { blogCategories, blogPosts } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { isUuid } from "@/lib/admin/form";
import { Flash, PageHeader } from "@/components/admin/ui";
import { PostForm } from "../PostForm";
import { savePostAction } from "../actions";

export const metadata = { title: "Yazı" };

export default async function EditPost({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ kaydedildi?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const isNew = id === "yeni";
  if (!isNew && !isUuid(id)) notFound();
  const [p] = isNew ? [] : await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  if (!isNew && !p) notFound();
  const cats = await db.select({ value: blogCategories.id, label: blogCategories.name }).from(blogCategories).orderBy(asc(blogCategories.sortOrder));
  return (
    <>
      <PageHeader title={isNew ? "Yeni yazı" : p!.title} back={{ label: "Blog", href: "/admin/blog" }} />
      {p?.status === "published" ? (
        <Link href={`/blog/${p.slug}`} target="_blank" className="mb-6 inline-flex min-h-10 items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 text-sm hover:border-ink">
          <ExternalLink aria-hidden="true" className="h-4 w-4" /> Sitede gör
        </Link>
      ) : null}
      <Flash message={(await searchParams).kaydedildi ? "Yazı oluşturuldu." : null} />
      <PostForm action={savePostAction.bind(null, isNew ? null : p!.id)} post={p ?? null} categories={cats} />
    </>
  );
}
