import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Package, Receipt, Ticket } from "lucide-react";
import { getAdminUser } from "@/lib/auth/admin";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Giriş" };
export const dynamic = "force-dynamic";

const HIGHLIGHTS = [
  { icon: Receipt, text: "Siparişler ve ödemeler" },
  { icon: Package, text: "Ürünler, fiyatlar, stok" },
  { icon: Ticket, text: "Kuponlar ve kampanyalar" },
];

/** Yönetim girişi — açık glass tema (arka plan: app/admin/layout.tsx › GlassBackdrop). */
export default async function AdminLoginPage() {
  if (await getAdminUser()) redirect("/admin");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="glass-panel w-full max-w-[440px] rounded-[32px] p-7 sm:p-10">
        <div className="flex flex-col items-center text-center">
          <Image src="/brand/biciriklar-logo.webp" alt="Bıcırıklar Kids" width={600} height={189} priority className="h-16 w-auto drop-shadow-[0_10px_20px_rgb(0_103_209/0.18)] sm:h-[72px]" />
          <span className="mt-4 rounded-full bg-white/70 px-3 py-1 text-[11px] font-extrabold tracking-[0.18em] text-brand-ink uppercase ring-1 ring-white">Yönetim paneli</span>
          <h1 className="mt-5 font-display text-[1.7rem] leading-tight font-extrabold tracking-[-0.015em] text-ink">Tekrar hoş geldiniz</h1>
          <p className="mt-1.5 text-sm text-ink/60">Mağazanızı yönetmek için giriş yapın.</p>
        </div>

        <LoginForm />

        <ul className="mt-8 grid grid-cols-3 gap-2 border-t border-ink/8 pt-6">
          {HIGHLIGHTS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex flex-col items-center gap-2 text-center text-[11px] leading-snug font-semibold text-ink/60">
              <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-brand-ink ring-1 ring-white">
                <Icon className="h-4 w-4" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>
      <Link href="/" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 transition-colors hover:text-brand-ink">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Mağazaya dön
      </Link>
    </div>
  );
}
