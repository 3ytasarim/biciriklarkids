import { requireAdmin } from "@/lib/auth/admin";
import { getSiteSettings } from "@/lib/settings";
import { previewOrderEmail } from "@/lib/mail/order-emails";
import { MAIL_EVENTS, type MailEvent } from "@/lib/mail/templates";

/** Admin: kayıtlı şablonun örnek siparişle HTML önizlemesi. */
export async function GET(_req: Request, { params }: { params: Promise<{ event: string }> }) {
  await requireAdmin("admin");
  const { event } = await params;
  if (!MAIL_EVENTS.includes(event as MailEvent)) return new Response("Bulunamadı", { status: 404 });
  const { html } = previewOrderEmail(event as MailEvent, await getSiteSettings());
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}
