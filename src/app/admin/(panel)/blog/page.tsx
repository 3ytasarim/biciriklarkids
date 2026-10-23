import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { blogCategories, blogPosts } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { formatDate } from "@/lib/utils";
import { Badge, EmptyRow, PageHeader, Table } from "@/components/admin/ui";
import { ConfirmAction } from "@/components/admin/ConfirmAction";
import { BlogCategoryForm } from "./BlogCategoryForm";
import { deleteBlogCategoryAction, deletePostAction } from "./actions";

export const metadata = { title: "Blog" };

export default async function BlogAdmin() {
  await requireAdmin();
  const [posts, cats] = await Promise.all([
    db.select({ p: blogPosts, cat: blogCategories.name }).from(blogPosts).leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id)).orderBy(desc(blogPosts.updatedAt)),
    db.select().from(blogCategories).orderBy(asc(blogCategories.sortOrder), asc(blogCategories.name)),
  ]);
  const now = new Date();
  return (
    <>
      <PageHeader title="Blog / İlham" description="SEO ve GEO için rehber içerikler: soru-cevap biçimli, kısa paragraflı, gerçek bilgiye dayalı." action={{ label: "Yeni yazı", href: "/admin/blog/yeni" }} />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Table head={["Başlık", "Kategori", "Durum", "Yayın", ""]} empty={posts.length ? null : <EmptyRow text="Henüz yazı yok." action={{ label: "Yeni yazı", href: "/admin/blog/yeni" }} />}>
          {posts.map(({ p, cat }) => (
            <tr key={p.id} className="hover:bg-neutral-50">
              <td className="px-4 py-3">
                <Link href={`/admin/blog/${p.id}`} className="font-semibold hover:underline">
                  {p.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-neutral-600">{cat ?? "—"}</td>
              <td className="px-4 py-3">{p.status === "published" ? p.publishedAt && p.publishedAt > now ? <Badge tone="amber">Zamanlandı</Badge> : <Badge tone="green">Yayında</Badge> : <Badge>Taslak</Badge>}</td>
              <td className="px-4 py-3 text-neutral-600">{p.publishedAt ? formatDate(p.publishedAt) : "—"}</td>
              <td className="px-2 py-3 text-right">
                <ConfirmAction compact title={`“${p.title}” silinsin mi?`} description="Yazı kalıcı olarak silinir." action={deletePostAction.bind(null, p.id)} />
              </td>
            </tr>
          ))}
        </Table>
        <section className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="font-semibold">Blog kategorileri</h2>
          <ul className="mt-3 divide-y divide-neutral-100">
            {cats.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {c.name} <span className="text-xs text-neutral-500">/{c.slug}</span>
                </span>
                <ConfirmAction compact title={`${c.name} silinsin mi?`} description="Yazılar kategorisiz kalır." action={deleteBlogCategoryAction.bind(null, c.id)} />
              </li>
            ))}
          </ul>
          <BlogCategoryForm />
        </section>
      </div>
    </>
  );
}
