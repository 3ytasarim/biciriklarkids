import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type Crumb = { name: string; path: string };

/** Görünür breadcrumb (BreadcrumbList şeması sayfada ayrıca JSON-LD olarak verilir). */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Sayfa yolu" className={cn("text-sm text-muted", className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={c.path} className="flex min-w-0 items-center gap-1.5">
              {last ? (
                <span aria-current="page" className="truncate font-semibold text-ink">
                  {c.name}
                </span>
              ) : (
                <>
                  <Link href={c.path} className="link-underline hover:text-ink">
                    {c.name}
                  </Link>
                  <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0 opacity-60" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
