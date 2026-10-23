"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { bool, fail, formObject, isUniqueViolation, isUuid, optional, optionalInt, optionalMoney, zodErrors, type ActionState, type Result } from "@/lib/admin/form";

const date = z
  .string()
  .trim()
  .transform((v) => (v ? new Date(v) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), "Geçersiz tarih.");

const schema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,40}$/, "3–40 karakter; harf, rakam, - ve _."),
    description: optional(250),
    type: z.enum(["percent", "fixed", "free_shipping"]),
    value: optionalMoney,
    minOrderAmount: optionalMoney,
    maxDiscountAmount: optionalMoney,
    categoryId: z.string().refine((v) => v === "" || isUuid(v)).transform((v) => v || null),
    startsAt: date,
    endsAt: date,
    usageLimit: optionalInt(1_000_000),
    usagePerCustomer: optionalInt(1000),
    isActive: bool,
  })
  .superRefine((v, ctx) => {
    if (v.type !== "free_shipping" && (v.value == null || v.value <= 0)) ctx.addIssue({ code: "custom", path: ["value"], message: "İndirim değeri girin." });
    if (v.type === "percent" && v.value != null && v.value > 100) ctx.addIssue({ code: "custom", path: ["value"], message: "Yüzde 100'den büyük olamaz." });
    if (v.startsAt && v.endsAt && v.endsAt < v.startsAt) ctx.addIssue({ code: "custom", path: ["endsAt"], message: "Bitiş başlangıçtan önce olamaz." });
  });

export async function saveCouponAction(id: string | null, _p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = schema.safeParse(formObject(fd));
  if (!parsed.success) return zodErrors(parsed.error);
  const d = { ...parsed.data, value: parsed.data.value ?? 0 };
  try {
    if (id) await db.update(coupons).set(d).where(eq(coupons.id, id));
    else {
      await db.insert(coupons).values(d);
      redirect("/admin/kuponlar?kaydedildi=1");
    }
  } catch (e) {
    if (isUniqueViolation(e)) return fail("Bu kupon kodu zaten var.", { code: "Kod kullanımda." });
    throw e;
  }
  return { status: "success", message: "Kupon kaydedildi." };
}

export async function deleteCouponAction(id: string): Promise<Result> {
  await requireAdmin("admin");
  await db.delete(coupons).where(eq(coupons.id, id));
  return { ok: true };
}
