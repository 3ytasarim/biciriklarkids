import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Heart, HeartHandshake, ListOrdered, Package, PackageOpen, Palette, Quote, Shapes, ShieldCheck, Sparkles, Spool } from "lucide-react";
import { getPageBySlug } from "@/lib/content/queries";
import { getCategoryTree } from "@/lib/catalog/queries";
import { getSiteSettings } from "@/lib/settings";
import { buildEntityMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, faqSchema, graph } from "@/lib/schema/json-ld";
import { sanitizeRichText } from "@/lib/sanitize";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FaqList } from "@/components/ui/FaqList";
import { SkyDrift } from "@/components/ui/Clouds";
import { CountUp } from "@/components/ui/CountUp";

/**
 * Hakkımızda: metinler Admin › Sayfalar › Hakkımızda'dan (özet + "Hikayemiz" içeriği + SSS) gelir;
 * sayfa düzeni, değerler ve süreç bölümleri burada. Rakamlar katalogdan canlı hesaplanır.
 */
export const revalidate = 600;

const SLUG = "hakkimizda";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug(SLUG);
  if (!page) notFound();
  return buildEntityMetadata({ name: page.title, path: `/${SLUG}`, seo: page, fallbackDescription: [page.excerpt, page.content] });
}

const VALUES = [
  { icon: ShieldCheck, tint: "tint-leaf", title: "Güvenli iğne", text: "Dikiş setlerimizde çocuklar için plastik güvenli iğne bulunur; minikler gönül rahatlığıyla diker." },
  { icon: ListOrdered, tint: "tint-sky", title: "Adım adım anlatım", text: "Parçalar ve anlatım, ilk kez dikiş yapan bir çocuğun bile takip edebileceği sırayla hazırlanır." },
  { icon: Palette, tint: "tint-berry", title: "Rengârenk keçe", text: "Canlı renkli keçe parçalarla her proje, çocuğun kendi hayal gücüyle şekillenir." },
  { icon: Package, tint: "tint-sun", title: "Özenli paketleme", text: "Siparişinizi verdiğiniz haliyle, birebir aynı şekilde ve özenle paketleyerek gönderiyoruz." },
] as const;

const TINTS = ["tint-sun", "tint-sky", "tint-berry", "tint-leaf"] as const;

const STEPS = [
  { icon: PackageOpen, title: "Kutuyu aç", text: "Keçe parçalar, güvenli iğne ve anlatım tek kutuda hazır." },
  { icon: Shapes, title: "Parçaları tanı", text: "Anlatımdaki sırayı takip ederek parçaları yan yana diz." },
  { icon: Spool, title: "Dik ve doldur", text: "Kenarları dik, oyuncak kitlerinde elyafı doldurup kapat." },
  { icon: Heart, title: "Gururla kullan", text: "Kendi yaptığı çantayı takar, oyuncağıyla oynar." },
] as const;

export default async function AboutPage() {
  const [page, tree, settings] = await Promise.all([getPageBySlug(SLUG), getCategoryTree(), getSiteSettings()]);
  if (!page) notFound();

  const cats = tree.roots.filter((c) => c.productCount > 0);
  const productTotal = cats.reduce((s, c) => s + c.productCount, 0);
  const html = sanitizeRichText(page.content);
  const collage = cats.filter((c) => c.image).slice(0, 4);
  const faq = page.faq.filter((f) => f.question && f.answer);
  const crumbs = [
    { name: "Ana Sayfa", path: "/" },
    { name: page.title, path: `/${SLUG}` },
  ];

  return (
    <article className="about-page overflow-x-clip">
      <JsonLd data={graph(breadcrumbSchema(crumbs), faq.length ? faqSchema(faq) : null)} />

      {/* ── Hero ── */}
      <header className="relative isolate overflow-hidden bg-[linear-gradient(180deg,var(--color-brand-50),var(--color-paper))] pb-16 sm:pb-24">
        <SkyDrift className="-z-10 opacity-80" />
        <div className="shell pt-4 sm:pt-6">
          <Breadcrumbs items={crumbs} />
          <div className="mt-8 grid items-center gap-12 lg:mt-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
            <div>
              <p className="eyebrow animate-rise">{page.title}</p>
              <h1 className="display-1 mt-5 animate-rise [animation-delay:80ms]">
                Minik eller için <span className="text-rainbow">büyük hayaller</span>
              </h1>
              {page.excerpt ? <p className="lead mt-6 max-w-xl animate-rise [animation-delay:160ms]">{page.excerpt}</p> : null}
              <div className="mt-8 flex flex-wrap gap-3 animate-rise [animation-delay:240ms]">
                <Link href="/urunler" className="btn-primary">
                  Kitleri keşfet <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
                <Link href="#hikayemiz" className="btn-outline">
                  Hikayemiz
                </Link>
              </div>
            </div>

            <div className="relative mx-auto aspect-square w-full max-w-[520px]" aria-hidden="true">
              <div className="about-blob absolute inset-[6%] rounded-[42%_58%_55%_45%/48%_42%_58%_52%] bg-[conic-gradient(from_200deg,var(--color-sun-50),var(--color-berry-50),var(--color-sky-50),var(--color-leaf-50),var(--color-sun-50))]" />
              <div className="about-float absolute top-[4%] left-[8%] w-[54%] rotate-[-6deg] overflow-hidden rounded-2xl bg-white p-2 shadow-[0_30px_60px_-30px_rgb(16_40_74/0.45)]">
                <Image src="/images/home/hero-canta.webp" alt="" width={600} height={750} sizes="(min-width: 1024px) 280px, 50vw" priority className="h-auto w-full rounded-xl" />
              </div>
              <div className="about-float about-float-b absolute right-[4%] bottom-[18%] w-[40%] rotate-[5deg] overflow-hidden rounded-2xl bg-white p-2 shadow-[0_30px_60px_-30px_rgb(16_40_74/0.45)]">
                <Image src="/images/home/hero-zurafa.webp" alt="" width={600} height={750} sizes="(min-width: 1024px) 210px, 40vw" className="h-auto w-full rounded-xl" />
              </div>
              <div className="about-float about-float-c absolute bottom-[2%] left-[22%] w-[32%] rotate-[-3deg] overflow-hidden rounded-2xl bg-white p-2 shadow-[0_30px_60px_-30px_rgb(16_40_74/0.45)]">
                <Image src="/images/home/hero-denizanasi.webp" alt="" width={600} height={750} sizes="(min-width: 1024px) 170px, 32vw" className="h-auto w-full rounded-xl" />
              </div>
              <Sparkles className="about-twinkle absolute top-[10%] right-[14%] h-8 w-8 text-sun" />
              <Sparkles className="about-twinkle absolute bottom-[8%] right-[30%] h-6 w-6 text-berry [animation-delay:-1.2s]" />
            </div>
          </div>
        </div>
      </header>

      {/* ── Rakamlar (katalogdan canlı) ── */}
      <section aria-label="Kısaca Bıcırıklar Kids" className="shell relative z-10 -mt-8 sm:-mt-12">
        <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-white p-4 shadow-[0_30px_70px_-40px_rgb(16_40_74/0.5)] ring-1 ring-line sm:gap-4 sm:p-6 lg:grid-cols-4">
          {[
            { k: "Kit ve set", v: <CountUp value={productTotal} />, tint: "tint-sky" },
            { k: "Ürün kategorisi", v: <CountUp value={cats.length} />, tint: "tint-berry" },
            { k: "Gün cayma hakkı", v: <CountUp value={settings.commerce.returnDays} />, tint: "tint-leaf" },
            settings.shipping.freeThreshold != null
              ? { k: "Üzeri ücretsiz kargo", v: <CountUp value={settings.shipping.freeThreshold} suffix="₺" />, tint: "tint-sun" }
              : { k: "Özenli paketleme", v: "Her sipariş", tint: "tint-sun" },
          ].map((s, i) => (
            <div key={s.k} className={`reveal ${s.tint} flex flex-col-reverse rounded-xl bg-(--tint) px-4 py-5 text-center sm:py-7`} style={{ ["--reveal-delay" as string]: `${i * 90}ms` }}>
              <dt className="mt-1 text-sm font-bold text-ink-soft">{s.k}</dt>
              <dd className="font-display text-4xl font-extrabold text-(--tint-ink) sm:text-5xl">{s.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Hikayemiz: kolaj + dönen rozet + yüzen etiketler | hikâye kartı (admin içeriği) ── */}
      <section id="hikayemiz" aria-labelledby="hikayemiz-baslik" className="relative scroll-mt-28 overflow-hidden py-20 sm:py-28">
        <div aria-hidden="true" className="about-blob absolute -top-24 -right-40 -z-10 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,var(--color-berry-50),transparent_70%)]" />
        <div className="shell grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div className="relative mx-auto w-full max-w-[560px]">
            <ul aria-hidden="true" className="grid grid-cols-2 gap-4 sm:gap-5">
              {collage.map((c, i) => (
                <li
                  key={c.id}
                  className={`reveal story-tile ${TINTS[i % TINTS.length]} relative overflow-hidden rounded-[1.75rem] bg-(--tint) ${i === 0 ? "row-span-2" : ""} ${i === 3 ? "col-span-2" : ""}`}
                  style={{ ["--reveal-delay" as string]: `${i * 110}ms` }}
                >
                  <div className={`relative ${i === 0 ? "h-full min-h-[260px]" : i === 3 ? "aspect-[2/1]" : "aspect-square"}`}>
                    <Image src={c.image!} alt="" fill sizes="(min-width: 1024px) 270px, 45vw" className="object-contain p-4 mix-blend-multiply transition-transform duration-700 ease-(--ease-premium) hover:scale-105" />
                  </div>
                </li>
              ))}
            </ul>

            {/* Dönen yazılı rozet */}
            <div aria-hidden="true" className="absolute top-1/2 left-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 sm:h-40 sm:w-40">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-white shadow-[0_24px_50px_-20px_rgb(16_40_74/0.5)]">
                <svg viewBox="0 0 200 200" className="story-spin absolute inset-0 h-full w-full">
                  <defs>
                    <path id="rozet-yol" d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0" />
                  </defs>
                  <text className="fill-ink text-[19px] font-extrabold tracking-[0.2em] uppercase">
                    <textPath href="#rozet-yol">El yapımı mutluluk • Bıcırıklar Kids •</textPath>
                  </text>
                </svg>
                <HeartHandshake className="h-10 w-10 text-berry sm:h-12 sm:w-12" />
              </div>
            </div>

            {/* Yüzen etiketler */}
            <p className="about-float story-chip absolute top-6 -left-3 sm:-left-8">
              <ShieldCheck aria-hidden="true" className="h-4 w-4 text-leaf-ink" /> Plastik güvenli iğne
            </p>
            <p className="about-float about-float-b story-chip absolute -right-2 bottom-10 sm:-right-6">
              <ListOrdered aria-hidden="true" className="h-4 w-4 text-brand-ink" /> Adım adım anlatım
            </p>
          </div>

          <div>
            <p className="eyebrow reveal">Hikayemiz</p>
            <h2 id="hikayemiz-baslik" className="display-2 reveal mt-4" style={{ ["--reveal-delay" as string]: "80ms" }}>
              Üretmenin mutluluğunu <span className="text-rainbow">çocuklarla</span> paylaşıyoruz
            </h2>
            <div className="reveal story-card relative mt-8 rounded-[1.75rem] bg-white p-7 shadow-[0_30px_70px_-45px_rgb(16_40_74/0.55)] ring-1 ring-line sm:p-9" style={{ ["--reveal-delay" as string]: "160ms" }}>
              <Quote aria-hidden="true" className="absolute -top-5 left-7 h-10 w-10 rounded-full bg-sun p-2 text-white shadow-lg" />
              <div className="prose rich story-rich max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
              <div className="mt-7 flex items-center gap-3 border-t border-dashed border-line-strong pt-6">
                <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-brand),var(--color-berry))] text-sm font-extrabold text-white">
                  BK
                </span>
                <span>
                  <span className="block font-display font-extrabold">Bıcırıklar Kids Ekibi</span>
                  <span className="block text-sm text-muted">Minik eller için büyük hayaller</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Değerler: renkli dikişli kartlar ── */}
      <section aria-labelledby="degerler-baslik" className="relative isolate overflow-hidden bg-ink py-20 text-white sm:py-28">
        <SkyDrift className="-z-10 opacity-[0.12]" />
        <div className="shell">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow reveal mx-auto border-white/20 bg-white/10 text-white">Neye önem veriyoruz?</p>
            <h2 id="degerler-baslik" className="display-2 reveal mt-4" style={{ ["--reveal-delay" as string]: "80ms" }}>
              Her kutuda aynı <span className="text-rainbow-light">özen</span>
            </h2>
          </div>
          <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon: Icon, tint, title, text }, i) => (
              <li key={title} className={`value-card reveal ${tint} group relative overflow-hidden rounded-[1.75rem] bg-(--tint) p-7 text-ink`} style={{ ["--reveal-delay" as string]: `${i * 110}ms` }}>
                <span aria-hidden="true" className="absolute -top-3 -right-1 font-display text-[5.5rem] leading-none font-extrabold text-(--tint-base) opacity-15">
                  0{i + 1}
                </span>
                <span className="relative flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-white text-(--tint-ink) shadow-[0_14px_30px_-16px_rgb(16_40_74/0.5)] transition-transform duration-500 ease-(--ease-premium) group-hover:-rotate-8 group-hover:scale-110">
                  <Icon aria-hidden="true" className="h-8 w-8" />
                </span>
                <h3 className="relative mt-7 font-display text-2xl font-extrabold">{title}</h3>
                <p className="relative mt-2 text-[15px] leading-relaxed text-ink-soft">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Süreç: ekrana gelince çizilen dikiş yolu üzerinde adımlar ── */}
      <section aria-labelledby="surec-baslik" className="shell py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow reveal mx-auto">Kutudan oyuncağa</p>
          <h2 id="surec-baslik" className="display-2 reveal mt-4" style={{ ["--reveal-delay" as string]: "80ms" }}>
            Dört adımda kendi eseri
          </h2>
        </div>
        <div className="reveal relative mt-16">
          <svg aria-hidden="true" viewBox="0 0 1000 120" preserveAspectRatio="none" className="steps-path absolute top-6 left-[12.5%] hidden h-24 w-3/4 lg:block">
            <path d="M0 40 C 160 -10, 330 110, 500 40 S 840 -10, 1000 40" fill="none" stroke="var(--color-brand-100)" strokeWidth="4" strokeLinecap="round" strokeDasharray="12 10" />
          </svg>
          <ol className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="step-card reveal group relative rounded-[1.75rem] bg-white p-7 pt-9 text-center ring-1 ring-line" style={{ ["--reveal-delay" as string]: `${200 + i * 160}ms` }}>
                <span className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-brand),var(--color-lilac))] text-white shadow-[0_18px_34px_-14px_rgb(0_103_209/0.7)] ring-8 ring-paper transition-transform duration-500 ease-(--ease-premium) group-hover:scale-110 group-hover:rotate-6">
                  <Icon aria-hidden="true" className="h-9 w-9" />
                  <span className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full bg-sun font-display text-sm font-extrabold text-ink ring-4 ring-white">{i + 1}</span>
                </span>
                <h3 className="mt-6 font-display text-xl font-extrabold">{title}</h3>
                <p className="mx-auto mt-2 max-w-[240px] text-[15px] leading-relaxed text-ink-soft">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Ürün yelpazesi ── */}
      {cats.length ? (
        <section aria-labelledby="yelpaze-baslik" className="bg-[linear-gradient(180deg,var(--color-paper),var(--color-brand-50))] py-20 sm:py-28">
          <div className="shell">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow reveal">Ürün yelpazemiz</p>
                <h2 id="yelpaze-baslik" className="display-2 reveal mt-4" style={{ ["--reveal-delay" as string]: "80ms" }}>
                  Her yaşa, her hayale bir set
                </h2>
              </div>
              <Link href="/kategoriler" className="btn-outline reveal">
                Tüm kategoriler <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
            <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {cats.filter((c) => c.image).slice(0, 10).map((c, i) => (
                <li key={c.id} className="reveal" style={{ ["--reveal-delay" as string]: `${(i % 5) * 70}ms` }}>
                  <Link href={`/kategori/${c.slug}`} className="about-cat group block overflow-hidden rounded-2xl bg-white ring-1 ring-line">
                    <span className="shot relative block aspect-[4/5] overflow-hidden">
                      {c.image ? (
                        <Image src={c.image} alt="" fill sizes="(min-width: 1024px) 240px, (min-width: 640px) 30vw, 45vw" className="object-contain mix-blend-multiply transition-transform duration-700 ease-(--ease-premium) group-hover:scale-105" />
                      ) : null}
                    </span>
                    <span className="flex items-center justify-between gap-2 px-4 py-3">
                      <span className="text-[15px] leading-snug font-extrabold">{c.name}</span>
                      <span className="shrink-0 text-xs font-bold text-muted">{c.productCount}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ── SSS (admin) ── */}
      {faq.length ? (
        <section aria-labelledby="sss-baslik" className="shell py-20">
          <div className="mx-auto max-w-3xl">
            <h2 id="sss-baslik" className="display-3 mb-6">
              Sıkça sorulan sorular
            </h2>
            <FaqList items={faq} />
          </div>
        </section>
      ) : null}

      {/* ── CTA ── */}
      <section aria-labelledby="cta-baslik" className="shell pt-6 pb-20 sm:pb-28">
        <div className="reveal relative isolate overflow-hidden rounded-[2rem] bg-brand-ink px-6 py-14 text-center text-white sm:px-12 sm:py-20">
          <SkyDrift className="-z-10 opacity-25" />
          <HeartHandshake aria-hidden="true" className="mx-auto h-10 w-10 text-sun" />
          <h2 id="cta-baslik" className="display-2 mx-auto mt-5 max-w-2xl">
            Çocuğunuzla birlikte ilk projeye başlayın
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80">Keçe çantadan figürlü oyuncağa, ilk dikiş deneyimi için hazırlanmış setleri inceleyin.</p>
          <Link href="/urunler" className="btn-dark mt-8 bg-white text-ink hover:bg-sun-50">
            Ürünleri incele <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </article>
  );
}
