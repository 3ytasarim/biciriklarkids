import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { isUuid } from "@/lib/admin/form";
import { PageHeader } from "@/components/admin/ui";
import { categoryOptions } from "../../urunler/data";
import { CouponForm } from "../CouponForm";
import { saveCouponAction } from "../actions";

export const metadata = { title: "Kuponu düzenle" };

export default async function EditCoupon({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [c] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
  if (!c) notFound();
  return (
    <>
      <PageHeader title={c.code} back={{ label: "Kuponlar", href: "/admin/kuponlar" }} />
      <CouponForm action={saveCouponAction.bind(null, c.id)} coupon={c} categories={await categoryOptions()} />
    </>
  );
}
