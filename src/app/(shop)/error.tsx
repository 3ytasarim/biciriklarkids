"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

export default function ShopError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="shell py-20 text-center sm:py-28">
      <p className="eyebrow mb-4 justify-center">Hata 500</p>
      <h1 className="display-2">Bir şeyler ters gitti</h1>
      <p className="lead mx-auto mt-4 max-w-lg">Sayfa yüklenirken beklenmeyen bir hata oluştu. Lütfen tekrar deneyin; sorun sürerse bizimle iletişime geçin.</p>
      {error.digest ? <p className="mt-3 font-mono text-xs text-muted">Hata kodu: {error.digest}</p> : null}
      <div className="mt-8 flex flex-col justify-center gap-3 min-[420px]:flex-row">
        <button type="button" onClick={reset} className="btn-primary">
          <RotateCcw aria-hidden="true" className="h-4 w-4" /> Tekrar dene
        </button>
        <Link href="/" className="btn-outline">
          Ana sayfaya dön
        </Link>
      </div>
    </div>
  );
}
