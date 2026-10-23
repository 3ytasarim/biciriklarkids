import Image from "next/image";
import { count, desc, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { AdminPagination, ListToolbar, PageHeader, pageOf } from "@/components/admin/ui";
import { ConfirmAction } from "@/components/admin/ConfirmAction";
import { MediaUploader, AltEditor } from "./MediaClient";
import { deleteMediaAction } from "./actions";

export const metadata = { title: "Medya" };
const SIZE = 48;

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ q?: string; sayfa?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = pageOf(sp.sayfa);
  const q = sp.q?.trim().slice(0, 80);
  const where = q ? or(ilike(media.originalName, `%${q}%`), ilike(media.alt, `%${q}%`), ilike(media.filename, `%${q}%`)) : undefined;
  const [rows, [{ total }]] = await Promise.all([
    db.select().from(media).where(where).orderBy(desc(media.createdAt)).limit(SIZE).offset((page - 1) * SIZE),
    db.select({ total: count() }).from(media).where(where),
  ]);
  return (
    <>
      <PageHeader title="Medya" description="Görsel adları SEO için otomatik açıklayıcı yapılır (ör. avokado-figurlu-kece-canta-dikis-kiti.webp). Alt metinleri eksiksiz girin." />
      <MediaUploader />
      <ListToolbar q={q} placeholder="Dosya adı veya alt metin…" />
      {rows.length ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {rows.map((m) => (
            <li key={m.id} className="overflow-hidden rounded-md border border-neutral-200 bg-white">
              <div className="relative aspect-square bg-neutral-100">
                {m.mimeType.startsWith("image/") ? (
                  <Image src={m.url} alt={m.alt ?? ""} fill sizes="200px" className="object-cover" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-neutral-500">{m.mimeType}</span>
                )}
              </div>
              <div className="space-y-1 p-2 text-xs">
                <p className="truncate font-bold" title={m.filename}>
                  {m.filename}
                </p>
                <p className="text-neutral-500">
                  {m.width && m.height ? `${m.width}×${m.height} · ` : ""}
                  {Math.round(m.size / 1024)} KB
                </p>
                {m.mimeType.startsWith("image/") ? <AltEditor id={m.id} initial={m.alt ?? ""} /> : null}
                <div className="flex items-center justify-between">
                  <a href={m.url} target="_blank" rel="noreferrer" className="text-neutral-600 underline">
                    Aç
                  </a>
                  <ConfirmAction compact title={`${m.filename} silinsin mi?`} description="Dosya kalıcı olarak silinir. Kullanımdaysa silinmez." action={deleteMediaAction.bind(null, m.id)} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-neutral-300 bg-white px-4 py-14 text-center text-sm text-neutral-500">Henüz dosya yok.</p>
      )}
      <AdminPagination page={page} pages={Math.ceil(Number(total) / SIZE)} params={{ q }} />
    </>
  );
}
