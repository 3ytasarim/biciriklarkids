import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  link,
  as: Tag = "h2",
  className,
  align = "left",
  id,
}: {
  eyebrow?: string | null;
  title: string;
  description?: string | null;
  link?: { href: string; label: string } | null;
  as?: "h1" | "h2" | "h3";
  className?: string;
  align?: "left" | "center";
  id?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-8 gap-y-4", align === "center" && "flex-col items-center text-center", className)}>
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
        <Tag id={id} className="display-2">{title}</Tag>
        {description ? <p className="lead mt-4">{description}</p> : null}
      </div>
      {link ? (
        <Link href={link.href} className="group inline-flex min-h-11 items-center gap-2 text-[15px] font-extrabold text-ink">
          <span className="link-underline">{link.label}</span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-ink/15 transition-all duration-300 group-hover:border-ink group-hover:bg-ink group-hover:text-white">
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </span>
        </Link>
      ) : null}
    </div>
  );
}
