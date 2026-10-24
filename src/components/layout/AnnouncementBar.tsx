import Link from "next/link";
import type { SiteSettings } from "@/lib/settings";

/**
 * İnce kampanya çubuğu — içerik Admin › Ayarlar › Duyuru Çubuğu'ndan. Metin yoksa:
 * metin girilmemişse çubuk hiç render edilmez. Birden fazla mesaj varsa yavaş kayan şerit
 * (hover/focus'ta durur, reduced-motion'da sabit).
 */
export function AnnouncementBar({ announcement }: { announcement: SiteSettings["announcement"] }) {
  const items = announcement.items.filter((i) => i.text.trim());
  if (!announcement.enabled || !items.length) return null;

  const content = (key: string, hidden = false) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined} key={key}>
      {items.map((it, i) => (
        <li key={`${key}-${i}`} className="flex items-center">
          {it.href ? (
            <Link href={it.href} tabIndex={hidden ? -1 : undefined} className="px-6 underline-offset-4 hover:underline">
              {it.text}
            </Link>
          ) : (
            <span className="px-6">{it.text}</span>
          )}
          <span aria-hidden="true" className="rainbow-dot h-1.5 w-1.5 rounded-full" />
        </li>
      ))}
    </ul>
  );

  return (
    <aside aria-label="Duyurular" className="rainbow-bar relative z-50 text-[13px] font-bold text-white">
      {items.length === 1 ? (
        <p className="shell flex min-h-9 items-center justify-center py-2 text-center">
          {items[0]!.href ? (
            <Link href={items[0]!.href} className="underline-offset-4 hover:underline">
              {items[0]!.text}
            </Link>
          ) : (
            items[0]!.text
          )}
        </p>
      ) : (
        <div className="group flex min-h-9 overflow-hidden py-2">
          <div className="flex animate-[marquee_38s_linear_infinite] group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused] motion-reduce:animate-none">
            {content("a")}
            {content("b", true)}
          </div>
        </div>
      )}
    </aside>
  );
}
