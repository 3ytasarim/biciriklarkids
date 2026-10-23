"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useMarkDirty } from "./AdminForm";

type Column = { key: string; label: string; placeholder?: string; width?: string; list?: string; maxLength?: number; type?: "text" | "number" };

/**
 * Satır tabanlı liste editörü (teknik özellikler: grup/etiket/değer/birim; özellik maddeleri: metin).
 * Değer `name` gizli alanında JSON dizi olarak gönderilir; boş satırlar sunucuda atılır.
 */
export function RowsEditor({
  name,
  columns,
  defaultValue,
  addLabel = "Satır ekle",
  suggestions,
}: {
  name: string;
  columns: Column[];
  defaultValue: Record<string, string>[];
  addLabel?: string;
  suggestions?: Record<string, string[]>;
}) {
  const empty = () => Object.fromEntries(columns.map((c) => [c.key, ""]));
  const [rows, setRowsState] = useState<Record<string, string>[]>(defaultValue);
  const markDirty = useMarkDirty();
  const setRows = (fn: (prev: Record<string, string>[]) => Record<string, string>[]) => {
    setRowsState(fn);
    markDirty();
  };
  const move = (i: number, d: number) =>
    setRows((prev) => {
      const next = [...prev];
      const j = i + d;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      {suggestions
        ? Object.entries(suggestions).map(([key, values]) => (
            <datalist key={key} id={`${name}-${key}-list`}>
              {values.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          ))
        : null}
      {rows.length ? (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 rounded-sm border border-neutral-200 bg-white p-2 sm:flex-nowrap">
              {columns.map((c) => (
                <input
                  key={c.key}
                  aria-label={`${c.label} (${i + 1}. satır)`}
                  placeholder={c.placeholder ?? c.label}
                  value={row[c.key] ?? ""}
                  type={c.type ?? "text"}
                  inputMode={c.type === "number" ? "decimal" : undefined}
                  list={suggestions?.[c.key] ? `${name}-${c.key}-list` : undefined}
                  maxLength={c.maxLength ?? 160}
                  onChange={(e) => setRows((prev) => prev.map((r, n) => (n === i ? { ...r, [c.key]: e.target.value } : r)))}
                  className={`min-h-10 rounded-xs border border-neutral-300 px-2 text-sm outline-none focus:border-ink ${c.width ?? "min-w-0 flex-1"}`}
                />
              ))}
              <div className="flex">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Yukarı taşı" className="flex h-10 w-9 items-center justify-center hover:bg-neutral-100 disabled:opacity-30">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Aşağı taşı" className="flex h-10 w-9 items-center justify-center hover:bg-neutral-100 disabled:opacity-30">
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setRows((prev) => prev.filter((_, n) => n !== i))} aria-label="Satırı sil" className="flex h-10 w-9 items-center justify-center text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <button type="button" onClick={() => setRows((prev) => [...prev, empty()])} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 text-sm hover:border-ink">
        <Plus aria-hidden="true" className="h-4 w-4" /> {addLabel}
      </button>
    </div>
  );
}
