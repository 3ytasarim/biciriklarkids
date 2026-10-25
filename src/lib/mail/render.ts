import { formatPrice } from "@/lib/commerce/money";

/**
 * Markalı HTML e-posta düzeni. E-posta istemcileri (Gmail, Outlook, Apple Mail) için tablo tabanlı,
 * satır içi stiller; dış CSS/JS yok. Metinler kaçışlanır; {{yer_tutucu}} doldurma da burada.
 */
export type MailVars = Record<string, string>;
export type MailSummary = {
  items: { name: string; variant?: string | null; quantity: number; lineTotal: number }[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** {{anahtar}} → değer (bilinmeyen anahtar boş). */
export const fill = (tpl: string, vars: MailVars) => tpl.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_m, k: string) => vars[k] ?? "");

const C = { ink: "#10284a", soft: "#46597a", brand: "#0067d1", sky: "#eaf5ff", line: "#e2eaf3", paper: "#fbfdff", sun: "#f6b73c" };

/** Düz metni paragraflara çevirir; bağlantıları tıklanabilir yapar. */
function bodyHtml(text: string): string {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((para) => {
      const html = esc(para)
        .replace(/(https?:\/\/[^\s<]+)/g, `<a href="$1" style="color:${C.brand};text-decoration:underline">$1</a>`)
        .replace(/\n/g, "<br>");
      return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${C.soft}">${html}</p>`;
    })
    .join("");
}

function summaryHtml(s: MailSummary): string {
  const row = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:4px 0;font-size:14px;color:${strong ? C.ink : C.soft};${strong ? "font-weight:800" : ""}">${esc(label)}</td><td align="right" style="padding:4px 0;font-size:14px;color:${C.ink};${strong ? "font-weight:800;font-size:16px" : ""}">${esc(value)}</td></tr>`;
  const items = s.items
    .map(
      (i) =>
        `<tr><td style="padding:10px 0;border-bottom:1px solid ${C.line};font-size:14px;color:${C.ink}"><strong>${esc(i.name)}</strong>${i.variant ? `<br><span style="color:${C.soft};font-size:13px">${esc(i.variant)}</span>` : ""}<br><span style="color:${C.soft};font-size:13px">Adet: ${i.quantity}</span></td><td align="right" valign="top" style="padding:10px 0;border-bottom:1px solid ${C.line};font-size:14px;color:${C.ink};white-space:nowrap">${esc(formatPrice(i.lineTotal))}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;border-collapse:collapse">
<tr><td colspan="2" style="padding:0 0 6px;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${C.brand}">Sipariş özeti</td></tr>
${items}
<tr><td colspan="2" style="height:8px"></td></tr>
${row("Ara toplam", formatPrice(s.subtotal))}
${s.discount > 0 ? row("İndirim", `−${formatPrice(s.discount)}`) : ""}
${row("Kargo", s.shipping > 0 ? formatPrice(s.shipping) : "Ücretsiz")}
${row("Toplam", formatPrice(s.total), true)}
</table>`;
}

export function renderMailHtml(opts: {
  heading: string;
  body: string;
  summary?: MailSummary | null;
  cta?: { label: string; url: string } | null;
  brand: { name: string; logoUrl: string; siteUrl: string; tagline?: string | null };
  footer: { email?: string | null; phone?: string | null; address?: string | null };
  preheader?: string;
}): string {
  const f = opts.footer;
  const contact = [f.phone, f.email].filter(Boolean).map((x) => esc(x!)).join(" · ");
  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(opts.heading)}</title></head>
<body style="margin:0;padding:0;background:${C.sky}">
<span style="display:none!important;opacity:0;max-height:0;overflow:hidden">${esc(opts.preheader ?? opts.heading)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.sky};padding:24px 12px;font-family:'Nunito Sans',Segoe UI,Helvetica,Arial,sans-serif">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
<tr><td align="center" style="padding:8px 0 20px"><a href="${esc(opts.brand.siteUrl)}"><img src="${esc(opts.brand.logoUrl)}" width="200" alt="${esc(opts.brand.name)}" style="display:block;width:200px;max-width:60%;height:auto;border:0"></a></td></tr>
<tr><td style="background:#ffffff;border-radius:20px;padding:32px 28px;box-shadow:0 10px 30px rgba(16,40,74,.08)">
<h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;color:${C.ink};font-weight:800">${esc(opts.heading)}</h1>
${bodyHtml(opts.body)}
${opts.summary ? summaryHtml(opts.summary) : ""}
${opts.cta ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px"><tr><td style="border-radius:999px;background:${C.brand}"><a href="${esc(opts.cta.url)}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:999px">${esc(opts.cta.label)}</a></td></tr></table>` : ""}
</td></tr>
<tr><td align="center" style="padding:22px 12px 8px;font-size:12px;line-height:1.6;color:${C.soft}">
<strong style="color:${C.ink}">${esc(opts.brand.name)}</strong>${opts.brand.tagline ? ` — ${esc(opts.brand.tagline)}` : ""}<br>
${contact ? `${contact}<br>` : ""}${f.address ? `${esc(f.address)}<br>` : ""}<a href="${esc(opts.brand.siteUrl)}" style="color:${C.brand}">${esc(opts.brand.siteUrl.replace(/^https?:\/\//, ""))}</a>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

/** HTML'siz istemciler için düz metin sürümü. */
export function renderMailText(heading: string, body: string, summary?: MailSummary | null, cta?: { label: string; url: string } | null): string {
  const lines = [heading, "", body.trim()];
  if (summary) {
    lines.push("", "Sipariş özeti:");
    for (const i of summary.items) lines.push(`- ${i.name}${i.variant ? ` (${i.variant})` : ""} × ${i.quantity}: ${formatPrice(i.lineTotal)}`);
    lines.push(`Toplam: ${formatPrice(summary.total)}`);
  }
  if (cta) lines.push("", `${cta.label}: ${cta.url}`);
  return lines.join("\n");
}
