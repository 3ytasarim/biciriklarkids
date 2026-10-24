import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, HeartHandshake, ListOrdered, Package, Palette, ShieldCheck, Sparkles } from "lucide-react";
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
import { LazyVideo } from "@/components/video/LazyVideo";

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

const STEPS = [
  { title: "Kutuyu aç", text: "Keçe parçalar, güvenli iğne ve anlatım tek kutuda hazır." },
  { title: "Parçaları tanı", text: "Anlatımdaki sırayı takip ederek parçaları yan yana diz." },
  { title: "Dik ve doldur", text: "Kenarları dik, oyuncak kitlerinde elyafı doldurup kapat." },
  { title: "Gururla kullan", text: "Kendi yaptığı çantayı takar, oyuncağıyla oynar." },
] as const;

export default async function AboutPage() {
  const [page, tree, settings] = await Promise.all([getPageBySlug(SLUG), getCategoryTree(), getSiteSettings()]);
  if (!page) notFound();

  const cats = tree.roots.filter((c) => c.productCount > 0);
  const productTotal = cats.reduce((s, c) => s + c.productCount, 0);
  const html = sanitizeRichText(page.content);
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

      {/* ── Hikayemiz (admin içeriği) ── */}
      <section id="hikayemiz" aria-labelledby="hikayemiz-baslik" className="shell scroll-mt-28 py-20 sm:py-28">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="eyebrow reveal">Hikayemiz</p>
            <h2 id="hikayemiz-baslik" className="display-2 reveal mt-4" style={{ ["--reveal-delay" as string]: "80ms" }}>
              Üretmenin mutluluğunu çocuklarla paylaşıyoruz
            </h2>
            <div className="reveal mt-8 hidden max-w-[300px] lg:block" style={{ ["--reveal-delay" as string]: "160ms" }}>
              <LazyVideo src="/videos/nasil-yapilir-dikey.mp4" poster="/videos/nasil-yapilir-dikey.webp" aspectRatio="9/16" title="Keçe kitin adım adım dikilişi" />
            </div>
          </div>
          <div className="prose rich reveal max-w-none sm:prose-lg" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </section>

      {/* ── Değerler ── */}
      <section aria-labelledby="degerler-baslik" className="bg-cream py-20 sm:py-28">
        <div className="shell">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow reveal mx-auto">Neye önem veriyoruz?</p>
            <h2 id="degerler-baslik" className="display-2 reveal mt-4" style={{ ["--reveal-delay" as string]: "80ms" }}>
              Her kutuda aynı özen
            </h2>
          </div>
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon: Icon, tint, title, text }, i) => (
              <li key={title} className={`about-card reveal ${tint} group rounded-2xl bg-white p-7 ring-1 ring-line`} style={{ ["--reveal-delay" as string]: `${i * 100}ms` }}>
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--tint) text-(--tint-ink) transition-transform duration-500 ease-(--ease-premium) group-hover:-rotate-6 group-hover:scale-110">
                  <Icon aria-hidden="true" className="h-7 w-7" />
                </span>
                <h3 className="mt-6 font-display text-xl font-extrabold">{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Süreç ── */}
      <section aria-labelledby="surec-baslik" className="shell py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow reveal mx-auto">Kutudan oyuncağa</p>
          <h2 id="surec-baslik" className="display-2 reveal mt-4" style={{ ["--reveal-delay" as string]: "80ms" }}>
            Dört adımda kendi eseri
          </h2>
        </div>
        <ol className="about-steps relative mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {STEPS.map((s, i) => (
            <li key={s.title} className="reveal relative text-center" style={{ ["--reveal-delay" as string]: `${i * 140}ms` }}>
              <span className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-ink font-display text-2xl font-extrabold text-white shadow-[0_16px_30px_-14px_rgb(0_103_209/0.8)] ring-8 ring-paper">
                {i + 1}
              </span>
              <h3 className="mt-5 font-display text-xl font-extrabold">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-[240px] text-[15px] text-ink-soft">{s.text}</p>
            </li>
          ))}
        </ol>
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
