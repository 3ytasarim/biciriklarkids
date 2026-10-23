"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { videos } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { bool, fail, formObject, isUniqueViolation, isUuid, optional, optionalInt, optionalMedia, required, zodErrors, type ActionState, type Result } from "@/lib/admin/form";
import { revalidateSite } from "@/lib/admin/revalidate";

const ratio = z
  .string()
  .trim()
  .regex(/^\d{1,2}\/\d{1,2}$/, "Oran biçimi: 16/9");

const schema = z.object({
  slot: z
    .string()
    .trim()
    .regex(/^[a-z0-9:-]{3,80}$/, "Küçük harf, rakam, - ve : (ör. home-lifestyle, product-xyz)"),
  title: required("Başlık", 160),
  description: optional(1000),
  desktopUrl: optionalMedia,
  mobileUrl: optionalMedia,
  posterUrl: optionalMedia,
  mobilePosterUrl: optionalMedia,
  aspectRatio: ratio,
  mobileAspectRatio: ratio,
  autoplay: bool,
  loop: bool,
  durationSeconds: optionalInt(36_000),
  productId: z.string().refine((v) => v === "" || isUuid(v)).transform((v) => v || null),
  isActive: bool,
});

export async function saveVideoAction(id: string | null, _p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = schema.safeParse(formObject(fd));
  if (!parsed.success) return zodErrors(parsed.error);
  try {
    if (id) await db.update(videos).set(parsed.data).where(eq(videos.id, id));
    else {
      await db.insert(videos).values(parsed.data);
      revalidateSite();
      redirect("/admin/videolar?kaydedildi=1");
    }
  } catch (e) {
    if (isUniqueViolation(e)) return fail("Bu alan adı (slot) kullanımda.", { slot: "Kullanımda." });
    throw e;
  }
  revalidateSite();
  return { status: "success", message: "Video alanı kaydedildi." };
}

export async function deleteVideoAction(id: string): Promise<Result> {
  await requireAdmin("admin");
  await db.delete(videos).where(eq(videos.id, id));
  revalidateSite();
  return { ok: true };
}
