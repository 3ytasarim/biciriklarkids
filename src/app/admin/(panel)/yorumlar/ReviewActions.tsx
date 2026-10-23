"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { setReviewStatusAction } from "./actions";

export function ReviewActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (s: "approved" | "rejected") =>
    start(async () => {
      await setReviewStatusAction(id, s);
      router.refresh();
    });
  return (
    <div className="flex gap-2">
      {status !== "approved" ? (
        <button type="button" disabled={pending} onClick={() => run("approved")} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-emerald-700 px-3 text-xs font-semibold text-white">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Onayla
        </button>
      ) : null}
      {status !== "rejected" ? (
        <button type="button" disabled={pending} onClick={() => run("rejected")} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-neutral-300 px-3 text-xs font-semibold">
          <X className="h-3.5 w-3.5" /> Reddet
        </button>
      ) : null}
    </div>
  );
}
