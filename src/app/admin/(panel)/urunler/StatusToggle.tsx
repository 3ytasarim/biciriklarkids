"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setProductStatusAction } from "./actions";

const LABEL = { active: "Yayında", draft: "Taslak", archived: "Arşiv" } as const;
const TONE = { active: "bg-emerald-50 text-emerald-800", draft: "bg-neutral-100 text-neutral-700", archived: "bg-amber-50 text-amber-800" } as const;

/** Listeden hızlı durum değişikliği (yayına al / taslağa çek). */
export function StatusToggle({ id, status }: { id: string; status: keyof typeof LABEL }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <select
      aria-label="Durum"
      value={status}
      disabled={pending}
      onChange={(e) =>
        start(async () => {
          const res = await setProductStatusAction(id, e.target.value as keyof typeof LABEL);
          if (!res.ok) alert(res.error);
          router.refresh();
        })
      }
      className={`min-h-9 rounded-full px-2 text-xs font-semibold ${TONE[status]}`}
    >
      {Object.entries(LABEL).map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}
