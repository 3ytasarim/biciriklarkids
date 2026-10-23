import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { Star } from "lucide-react";
import { db } from "@/lib/db";
import { products, reviews } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { formatDateTime } from "@/lib/utils";
import { AdminPagination, Badge, PAGE_SIZE, PageHeader, pageOf } from "@/components/admin/ui";
import { ConfirmAction } from "@/components/admin/ConfirmAction";
import { ReviewActions } from "./ReviewActions";
import { deleteReviewAction, replyReviewAction } from "./actions";

export const metadata = { title: "Yorumlar" };

const TABS = [
  { v: "pending", l: "Bekleyen" },
  { v: "approved", l: "Onaylı" },
  { v: "rejected", l: "Reddedilen" },
] as const;

export default async function ReviewsAdmin({ searchParams }: { searchParams: Promise<{ durum?: string; sayfa?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = (TABS.find((t) => t.v === sp.durum)?.v ?? "pending") as "pending" | "approved" | "rejected";
  const page = pageOf(sp.sayfa);
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({ r: reviews, productName: products.name, productSlug: products.slug })
      .from(reviews)
      .innerJoin(products, eq(reviews.productId, products.id))
      .where(eq(reviews.status, status))
      .orderBy(desc(reviews.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(reviews).where(eq(reviews.status, status)),
  ]);
  return (
    <>
      <PageHeader title="Yorumlar" description="Sitede ve Google'da (Review / AggregateRating) yalnızca onaylanan gerçek yorumlar görünür." />
      <nav className="mb-4 flex gap-2" aria-label="Yorum durumu">
        {TABS.map((t) => (
          <Link
            key={t.v}
            href={`/admin/yorumlar?durum=${t.v}`}
            aria-current={t.v === status ? "page" : undefined}
            className={`inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold ${t.v === status ? "bg-ink text-white" : "bg-white ring-1 ring-neutral-200"}`}
          >
            {t.l}
          </Link>
        ))}
      </nav>
      {rows.length ? (
        <ul className="space-y-3">
          {rows.map(({ r, productName, productSlug }) => (
            <li key={r.id} className="rounded-lg border border-neutral-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex flex-wrap items-center gap-1 text-sm">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} aria-hidden="true" className={`h-4 w-4 ${i < r.rating ? "fill-amber-400 stroke-amber-400" : "stroke-neutral-300"}`} />
                    ))}
                    <span className="ml-2 font-semibold">{r.authorName}</span>
                    <span className="text-neutral-500">· {r.authorEmail}</span>
                    {r.verifiedPurchase ? <Badge tone="green">Doğrulanmış alışveriş</Badge> : null}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    <Link href={`/urun/${productSlug}`} target="_blank" className="underline">
                      {productName}
                    </Link>{" "}
                    · {formatDateTime(r.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ReviewActions id={r.id} status={r.status} />
                  <ConfirmAction compact title="Yorum silinsin mi?" description="Yorum kalıcı olarak silinir." action={deleteReviewAction.bind(null, r.id)} />
                </div>
              </div>
              {r.title ? <p className="mt-3 font-semibold">{r.title}</p> : null}
              <p className="mt-1 text-sm whitespace-pre-line text-neutral-700">{r.body}</p>
              <form action={replyReviewAction.bind(null, r.id)} className="mt-3 flex gap-2">
                <label htmlFor={`reply-${r.id}`} className="sr-only">
                  Yanıt
                </label>
                <input id={`reply-${r.id}`} name="reply" defaultValue={r.adminReply ?? ""} placeholder="Mağaza yanıtı (isteğe bağlı, sitede görünür)" className="min-h-10 flex-1 rounded-sm border border-neutral-300 px-3 text-sm" />
                <button type="submit" className="min-h-10 rounded-full bg-ink px-4 text-sm font-semibold text-white">
                  Kaydet
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-neutral-300 bg-white px-4 py-14 text-center text-sm text-neutral-500">Bu durumda yorum yok.</p>
      )}
      <AdminPagination page={page} pages={Math.ceil(Number(total) / PAGE_SIZE)} params={{ durum: status }} />
    </>
  );
}
