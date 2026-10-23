import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { formatDateTime } from "@/lib/utils";
import { Badge, PageHeader, Table } from "@/components/admin/ui";
import { ConfirmAction } from "@/components/admin/ConfirmAction";
import { CreateUserForm, PasswordForm } from "./UserForms";
import { toggleAdminUserAction } from "./actions";

export const metadata = { title: "Yöneticiler" };

const ROLE = { editor: "Editör", admin: "Yönetici", owner: "Sahip" } as const;

export default async function UsersPage() {
  const me = await requireAdmin();
  const rows = me.role === "owner" ? await db.select().from(adminUsers).orderBy(asc(adminUsers.createdAt)) : [];
  return (
    <>
      <PageHeader title={me.role === "owner" ? "Yöneticiler" : "Hesabım"} />
      {me.role === "owner" ? (
        <div className="mb-10 space-y-6">
          <Table head={["Ad", "E-posta", "Rol", "Son giriş", "Durum", ""]}>
            {rows.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-semibold">{u.name}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{ROLE[u.role]}</td>
                <td className="px-4 py-3 text-neutral-600">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "—"}</td>
                <td className="px-4 py-3">{u.isActive ? <Badge tone="green">Aktif</Badge> : <Badge>Pasif</Badge>}</td>
                <td className="px-2 py-3 text-right">
                  {u.id !== me.id ? (
                    <ConfirmAction
                      title={u.isActive ? `${u.name} pasifleştirilsin mi?` : `${u.name} etkinleştirilsin mi?`}
                      description={u.isActive ? "Kullanıcı giriş yapamaz; açık oturumları kapatılır." : "Kullanıcı yeniden giriş yapabilir."}
                      confirmLabel={u.isActive ? "Pasifleştir" : "Etkinleştir"}
                      triggerLabel={u.isActive ? "Pasifleştir" : "Etkinleştir"}
                      tone={u.isActive ? "danger" : "default"}
                      action={toggleAdminUserAction.bind(null, u.id)}
                    />
                  ) : (
                    <span className="text-xs text-neutral-500">Siz</span>
                  )}
                </td>
              </tr>
            ))}
          </Table>
          <CreateUserForm />
        </div>
      ) : null}
      <PasswordForm />
    </>
  );
}
