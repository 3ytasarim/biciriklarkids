"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

/** Bülten formu — açık rıza onay kutusu zorunlu (KVKK / Ticari Elektronik İleti). */
export function NewsletterForm({ source = "footer", tone = "light", className }: { source?: string; tone?: "light" | "dark"; className?: string }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<{ status: "idle" | "loading" | "done" | "error"; message?: string }>({ status: "idle" });
  const dark = tone === "dark";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!consent) return setState({ status: "error", message: "Devam etmek için onay kutusunu işaretleyin." });
    setState({ status: "loading" });
    const hp = (new FormData(e.currentTarget).get("website") as string) || undefined;
    const res = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, consent: true, source, website: hp }) })
      .then((r) => r.json())
      .catch(() => ({ ok: false, error: "Bağlantı hatası." }));
    if (res.ok) {
      setState({ status: "done", message: res.message });
      trackEvent("newsletter_signup", { source });
    } else setState({ status: "error", message: res.error });
  }

  if (state.status === "done") {
    return (
      <p role="status" className={cn("flex items-center gap-3 rounded-md px-4 py-4 font-bold", dark ? "bg-white/10 text-white" : "bg-leaf-50 text-leaf-ink", className)}>
        <Check aria-hidden="true" className="h-5 w-5" /> {state.message}
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate className={className}>
      <label htmlFor={`${id}-email`} className="sr-only">
        E-posta adresiniz
      </label>
      <div className={cn("flex gap-2 rounded-full p-1.5", dark ? "bg-white/10 ring-1 ring-white/20" : "bg-white ring-[1.5px] ring-line-strong")}>
        <input
          id={`${id}-email`}
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-posta adresiniz"
          aria-invalid={state.status === "error" || undefined}
          aria-describedby={state.status === "error" ? `${id}-err` : undefined}
          className={cn("min-w-0 flex-1 bg-transparent px-4 text-[16px] outline-none", dark ? "text-white placeholder:text-white/60" : "text-ink placeholder:text-muted")}
        />
        <button type="submit" disabled={state.status === "loading"} className={cn("btn min-h-11 shrink-0 px-5", dark ? "bg-sun text-ink hover:bg-white" : "bg-ink text-white hover:bg-brand-ink")}>
          {state.status === "loading" ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <ArrowRight aria-hidden="true" className="h-4 w-4" />}
          <span className="max-[380px]:sr-only">Abone Ol</span>
        </button>
      </div>
      {/* bal küpü: ekran okuyucudan ve görünümden gizli */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px opacity-0" />
      <div className="mt-3 flex items-start gap-2.5">
        <input id={`${id}-consent`} type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className={cn("mt-0.5 h-5 w-5 shrink-0 rounded", dark ? "accent-sun" : "accent-brand-ink")} />
        <label htmlFor={`${id}-consent`} className={cn("text-xs leading-relaxed", dark ? "text-white/75" : "text-ink-soft")}>
          Kampanya ve yeniliklerden e-posta ile haberdar olmak istiyorum.{" "}
          <Link href="/kvkk-aydinlatma-metni" className="font-bold underline underline-offset-2">
            Aydınlatma Metni
          </Link>
          ’ni okudum.
        </label>
      </div>
      {state.status === "error" ? (
        <p id={`${id}-err`} role="alert" className={cn("mt-2 text-sm font-bold", dark ? "text-sun" : "text-danger")}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
