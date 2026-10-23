import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, videos } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { isUuid } from "@/lib/admin/form";
import { PageHeader } from "@/components/admin/ui";
import { VideoForm } from "../VideoForm";
import { saveVideoAction } from "../actions";

export const metadata = { title: "Video alanı" };

export default async function EditVideo({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const isNew = id === "yeni";
  if (!isNew && !isUuid(id)) notFound();
  const [v] = isNew ? [] : await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  if (!isNew && !v) notFound();
  const prods = await db.select({ value: products.id, label: products.name }).from(products).orderBy(asc(products.name));
  return (
    <>
      <PageHeader title={isNew ? "Yeni video alanı" : v!.slot} back={{ label: "Videolar", href: "/admin/videolar" }} />
      <VideoForm action={saveVideoAction.bind(null, isNew ? null : v!.id)} video={v ?? null} products={prods} />
    </>
  );
}
