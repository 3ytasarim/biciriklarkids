import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { FacebookIcon as Facebook, InstagramIcon as Instagram, YoutubeIcon as Youtube } from "@/components/ui/SocialIcons";
import type { SiteSettings } from "@/lib/settings";
import { getFooterPages } from "@/lib/content/queries";
import { getCategoryTree } from "@/lib/catalog/queries";
import { Logo } from "@/components/ui/Logo";
import { CloudEdge, RisingClouds } from "@/components/ui/Clouds";
import { RainbowArc } from "@/components/ui/RainbowArc";
import { NewsletterForm } from "@/components/marketing/NewsletterForm";
import { CookieSettingsLink } from "@/components/marketing/CookieSettingsLink";

/** Geniş footer — sosyal hesaplar yalnızca admin'e girilmişse görünür . */
export async function Footer({ settings }: { settings: SiteSettings }) {
  const [pages, { roots }] = await Promise.all([getFooterPages(), getCategoryTree()]);
  const legal = pages.filter((p) => p.kind === "legal");
  const info = pages.filter((p) => p.kind === "info");
  const { contact, social } = settings;
  const socials = [
    { href: social.instagram, label: "Instagram", Icon: Instagram },
    { href: social.facebook, label: "Facebook", Icon: Facebook },
    { href: social.youtube, label: "YouTube", Icon: Youtube },
  ].filter((s): s is { href: string; label: string; Icon: typeof Instagram } => Boolean(s.href));
  const extraSocial = [
    { href: social.tiktok, label: "TikTok" },
    { href: social.pinterest, label: "Pinterest" },
  ].filter((s): s is { href: string; label: string } => Boolean(s.href));
  const address = [contact.street, contact.district && contact.city ? `${contact.district} / ${contact.city}` : contact.city].filter(Boolean).join(", ");

  const columns: { title: string; links: { label: string; href: string }[] }[] = [
    {
      title: "Alışveriş",
      links: [
        { label: "Tüm Ürünler", href: "/urunler" },
        { label: "Yeni Ürünler", href: "/yeni-urunler" },
        { label: "En Çok Satanlar", href: "/en-cok-satanlar" },
        { label: "Hediyelik Ürünler", href: "/hediyelik" },
        { label: "Kategoriler", href: "/kategoriler" },
        ...roots.slice(0, 4).map((c) => ({ label: c.name, href: `/kategori/${c.slug}` })),
      ],
    },
    {
      title: "Kurumsal",
      links: [
        { label: "Hakkımızda", href: "/hakkimizda" },
        { label: "İletişim", href: "/iletisim" },
        { label: "Blog / İlham", href: "/blog" },
        ...info.filter((p) => !["hakkimizda", "kargo-ve-teslimat"].includes(p.slug)).map((p) => ({ label: p.title, href: `/${p.slug}` })),
      ],
    },
    {
      title: "Yardım",
      links: [
        { label: "Sıkça Sorulan Sorular", href: "/sss" },
        { label: "Kargo ve Teslimat", href: "/kargo-ve-teslimat" },
        { label: "İade ve Değişim", href: "/iade-politikasi" },
        { label: "Sipariş Takibi", href: "/siparis-takibi" },
        { label: "Hesabım", href: "/hesabim" },
      ],
    },
  ];

  return (
    <footer className="mt-14 text-white sm:mt-24 lg:mt-32">
      <CloudEdge className="-mb-px" fill="var(--color-footer)" />
      <div className="relative isolate overflow-hidden bg-footer">
      <RisingClouds className="-z-10" />
      <div className="shell grid gap-12 py-14 lg:grid-cols-12 lg:gap-10 lg:py-20">
        <div className="lg:col-span-4">
          <Link href="/" aria-label="Bıcırıklar Kids — Ana sayfa" className="inline-block rounded-md">
            <Logo tone="dark" />
          </Link>
          <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-white/75">
            Çocuklar için keçe dikiş kitleri ve eğitici aktivite setleri. Minik eller kendi oyuncağını, kendi çantasını üretsin diye.
          </p>
          <div className="mt-8 max-w-md">
            <p className="font-display text-xl font-extrabold">Yeniliklerden ilk siz haberdar olun</p>
            <p className="mt-1 mb-4 text-sm text-white/65">Yeni kitler ve aktivite fikirleri — yalnızca izin verirseniz.</p>
            <NewsletterForm tone="dark" source="footer" />
          </div>
          <div className="mt-8 max-w-md">
            <p className="mb-2.5 flex items-center gap-2 text-xs font-bold tracking-wide text-white/70">
              <ShieldCheck aria-hidden="true" className="h-4 w-4 text-sun" /> Güvenli ödeme
            </p>
            <div className="rounded-md bg-white px-4 py-3 shadow-[0_12px_30px_-18px_rgb(0_0_0/0.5)]">
              <Image src="/brand/odeme-logolari.webp" alt="Ödeme yöntemleri: iyzico ile Öde, Mastercard, Visa, American Express, Troy" width={820} height={87} sizes="(min-width: 640px) 420px, 90vw" className="h-auto w-full" />
            </div>
            {/* ETBİS kaydı: Ticaret Bakanlığı'nın resmî site sorgulama sayfasına bağlantı (kayıt bilgisi; onay/garanti iddiası değil) */}
            <a
              href="https://etbis.ticaret.gov.tr/tr/SiteSorgulamaSonuc?siteId=53ef57ae-812b-4b71-8571-f0cccac4c8f9"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="ETBİS'e kayıtlı e-ticaret sitesi — T.C. Ticaret Bakanlığı resmî kayıt sorgulama sayfası (yeni sekmede açılır)"
              className="group mt-3 flex min-h-14 items-center gap-3 rounded-md border border-white/15 bg-white/[0.06] px-4 py-3 transition-colors hover:border-white/35 hover:bg-white/10"
            >
              <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sun">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm leading-snug font-extrabold text-white">ETBİS&apos;e Kayıtlı E-Ticaret Sitesi</span>
                <span className="block text-xs leading-snug text-white/65">T.C. Ticaret Bakanlığı – Resmî Kayıt Sorgulama</span>
              </span>
              <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0 text-white/50 transition-colors group-hover:text-white" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 lg:col-span-8 lg:pl-8 xl:pl-16">
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="font-sans text-xs font-extrabold tracking-[0.18em] text-sun uppercase">{col.title}</h2>
              <ul className="mt-4 space-y-1">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="inline-flex min-h-9 items-center text-[15px] text-white/80 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="col-span-2 sm:col-span-1">
            <h2 className="font-sans text-xs font-extrabold tracking-[0.18em] text-sun uppercase">İletişim</h2>
            <ul className="mt-4 grid gap-3 text-[15px] text-white/80">
              {contact.phone ? (
                <li>
                  <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className="flex items-start gap-2.5 hover:text-white">
                    <Phone aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /> {contact.phone}
                  </a>
                </li>
              ) : null}
              {contact.email ? (
                <li>
                  <a href={`mailto:${contact.email}`} className="flex items-start gap-2.5 break-all hover:text-white">
                    <Mail aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /> {contact.email}
                  </a>
                </li>
              ) : null}
              {address ? (
                <li className="flex items-start gap-2.5">
                  <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                  <address className="not-italic">{address}</address>
                </li>
              ) : null}
            </ul>
            {socials.length || extraSocial.length ? (
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Sosyal medya">
                {socials.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a href={href} target="_blank" rel="noopener noreferrer me" aria-label={label} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white hover:text-ink">
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </a>
                  </li>
                ))}
                {extraSocial.map(({ href, label }) => (
                  <li key={label}>
                    <a href={href} target="_blank" rel="noopener noreferrer me" className="inline-flex h-11 items-center rounded-full bg-white/10 px-4 text-sm font-bold transition-colors hover:bg-white hover:text-ink">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>

      <div className="pointer-events-none relative -mt-10 h-36 opacity-60 sm:-mt-16 sm:h-52 lg:-mt-24 lg:h-64">
        <RainbowArc />
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto grid w-full max-w-[1760px] justify-items-center gap-4 px-4 py-6 text-center text-[13px] text-white/60 sm:px-6 lg:px-10 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-x-6 lg:text-left 2xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] 2xl:gap-x-8">
          <p className="order-2 lg:order-none lg:max-w-[11.5rem] lg:justify-self-start 2xl:max-w-none">© {new Date().getFullYear()} {settings.brand.legalName}. Tüm hakları saklıdır.</p>
          <nav aria-label="Yasal" className="order-1 lg:order-none">
            <ul className="flex flex-wrap justify-center gap-x-4 gap-y-0 lg:gap-x-3 2xl:gap-x-4">
              {legal.map((p) => (
                <li key={p.slug}>
                  <Link href={`/${p.slug}`} className="inline-flex min-h-9 items-center hover:text-white">
                    {p.title}
                  </Link>
                </li>
              ))}
              <li>
                <CookieSettingsLink className="inline-flex min-h-9 items-center hover:text-white" />
              </li>
            </ul>
          </nav>
          <a href="https://www.3ytasarim.com" target="_blank" rel="noopener" className="studio-credit order-3 lg:order-none lg:justify-self-end">
            <span className="text-white/55">Design by</span>
            <span className="studio-credit-name">3Y Tasarım &amp; Yazılım Hizmetleri</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="studio-credit-spark h-3.5 w-3.5" focusable="false">
              <path fill="currentColor" d="M12 2c.4 4.6 2.4 6.6 7 7-4.6.4-6.6 2.4-7 7-.4-4.6-2.4-6.6-7-7 4.6-.4 6.6-2.4 7-7Z" />
            </svg>
          </a>
        </div>
      </div>
      </div>
    </footer>
  );
}
