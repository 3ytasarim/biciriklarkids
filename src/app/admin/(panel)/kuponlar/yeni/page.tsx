import { requireAdmin } from "@/lib/auth/admin";
import { PageHeader } from "@/components/admin/ui";
import { categoryOptions } from "../../urunler/data";
import { CouponForm } from "../CouponForm";
import { saveCouponAction } from "../actions";

export const metadata = { title: "Yeni kupon" };

export default async function NewCoupon() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Yeni kupon" back={{ label: "Kuponlar", href: "/admin/kuponlar" }} />
      <CouponForm action={saveCouponAction.bind(null, null)} categories={await categoryOptions()} />
    </>
  );
}
