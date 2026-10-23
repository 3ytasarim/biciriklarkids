import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

/** Admin sunucu bileşenleri için küçük yapı taşları (sayfa başlığı, araç çubuğu, tablo, rozet, sayfalama). */

export function PageHeader({ title, description, action, back }: { title: string; description?: string; action?: { label: string; href: string }; back?: { label: string; href: string } }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {back ? (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-ink">
            <ChevronLeft aria-hidden="true" className="h-4 w-4" /> {back.label}
          </Link>
        ) : null}
        <h1 className="font-display text-[1.75rem] leading-tight font-extrabold tracking-[-0.015em] text-ink sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1.5 text-sm text-ink/60">{description}</p> : null}
      </div>
      {action ? (
        <Link href={action.href} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand-ink px-5 text-sm font-bold text-white shadow-[0_12px_24px_-12px_var(--color-brand)] transition-transform hover:-translate-y-0.5">
          <Plus aria-hidden="true" className="h-4 w-4" /> {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export function Flash({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="status" className="mb-6 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
      {message}
    </p>
  );
}

/** GET tabanlı arama + filtre formu (sunucuda işlenir; JS gerektirmez). */
export function ListToolbar({
  q,
  placeholder = "Ara…",
  filters = [],
}: {
  q?: string;
  placeholder?: string;
  filters?: { name: string; label: string; value?: string; options: { value: string; label: string }[] }[];
}) {
  return (
    <form method="get" className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-neutral-200 bg-white p-3">
      <div className="relative min-w-48 flex-1">
        <Search aria-hidden="true" className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input name="q" defaultValue={q} placeholder={placeholder} aria-label="Ara" className="block min-h-10 w-full rounded-full border border-neutral-300 pr-3 pl-9 text-sm outline-none focus:border-ink" />
      </div>
      {filters.map((f) => (
        <select key={f.name} name={f.name} defaultValue={f.value ?? ""} aria-label={f.label} className="min-h-10 rounded-full border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-ink">
          <option value="">{f.label}: tümü</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
      <button type="submit" className="min-h-10 rounded-full bg-ink px-4 text-sm font-semibold text-white hover:bg-ink-soft">
        Filtrele
      </button>
    </form>
  );
}

export function Table({ head, children, empty }: { head: string[]; children: React.ReactNode; empty?: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-xs tracking-wide text-neutral-500 uppercase">
          <tr>
            {head.map((h, i) => (
              <th key={`${h}-${i}`} scope="col" className="px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export function EmptyRow({ text, action }: { text: string; action?: { label: string; href: string } }) {
  return (
    <div className="px-4 py-14 text-center">
      <p className="text-sm text-neutral-500">{text}</p>
      {action ? (
        <Link href={action.href} className="mt-4 inline-flex min-h-10 items-center gap-2 bg-ink px-4 text-sm font-semibold text-white">
          <Plus aria-hidden="true" className="h-4 w-4" /> {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "green" | "amber" | "red" | "ember"; children: React.ReactNode }) {
  const cls = {
    neutral: "bg-neutral-100 text-neutral-700",
    green: "bg-emerald-50 text-emerald-800",
    amber: "bg-amber-50 text-amber-800",
    red: "bg-red-50 text-red-800",
    ember: "bg-brand-50 text-brand-ink",
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{children}</span>;
}

export function AdminPagination({ page, pages, params }: { page: number; pages: number; params: Record<string, string | undefined> }) {
  if (pages <= 1) return null;
  const href = (n: number) => {
    const sp = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => Boolean(e[1])));
    if (n > 1) sp.set("sayfa", String(n));
    else sp.delete("sayfa");
    const s = sp.toString();
    return s ? `?${s}` : "?";
  };
  return (
    <nav aria-label="Sayfalama" className="mt-4 flex items-center justify-between text-sm">
      <p className="text-neutral-500">
        Sayfa {page} / {pages}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className="inline-flex min-h-10 items-center gap-1 border border-neutral-300 bg-white px-3 hover:border-ink">
            <ChevronLeft aria-hidden="true" className="h-4 w-4" /> Önceki
          </Link>
        ) : null}
        {page < pages ? (
          <Link href={href(page + 1)} className="inline-flex min-h-10 items-center gap-1 border border-neutral-300 bg-white px-3 hover:border-ink">
            Sonraki <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

export const PAGE_SIZE = 20;

export function pageOf(raw?: string) {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : 1;
}
