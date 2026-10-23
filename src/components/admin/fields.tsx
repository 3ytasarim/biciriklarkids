"use client";

import { useId } from "react";
import { useFieldError } from "./AdminForm";

export const inputCls =
  "block min-h-11 w-full rounded-sm border border-neutral-300 bg-white px-3 text-[15px] text-ink outline-none transition-colors placeholder:text-neutral-400 focus:border-ink aria-[invalid=true]:border-red-600";

export function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-7">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {description ? <p className="mt-1 text-sm text-neutral-500">{description}</p> : null}
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

export function Field({
  name,
  label,
  hint,
  required,
  children,
}: {
  name: string;
  label: string;
  hint?: React.ReactNode;
  required?: boolean;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => React.ReactNode;
}) {
  const id = useId();
  const error = useFieldError(name);
  const describedBy = [error ? `${id}-err` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-neutral-800">
        {label}
        {required ? <span className="text-brand-ink"> *</span> : null}
      </label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-neutral-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "name"> & { name: string; label: string; hint?: React.ReactNode };

export function TextInput({ name, label, hint, required, ...rest }: InputProps) {
  return (
    <Field name={name} label={label} hint={hint} required={required}>
      {(a) => <input name={name} {...a} {...rest} className={inputCls} />}
    </Field>
  );
}

export function TextArea({
  name,
  label,
  hint,
  required,
  rows = 4,
  ...rest
}: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "name"> & { name: string; label: string; hint?: React.ReactNode }) {
  return (
    <Field name={name} label={label} hint={hint} required={required}>
      {(a) => <textarea name={name} rows={rows} {...a} {...rest} className={`${inputCls} py-2.5`} />}
    </Field>
  );
}

export function SelectInput({
  name,
  label,
  hint,
  required,
  options,
  placeholder,
  ...rest
}: Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "name"> & {
  name: string;
  label: string;
  hint?: React.ReactNode;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <Field name={name} label={label} hint={hint} required={required}>
      {(a) => (
        <select name={name} {...a} {...rest} className={inputCls}>
          {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function Checkbox({ name, label, hint, defaultChecked }: { name: string; label: string; hint?: string; defaultChecked?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <input id={id} type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 h-5 w-5 shrink-0 accent-ink" />
      <label htmlFor={id} className="text-sm">
        <span className="font-medium text-neutral-800">{label}</span>
        {hint ? <span className="block text-xs text-neutral-500">{hint}</span> : null}
      </label>
    </div>
  );
}

/** Karakter sayaçlı metin alanı (SEO başlık/açıklama). */
export function CountedInput({
  name,
  label,
  hint,
  defaultValue,
  recommended,
  multiline,
  value,
  onValue,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string | null;
  recommended: [number, number];
  multiline?: boolean;
  value: string;
  onValue: (v: string) => void;
}) {
  const len = value.length;
  const [min, max] = recommended;
  const tone = len === 0 ? "text-neutral-400" : len < min || len > max ? "text-amber-700" : "text-emerald-700";
  return (
    <Field name={name} label={label} hint={<span>{hint} <span className={`font-semibold ${tone}`}>{len} karakter (önerilen {min}–{max})</span></span>}>
      {(a) =>
        multiline ? (
          <textarea name={name} rows={3} {...a} defaultValue={defaultValue ?? ""} onChange={(e) => onValue(e.target.value)} className={`${inputCls} py-2.5`} />
        ) : (
          <input name={name} {...a} defaultValue={defaultValue ?? ""} onChange={(e) => onValue(e.target.value)} className={inputCls} />
        )
      }
    </Field>
  );
}
