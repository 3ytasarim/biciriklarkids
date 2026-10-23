"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { loginAction, registerAction, type AuthState } from "./actions";

export function AuthForms({ next }: { next: string }) {
  const [login, loginFn, loginPending] = useActionState<AuthState, FormData>(loginAction, {});
  const [reg, regFn, regPending] = useActionState<AuthState, FormData>(registerAction, {});
  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-2">
      <section aria-labelledby="giris" className="rounded-xl bg-cream p-6 sm:p-10">
        <h2 id="giris" className="display-3">
          Giriş yap
        </h2>
        <form action={loginFn} className="mt-6 space-y-4" noValidate>
          <input type="hidden" name="next" value={next} />
          <div>
            <label htmlFor="l-email" className="field-label">
              E-posta
            </label>
            <input id="l-email" name="email" type="email" autoComplete="email" defaultValue={login.email} required className="field" />
          </div>
          <div>
            <label htmlFor="l-pass" className="field-label">
              Şifre
            </label>
            <input id="l-pass" name="password" type="password" autoComplete="current-password" required className="field" />
          </div>
          {login.error ? (
            <p role="alert" className="text-sm font-bold text-danger">
              {login.error}
            </p>
          ) : null}
          <button type="submit" disabled={loginPending} className="btn-dark w-full">
            {loginPending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null} Giriş yap
          </button>
          <p className="text-xs text-muted">Şifrenizi unuttuysanız bize iletişim sayfasından ulaşın. (Şifre sıfırlama e-postası, e-posta altyapısı kurulunca etkinleşecek.)</p>
        </form>
      </section>

      <section aria-labelledby="kayit" className="rounded-xl bg-white p-6 ring-1 ring-line sm:p-10">
        <h2 id="kayit" className="display-3">
          Yeni hesap
        </h2>
        <p className="mt-2 text-sm text-ink-soft">Siparişlerinizi takip edin, adreslerinizi kaydedin. Üye olmadan da sipariş verebilirsiniz.</p>
        <form action={regFn} className="mt-6 space-y-4" noValidate>
          <input type="hidden" name="next" value={next} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="r-first" className="field-label">
                Ad
              </label>
              <input id="r-first" name="firstName" autoComplete="given-name" required className="field" />
            </div>
            <div>
              <label htmlFor="r-last" className="field-label">
                Soyad
              </label>
              <input id="r-last" name="lastName" autoComplete="family-name" required className="field" />
            </div>
          </div>
          <div>
            <label htmlFor="r-email" className="field-label">
              E-posta
            </label>
            <input id="r-email" name="email" type="email" autoComplete="email" defaultValue={reg.email} required className="field" />
          </div>
          <div>
            <label htmlFor="r-pass" className="field-label">
              Şifre (en az 10 karakter)
            </label>
            <input id="r-pass" name="password" type="password" autoComplete="new-password" minLength={10} required className="field" />
          </div>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="kvkk" className="mt-0.5 h-5 w-5 shrink-0 accent-brand-ink" />
            <span>
              <Link href="/kvkk-aydinlatma-metni" target="_blank" className="font-bold underline underline-offset-2">
                KVKK Aydınlatma Metni
              </Link>
              ’ni okudum.
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-ink-soft">
            <input type="checkbox" name="marketing" className="mt-0.5 h-5 w-5 shrink-0 accent-brand-ink" />
            <span>Kampanya ve yeniliklerden e-posta ile haberdar olmak istiyorum (isteğe bağlı).</span>
          </label>
          {reg.error ? (
            <p role="alert" className="text-sm font-bold text-danger">
              {reg.error}
            </p>
          ) : null}
          <button type="submit" disabled={regPending} className="btn-primary w-full">
            {regPending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null} Hesap oluştur
          </button>
        </form>
      </section>
    </div>
  );
}
