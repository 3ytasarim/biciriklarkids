"use client";

import { useState } from "react";
import { Link2, RefreshCw } from "lucide-react";
import { slugify } from "@/lib/slug";
import { Field, inputCls } from "./fields";

/**
 * Ad + slug alanları. Yeni kayıtta slug addan otomatik üretilir; admin slug'ı elle değiştirirse
 * otomatik eşitleme durur. Yayındaki kaydın slug'ı değişirse eski URL'ye otomatik 301 açılır (uyarı gösterilir).
 */
export function SlugFields({
  nameField = "name",
  nameLabel = "Ad",
  defaultName,
  defaultSlug,
  prefix,
}: {
  nameField?: string;
  nameLabel?: string;
  defaultName?: string | null;
  defaultSlug?: string | null;
  prefix: string;
}) {
  const [name, setName] = useState(defaultName ?? "");
  const [slug, setSlug] = useState(defaultSlug ?? "");
  const [auto, setAuto] = useState(!defaultSlug);
  const changed = Boolean(defaultSlug) && slug !== defaultSlug;

  return (
    <div className="space-y-5">
      <Field name={nameField} label={nameLabel} required>
        {(a) => (
          <input
            name={nameField}
            {...a}
            value={name}
            maxLength={200}
            onChange={(e) => {
              setName(e.target.value);
              if (auto) setSlug(slugify(e.target.value));
            }}
            className={inputCls}
          />
        )}
      </Field>
      <Field
        name="slug"
        label="URL (slug)"
        required
        hint={
          <span className="inline-flex flex-wrap items-center gap-1">
            <Link2 aria-hidden="true" className="h-3.5 w-3.5" /> {prefix}
            <strong className="text-neutral-700">{slug || "…"}</strong>
            {changed ? <span className="text-amber-700"> — Kaydedince eski adresten yeni adrese otomatik 301 yönlendirme açılır.</span> : null}
          </span>
        }
      >
        {(a) => (
          <div className="flex gap-2">
            <input
              name="slug"
              {...a}
              value={slug}
              maxLength={100}
              onChange={(e) => {
                setAuto(false);
                setSlug(e.target.value.toLowerCase());
              }}
              onBlur={() => setSlug(slugify(slug))}
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => {
                setSlug(slugify(name));
                setAuto(true);
              }}
              title="Addan yeniden üret"
              aria-label="Slug'ı addan yeniden üret"
              className="flex h-11 w-11 shrink-0 items-center justify-center border border-neutral-300 hover:border-ink"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        )}
      </Field>
    </div>
  );
}
