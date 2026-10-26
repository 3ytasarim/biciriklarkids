"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, Send, X } from "lucide-react";
import { formatPrice } from "@/lib/commerce/money";

type BotProduct = { slug: string; name: string; price: number; compareAtPrice: number | null; image: string | null; category: string | null; age: string | null };
type Msg = { id: number; from: "bot" | "user"; text: string; products?: BotProduct[]; links?: { label: string; href: string }[]; quick?: string[]; ai?: boolean };

const STORE = "bk_bot_v1";
const AUTO_KEY = "bk_bot_auto";
const SKIP = ["/sepet", "/odeme", "/siparis", "/hesabim", "/giris", "/kayit"];
const WELCOME: Msg = {
  id: 0,
  from: "bot",
  text: "Merhaba! Ben BıcırıklarBot 👋\nÇocuğunuz için etkinlik, ürün, fiyat ya da kargo… Ne merak ediyorsanız sorun, sitedeki bilgilerle hemen yanıtlayayım.",
  quick: ["Boyama setleri", "Kargo ücreti ne kadar?", "3 yaş için ne önerirsin?", "Hediye önerisi", "Siparişim nerede?"],
};

const read = (k: string) => {
  try {
    return window.sessionStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string) => {
  try {
    window.sessionStorage.setItem(k, v);
  } catch {}
};

function BotAvatar({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`relative flex shrink-0 items-center justify-center rounded-full bg-white shadow-[inset_0_-2px_6px_rgb(16_40_74/0.12)] ${className}`}>
      <svg viewBox="0 0 48 48" className="h-[78%] w-[78%]">
        <path d="M12 30h24a7 7 0 0 0 1-13.9A10 10 0 0 0 18.4 13 8 8 0 0 0 12 30Z" fill="#d4eaff" />
        <rect x="11" y="18" width="26" height="18" rx="9" fill="#1e8cf5" />
        <circle cx="19" cy="27" r="3" fill="#fff" />
        <circle cx="29" cy="27" r="3" fill="#fff" />
        <circle cx="19.6" cy="27.4" r="1.4" fill="#10284a" />
        <circle cx="29.6" cy="27.4" r="1.4" fill="#10284a" />
        <path d="M21 32.5c2 1.4 4 1.4 6 0" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M24 18v-4" stroke="#1e8cf5" strokeWidth="2" strokeLinecap="round" />
        <circle cx="24" cy="12.5" r="2.4" fill="#f6b73c" />
      </svg>
    </span>
  );
}

/**
 * BıcırıklarBot: sağ altta mağaza asistanı. Masaüstünde oturum başına bir kez kendiliğinden açılır; mobilde
 * yalnızca küçük bir karşılama balonu gösterir. Yanıtlar /api/asistan'dan (sitenin gerçek verisi) gelir.
 */
export function AssistantWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const nextId = useRef(1);
  const skip = SKIP.some((p) => pathname === p || pathname.startsWith(p + "/"));

  // Oturum içi sohbeti geri yükle
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        const saved = JSON.parse(read(STORE) ?? "null") as Msg[] | null;
        if (saved?.length) {
          setMsgs(saved);
          nextId.current = Math.max(...saved.map((m) => m.id)) + 1;
        }
      } catch {}
    }, 0);
    return () => window.clearTimeout(t);
  }, []);
  useEffect(() => {
    if (msgs.length > 1) write(STORE, JSON.stringify(msgs.slice(-30)));
  }, [msgs]);

  // Kendiliğinden açılma (oturumda bir kez; ödeme akışında ve başka pencere açıkken değil)
  useEffect(() => {
    if (skip || read(AUTO_KEY)) return;
    const desktop = window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches;
    let tries = 0;
    let timer = 0;
    const attempt = () => {
      if (document.querySelector("dialog[open]") && tries++ < 6) {
        timer = window.setTimeout(attempt, 5000);
        return;
      }
      write(AUTO_KEY, "1");
      if (desktop) setOpen(true);
      else {
        setTeaser(true);
        timer = window.setTimeout(() => setTeaser(false), 9000);
      }
    };
    timer = window.setTimeout(attempt, desktop ? 7000 : 9000);
    return () => window.clearTimeout(timer);
  }, [skip]);

  const close = useCallback(() => {
    setOpen(false);
    launcherRef.current?.focus({ preventScroll: true });
  }, []);
  const openPanel = () => {
    setTeaser(false);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  const ask = async (text: string) => {
    const q = text.trim().slice(0, 300);
    if (!q || busy) return;
    setInput("");
    // Bağlam için son birkaç mesaj (karşılama hariç)
    const history = msgs
      .filter((m) => m.id !== 0)
      .slice(-6)
      .map((m) => ({ role: m.from === "user" ? ("user" as const) : ("assistant" as const), text: m.text.slice(0, 1200) }));
    setMsgs((m) => [...m, { id: nextId.current++, from: "user", text: q }]);
    setBusy(true);
    try {
      const res = await fetch("/api/asistan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: q, history }) });
      const data = (await res.json()) as Omit<Msg, "id" | "from">;
      setMsgs((m) => [...m, { id: nextId.current++, from: "bot", text: data.text ?? "Bir sorun oluştu.", products: data.products, links: data.links, quick: data.quick, ai: data.ai }]);
    } catch {
      setMsgs((m) => [...m, { id: nextId.current++, from: "bot", text: "Bağlantı kurulamadı. Lütfen tekrar deneyin." }]);
    } finally {
      setBusy(false);
    }
  };

  if (skip && !open) return null;
  const lastQuick = [...msgs].reverse().find((m) => m.from === "bot")?.quick;

  return (
    <div className="bot-root fixed right-4 bottom-4 z-[70] flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      {open ? (
        <section role="dialog" aria-label="BıcırıklarBot — mağaza asistanı" className="bot-panel flex flex-col overflow-hidden">
          <header className="flex items-center gap-3 bg-[linear-gradient(135deg,#1e8cf5,#0067d1_60%,#0a4fa8)] px-4 py-3.5 text-white">
            <BotAvatar />
            <div className="min-w-0 flex-1">
              <p className="font-display text-[17px] leading-tight font-extrabold">BıcırıklarBot</p>
              <p className="flex items-center gap-1.5 text-xs text-white/85">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_8px_rgb(110_231_183)]" /> Otomatik mağaza asistanı
              </p>
            </div>
            <button type="button" onClick={close} aria-label="Asistanı kapat" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/15">
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </header>

          <div ref={listRef} aria-live="polite" className="flex-1 space-y-3 overflow-y-auto overscroll-contain bg-[linear-gradient(180deg,#f1f7fd,#fbfdff)] px-3.5 py-4">
            {msgs.map((m) =>
              m.from === "user" ? (
                <p key={m.id} className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-brand-ink px-3.5 py-2.5 text-[14px] leading-relaxed whitespace-pre-line text-white">
                  {m.text}
                </p>
              ) : (
                <div key={m.id} className="flex items-start gap-2">
                  <BotAvatar className="mt-0.5 h-7 w-7" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="w-fit max-w-full rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 text-[14px] leading-relaxed whitespace-pre-line text-ink shadow-[0_6px_16px_-10px_rgb(16_40_74/0.35)]">{m.text}</p>
                    {m.ai ? <p className="text-[11px] text-muted">Yapay zekâ ile oluşturuldu · bilgiler sitedeki ürünlerden</p> : null}
                    {m.products?.length ? (
                      <ul className="space-y-2">
                        {m.products.map((p) => (
                          <li key={p.slug}>
                            <Link href={`/urun/${p.slug}`} className="group flex items-center gap-3 rounded-xl bg-white p-2 pr-3 shadow-[0_6px_16px_-10px_rgb(16_40_74/0.35)] transition-transform hover:-translate-y-0.5">
                              <span className="shot relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                                {p.image ? <Image src={p.image} alt="" fill sizes="56px" className="object-contain mix-blend-multiply" /> : null}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="line-clamp-2 text-[13px] leading-snug font-bold text-ink group-hover:text-brand-ink">{p.name}</span>
                                <span className="mt-0.5 flex items-baseline gap-1.5 text-[13px]">
                                  {p.price > 0 ? (
                                    <>
                                      <strong className={p.compareAtPrice && p.compareAtPrice > p.price ? "text-coral-ink" : "text-ink"}>{formatPrice(p.price)}</strong>
                                      {p.compareAtPrice && p.compareAtPrice > p.price ? <s className="text-xs text-muted">{formatPrice(p.compareAtPrice)}</s> : null}
                                    </>
                                  ) : (
                                    <span className="text-muted">Fiyat yakında</span>
                                  )}
                                  {p.age ? <span className="ml-auto rounded-full bg-sky-50 px-1.5 text-[11px] font-semibold text-sky-ink">{p.age}</span> : null}
                                </span>
                              </span>
                              <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {m.links?.length ? (
                      <p className="flex flex-wrap gap-2">
                        {m.links.map((l) => (
                          <Link key={l.href} href={l.href} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-brand/25 bg-white px-3 text-[13px] font-bold text-brand-ink hover:border-brand">
                            {l.label} <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
                          </Link>
                        ))}
                      </p>
                    ) : null}
                  </div>
                </div>
              ),
            )}
            {busy ? (
              <div className="flex items-center gap-2" aria-label="Yanıt yazılıyor">
                <BotAvatar className="h-7 w-7" />
                <span className="bot-typing flex gap-1 rounded-2xl bg-white px-3.5 py-3 shadow-[0_6px_16px_-10px_rgb(16_40_74/0.35)]">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            ) : null}
          </div>

          {lastQuick?.length && !busy ? (
            <div className="flex gap-2 overflow-x-auto border-t border-line bg-white px-3 py-2.5 [scrollbar-width:none]">
              {lastQuick.map((q) => (
                <button key={q} type="button" onClick={() => ask(q)} className="min-h-9 shrink-0 rounded-full bg-sky-50 px-3 text-[13px] font-semibold whitespace-nowrap text-sky-ink hover:bg-sky-100">
                  {q}
                </button>
              ))}
            </div>
          ) : null}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void ask(input);
            }}
            className="flex items-center gap-2 border-t border-line bg-white p-2.5"
          >
            <label htmlFor="bot-input" className="sr-only">
              Mesajınız
            </label>
            <input
              id="bot-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={300}
              autoComplete="off"
              placeholder="Örn. boyama seti arıyorum"
              className="min-h-11 min-w-0 flex-1 rounded-full border border-line-strong bg-cream px-4 text-[15px] outline-none focus:border-brand focus:bg-white"
            />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Gönder" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1e8cf5,#0067d1)] text-white disabled:opacity-50">
              <Send aria-hidden="true" className="h-4.5 w-4.5" />
            </button>
          </form>
        </section>
      ) : null}

      {!open && teaser ? (
        <button type="button" onClick={openPanel} className="bot-teaser max-w-[240px] rounded-2xl rounded-br-md bg-white px-4 py-3 text-left text-sm font-semibold text-ink shadow-[0_16px_36px_-16px_rgb(16_40_74/0.55)]">
          Merhaba! 👋 Ürün veya etkinlik arıyorsanız yardımcı olabilirim.
        </button>
      ) : null}

      {!open ? (
        <button
          ref={launcherRef}
          type="button"
          onClick={openPanel}
          aria-label="BıcırıklarBot asistanını aç"
          className="bot-launcher relative flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1e8cf5,#0067d1_60%,#0a4fa8)] shadow-[0_18px_36px_-14px_rgb(0_103_209/0.9)] transition-transform hover:scale-105"
        >
          <BotAvatar className="h-12 w-12" />
          <span aria-hidden="true" className="absolute top-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
        </button>
      ) : null}
    </div>
  );
}
