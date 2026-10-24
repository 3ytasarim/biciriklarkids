import Link from "next/link";
import type { SiteSettings } from "@/lib/settings";

/**
 * İnce kampanya çubuğu — içerik Admin › Ayarlar › Duyuru Çubuğu'ndan; metin yoksa hiç render edilmez.
 * Tek mesaj bile olsa sonsuz kayan şerit: mesajlar şeridi dolduracak kadar tekrarlanır, iki eş yarım
 * kaydırılarak dikişsiz döngü elde edilir. Hover/focus'ta durur; reduced-motion'da ortalı, sabit tek kopya.
 * Ekran okuyucu ve klavye her mesajı yalnızca bir kez görür (tekrarlar gizli ve odaklanamaz).
 */
export function AnnouncementBar({ announcement }: { announcement: SiteSettings["announcement"] }) {
  const items = announcement.items.filter((i) => i.text.trim());
  if (!announcement.enabled || !items.length) return null;

  // Geniş ekranda da boşluk kalmasın diye yarım şerit en az 8 mesaj içerir.
  const repeat = Math.max(1, Math.ceil(8 / items.length));
  const half = Array.from({ length: repeat }, () => items).flat();

  const strip = (key: string, copy: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={copy || undefined} key={key}>
      {half.map((it, i) => {
        const dup = !copy && i >= items.length;
        return (
          <li key={`${key}-${i}`} className="flex items-center" aria-hidden={dup || undefined}>
            {it.href ? (
              <Link href={it.href} tabIndex={copy || dup ? -1 : undefined} className="px-5 underline-offset-4 hover:underline sm:px-7">
                {it.text}
              </Link>
            ) : (
              <span className="px-5 sm:px-7">{it.text}</span>
            )}
            <svg aria-hidden="true" viewBox="0 0 24 24" className="announce-star h-3.5 w-3.5 shrink-0" focusable="false">
              <path fill="currentColor" d="M12 2c.4 4.6 2.4 6.6 7 7-4.6.4-6.6 2.4-7 7-.4-4.6-2.4-6.6-7-7 4.6-.4 6.6-2.4 7-7Z" />
            </svg>
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside aria-label="Duyurular" className="rainbow-bar relative z-50 text-[13px] font-bold tracking-wide text-white">
      <div className="announce-track group flex min-h-9 overflow-hidden py-2 motion-reduce:hidden">
        <div className="flex animate-[marquee_48s_linear_infinite] group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused]" style={{ animationDuration: `${half.length * 6}s` }}>
          {strip("a", false)}
          {strip("b", true)}
        </div>
      </div>
      <p className="hidden min-h-9 items-center justify-center px-4 py-2 text-center motion-reduce:flex">
        {items[0]!.href ? (
          <Link href={items[0]!.href} className="underline-offset-4 hover:underline">
            {items[0]!.text}
          </Link>
        ) : (
          items[0]!.text
        )}
      </p>
    </aside>
  );
}
