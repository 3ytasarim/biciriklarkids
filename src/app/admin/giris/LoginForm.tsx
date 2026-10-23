"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2, Lock, LogIn, User } from "lucide-react";
import { adminLoginAction, type LoginState } from "./actions";

const field =
  "block min-h-12 w-full rounded-2xl border border-ink/10 bg-white/80 pr-4 pl-11 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink/35 focus:border-brand focus:shadow-[0_0_0_4px_rgb(30_140_245/0.14)]";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(adminLoginAction, {});
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="mt-8 space-y-4" noValidate>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-ink/80">
          Kullanıcı adı veya e-posta
        </label>
        <div className="relative">
          <User aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2 text-ink/40" />
          <input id="email" name="email" type="text" autoCapitalize="none" spellCheck={false} autoComplete="username" defaultValue={state.email} required className={field} />
        </div>
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-bold text-ink/80">
          Şifre
        </label>
        <div className="relative">
          <Lock aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2 text-ink/40" />
          <input id="password" name="password" type={show ? "text" : "password"} autoComplete="current-password" required className={`${field} pr-12`} />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Şifreyi gizle" : "Şifreyi göster"}
            aria-pressed={show}
            className="absolute top-1/2 right-2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-ink/50 hover:bg-white hover:text-ink"
          >
            {show ? <EyeOff aria-hidden="true" className="h-4.5 w-4.5" /> : <Eye aria-hidden="true" className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>
      {state.error ? (
        <p role="alert" className="rounded-xl bg-coral-50 px-3 py-2.5 text-sm font-bold text-coral-ink">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand to-brand-ink text-[15px] font-extrabold text-white shadow-[0_16px_30px_-14px_var(--color-brand)] transition-transform hover:-translate-y-0.5 disabled:opacity-70"
      >
        {pending ? <Loader2 aria-hidden="true" className="h-4.5 w-4.5 animate-spin" /> : <LogIn aria-hidden="true" className="h-4.5 w-4.5" />}
        {pending ? "Giriş yapılıyor…" : "Giriş yap"}
      </button>
    </form>
  );
}
