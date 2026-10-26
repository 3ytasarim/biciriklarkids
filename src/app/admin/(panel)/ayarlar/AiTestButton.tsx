"use client";

import { useState, useTransition } from "react";
import { Loader2, Zap } from "lucide-react";
import { testAiAction } from "./ai-actions";

export function AiTestButton() {
  const [pending, start] = useTransition();
  const [res, setRes] = useState<{ ok: boolean; message: string } | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => setRes(await testAiAction()))}
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-neutral-300 px-4 text-sm font-semibold text-ink hover:border-ink disabled:opacity-60"
      >
        {pending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Zap aria-hidden="true" className="h-4 w-4" />}
        Bağlantıyı test et
      </button>
      {res ? (
        <span role="status" className={`text-sm ${res.ok ? "text-emerald-700" : "text-red-700"}`}>
          {res.message}
        </span>
      ) : null}
    </div>
  );
}
