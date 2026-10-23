"use client";

import { useState } from "react";
import { Loader2, Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Yorum formu — gönderilen yorum moderasyon kuyruğuna düşer (anında yayınlanmaz). */
export function ReviewForm({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [state, setState] = useState<{ status: "idle" | "loading" | "done" | "error"; message?: string }>({ status: "idle" });

  if (state.status === "done") return <p role="status" className="rounded-md bg-leaf-50 p-4 font-bold text-leaf-ink">{state.message}</p>;
  if (!open)
    return (
      <button type="button" className="btn-outline" onClick={() => setOpen(true)}>
        Yorum yaz
      </button>
    );

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState({ status: "loading" });
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        rating,
        authorName: fd.get("authorName"),
        authorEmail: fd.get("authorEmail"),
        title: fd.get("title") || undefined,
        body: fd.get("body"),
        website: (fd.get("website") as string) || undefined,
      }),
    })
      .then((r) => r.json())
      .catch(() => ({ ok: false, error: "Bağlantı hatası." }));
    setState(res.ok ? { status: "done", message: res.message } : { status: "error", message: res.error });
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4 rounded-lg bg-cream p-5 sm:p-6" noValidate>
      <fieldset>
        <legend className="field-label">Puanınız</legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer p-1" onMouseEnter={() => setHover(n)}>
              <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="peer sr-only" />
              <span className="sr-only">{n} yıldız</span>
              <Star aria-hidden="true" className={cn("h-8 w-8 transition-colors peer-focus-visible:outline-2", (hover || rating) >= n ? "fill-sun stroke-sun" : "stroke-line-strong")} />
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rv-name" className="field-label">Adınız</label>
          <input id="rv-name" name="authorName" required maxLength={80} className="field" autoComplete="given-name" />
        </div>
        <div>
          <label htmlFor="rv-email" className="field-label">E-posta (yayınlanmaz)</label>
          <input id="rv-email" name="authorEmail" type="email" required maxLength={160} className="field" autoComplete="email" />
        </div>
      </div>
      <div>
        <label htmlFor="rv-title" className="field-label">Başlık (isteğe bağlı)</label>
        <input id="rv-title" name="title" maxLength={140} className="field" />
      </div>
      <div>
        <label htmlFor="rv-body" className="field-label">Yorumunuz</label>
        <textarea id="rv-body" name="body" required minLength={10} maxLength={3000} rows={4} className="field py-3" />
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px opacity-0" />
      {state.status === "error" ? <p role="alert" className="text-sm font-bold text-danger">{state.message}</p> : null}
      <p className="text-xs text-muted">Yorumunuz kontrol edildikten sonra yayınlanır. Kişisel verileriniz Aydınlatma Metni kapsamında işlenir.</p>
      <button type="submit" disabled={state.status === "loading"} className="btn-dark">
        {state.status === "loading" ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null} Yorumu gönder
      </button>
    </form>
  );
}
