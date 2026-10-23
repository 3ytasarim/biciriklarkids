import type { FaqItem } from "../../src/lib/db/schema";

/**
 * Başlangıç sayfaları. Yasal metinler mevcut siteden (biciriklar.com.tr) aktarıldı ve yalnızca biçim/yinelenen
 * bölüm düzeltmeleri yapıldı. Not edilen eksikler:
 * - İade politikasında iade kargo ücretini kimin karşılayacağı mevcut sitede de "netleştirilecek" olarak duruyor.
 * - Mevcut sitedeki "Çerez Politikası" sayfası Gizlilik Politikası'nın kopyasıydı; yeni çerez izni sistemine
 *   uygun gerçek bir çerez politikası yazıldı.
 * - Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formu mevcut sitede yoktu; mevzuat gereği şablon eklendi.
 * Tüm yasal metinler yayın öncesi hukuk danışmanı tarafından gözden geçirilmelidir.
 */
export type SeedPage = { slug: string; title: string; kind: "legal" | "info"; excerpt?: string; content: string; faq?: FaqItem[]; sortOrder: number; showInFooter?: boolean };

const ul = (items: string[]) => `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;

export const SEED_PAGES: SeedPage[] = [
  {
    slug: "gizlilik-politikasi",
    title: "Gizlilik Politikası",
    kind: "legal",
    sortOrder: 1,
    content: [
      "<h2>1. Veri Sorumlusu</h2><p>Bu politika kapsamında, site üzerinden elde edilen kişisel veriler, ilgili mevzuat ve 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca işlenmektedir.</p>",
      "<h2>2. Toplanan Kişisel Veriler</h2><p>Siteyi ziyaret etmeniz veya alışveriş yapmanız halinde aşağıdaki veriler toplanabilir:</p>",
      ul(["Ad, soyad", "Adres bilgileri", "Telefon numarası", "E-posta adresi", "Sipariş ve ödeme bilgileri", "Çerez (cookie) verileri", "Kullanıcı işlem bilgileri"]),
      "<h2>3. Kişisel Verilerin İşlenme Amaçları</h2><p>Toplanan kişisel veriler aşağıdaki amaçlarla işlenebilir:</p>",
      ul([
        "Sipariş süreçlerinin yürütülmesi",
        "Ödeme işlemlerinin gerçekleştirilmesi",
        "Ürünlerin teslim edilmesi",
        "Müşteri hizmetlerinin sağlanması",
        "Yasal yükümlülüklerin yerine getirilmesi",
        "Site güvenliğinin sağlanması",
        "Hizmet kalitesinin geliştirilmesi",
        "Açık rıza verilmesi halinde pazarlama faaliyetleri",
      ]),
      "<h2>4. Kişisel Verilerin Aktarılması</h2><p>Kişisel veriler, yukarıdaki amaçların gerçekleştirilmesi için sınırlı olmak üzere kargo firmalarına, ödeme kuruluşlarına ve yetkili kamu kurum ve kuruluşlarına aktarılabilir.</p>",
      "<h2>5. Veri Toplama Yöntemi ve Hukuki Sebep</h2><p>Kişisel veriler; web sitesi formları, sipariş ekranları, çerezler ve elektronik iletişim kanalları aracılığıyla, KVKK’nın 5. ve 6. maddelerinde belirtilen hukuki sebeplere dayanarak toplanmaktadır.</p>",
      "<h2>6. KVKK Kapsamındaki Haklarınız</h2><p>KVKK’nın 11. maddesi uyarınca kullanıcılar:</p>",
      ul([
        "Verilerinin işlenip işlenmediğini öğrenme",
        "İşlenmişse bilgi talep etme",
        "Amacına uygun kullanılıp kullanılmadığını öğrenme",
        "Düzeltilmesini isteme",
        "Silinmesini veya yok edilmesini isteme",
        "Aktarılan üçüncü kişileri öğrenme",
        "İtiraz etme",
      ]),
      "<p>haklarına sahiptir. Bu haklara ilişkin talepler, site iletişim kanalları üzerinden iletilebilir.</p>",
      "<h2>7. Veri Güvenliği</h2><p>Site, kişisel verilerin hukuka aykırı işlenmesini ve erişilmesini önlemek amacıyla uygun teknik ve idari güvenlik önlemlerini almaktadır.</p>",
      "<h2>8. Politika Değişiklikleri</h2><p>Bu gizlilik politikası gerektiğinde güncellenebilir. Güncel metin site üzerinde yayımlandığı tarihte yürürlüğe girer.</p>",
    ].join(""),
  },
  {
    slug: "kvkk-aydinlatma-metni",
    title: "KVKK Aydınlatma Metni",
    kind: "legal",
    sortOrder: 2,
    content: [
      "<p>Bıcırıklar Kids (“Veri Sorumlusu”) olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, kişisel verilerinizin işlenmesi, saklanması ve aktarılması ile ilgili sizleri bilgilendirmek isteriz.</p>",
      "<h2>1. Veri Sorumlusu</h2><p>KVKK kapsamında veri sorumlusu:</p>",
      ul(["Firma adı: Bıcırıklar Kids", "Adres: Yayla Mah. Vatan Cad. 45/B Tuzla / İstanbul", "E-posta: info@dholazer.com", "Telefon: 0 (536) 825 26 34"]),
      "<h2>2. İşlenen Kişisel Veriler</h2><p>Tarafımızca aşağıdaki kişisel veriler işlenebilmektedir:</p>",
      ul(["Ad, soyad", "Telefon numarası", "E-posta adresi", "Teslimat ve fatura adresi", "Sipariş ve ödeme bilgileri", "IP adresi ve site kullanım verileri"]),
      "<h2>3. Kişisel Verilerin İşlenme Amaçları</h2><p>Toplanan kişisel verileriniz;</p>",
      ul(["Siparişlerin alınması ve teslim edilmesi", "Ödeme işlemlerinin gerçekleştirilmesi", "Müşteri hizmetlerinin yürütülmesi", "Yasal yükümlülüklerin yerine getirilmesi", "Site güvenliğinin sağlanması", "Talep ve şikâyetlerin yönetimi"]),
      "<p>amaçlarıyla KVKK’nın 5. ve 6. maddelerine uygun olarak işlenmektedir.</p>",
      "<h2>4. Kişisel Verilerin Aktarılması</h2><p>Kişisel verileriniz, yukarıdaki amaçlarla sınırlı olmak üzere; kargo firmalarına, ödeme altyapısı sağlayıcılarına, yetkili kamu kurum ve kuruluşlarına ve hizmet aldığımız teknik altyapı sağlayıcılarına KVKK’nın 8. ve 9. maddelerine uygun şekilde aktarılabilir.</p>",
      "<h2>5. Kişisel Veri Toplama Yöntemi ve Hukuki Sebep</h2><p>Kişisel verileriniz; web sitesi üyelik ve sipariş formları, çerezler (cookies), iletişim formları ve elektronik iletişim kanalları aracılığıyla, bir sözleşmenin kurulması veya ifası, hukuki yükümlülüklerin yerine getirilmesi ve meşru menfaat hukuki sebeplerine dayanarak toplanmaktadır.</p>",
      "<h2>6. KVKK Kapsamındaki Haklarınız</h2><p>KVKK’nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>",
      ul([
        "Kişisel verilerinizin işlenip işlenmediğini öğrenme",
        "İşlenmişse bilgi talep etme",
        "İşleme amacını öğrenme",
        "Eksik veya yanlış işlenmişse düzeltilmesini isteme",
        "Silinmesini veya yok edilmesini isteme",
        "Aktarıldığı üçüncü kişileri öğrenme",
        "Otomatik sistemlerle analiz sonucu aleyhinize bir sonuca itiraz etme",
        "Zarara uğramanız halinde tazminat talep etme",
      ]),
      "<h2>7. Başvuru Yöntemi</h2><p>Haklarınıza ilişkin taleplerinizi yukarıdaki iletişim bilgileri üzerinden yazılı olarak veya e-posta ile bize iletebilirsiniz. Başvurunuz en geç 30 gün içinde ücretsiz olarak sonuçlandırılır.</p>",
    ].join(""),
  },
  {
    slug: "sartlar-ve-kosullar",
    title: "Şartlar ve Koşullar",
    kind: "legal",
    sortOrder: 3,
    content: [
      "<h2>1. Genel Hükümler</h2><p>Bu web sitesini ziyaret eden ve/veya alışveriş yapan tüm kullanıcılar, aşağıda yer alan şartları kabul etmiş sayılır. Site yönetimi, gerekli gördüğü durumlarda bu şartlarda değişiklik yapma hakkını saklı tutar.</p>",
      "<h2>2. Hizmet Tanımı</h2><p>Site üzerinden sunulan ürün ve hizmetler, yürürlükteki mevzuata uygun şekilde kullanıcılara sunulmaktadır. Site, ürün bilgileri, fiyatlar ve stok durumunda değişiklik yapma hakkını saklı tutar.</p>",
      "<h2>3. Üyelik ve Kullanıcı Sorumluluğu</h2>",
      ul(["Kullanıcı, siteye verdiği bilgilerin doğru olduğunu kabul eder.", "Hesap güvenliği kullanıcı sorumluluğundadır.", "Kullanıcı, siteyi hukuka aykırı amaçlarla kullanamaz.", "Başka kullanıcıların haklarını ihlal eden davranışlarda bulunulamaz."]),
      "<h2>4. Fikri Mülkiyet Hakları</h2>",
      ul(["Site içerisinde yer alan tüm içeriklerin (logo, tasarım, görseller, metinler vb.) fikri mülkiyet hakları site sahibine aittir.", "İzinsiz kopyalama, çoğaltma, dağıtma ve ticari kullanım yasaktır."]),
      "<h2>5. Sipariş ve Fiyatlandırma</h2>",
      ul([
        "Ürün fiyatları site üzerinde belirtildiği gibidir.",
        "Açık yazım hatalarından kaynaklanan fiyat yanlışlıklarında site yönetimi siparişi iptal etme hakkını saklı tutar.",
        "Stok tükenmesi durumunda sipariş iptal edilebilir ve kullanıcı bilgilendirilir.",
      ]),
      "<h2>6. Ödeme ve Güvenlik</h2>",
      ul(["Ödeme işlemleri, güvenli ödeme altyapıları üzerinden gerçekleştirilmektedir.", "Site, üçüncü taraf ödeme kuruluşlarından kaynaklanan sorunlardan doğrudan sorumlu değildir."]),
      "<h2>7. Teslimat</h2>",
      ul(["Teslimat koşulları ve süreleri ilgili ürün sayfasında veya mesafeli satış sözleşmesinde belirtildiği şekilde uygulanır.", "Mücbir sebepler halinde teslimat sürelerinde gecikme yaşanabilir."]),
      "<h2>8. Sorumluluğun Sınırlandırılması</h2><p>Site; teknik arızalar, internet kesintileri ve üçüncü taraf hizmet hataları nedeniyle oluşabilecek zararlardan sorumlu tutulamaz.</p>",
      "<h2>9. Kişisel Veriler</h2><p>Kullanıcıların kişisel verileri, ilgili Gizlilik Politikası ve KVKK hükümlerine uygun şekilde işlenir.</p>",
      "<h2>10. Uyuşmazlıkların Çözümü</h2><p>Bu şartlardan doğabilecek uyuşmazlıklarda Türkiye Cumhuriyeti mevzuatı uygulanır. Yetkili merci, tüketici işlemlerinde kullanıcının yerleşim yerindeki Tüketici Hakem Heyetleri ve Tüketici Mahkemeleridir.</p>",
    ].join(""),
  },
  {
    slug: "iade-politikasi",
    title: "İade Politikası",
    kind: "legal",
    sortOrder: 4,
    content: [
      "<h2>1. Cayma Hakkı</h2><p>Alıcı, satın aldığı ürünü teslim aldığı tarihten itibaren 14 (on dört) gün içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin cayma hakkına sahiptir. Cayma hakkının kullanılması için bu süre içinde satıcıya e-posta veya yazılı bildirim yapılması gerekmektedir.</p>",
      "<h2>2. İade Şartları</h2><p>Cayma hakkı kapsamında iade edilecek ürünlerin:</p>",
      ul(["Kullanılmamış olması", "Tekrar satılabilir durumda olması", "Orijinal ambalajının zarar görmemiş olması", "Tüm aksesuarları ile birlikte gönderilmesi"]),
      "<p>gerekmektedir. Bu şartları sağlamayan iadeler kabul edilmeyebilir.</p>",
      "<h2>3. İade Süreci</h2><p>Cayma bildiriminin satıcıya ulaşmasından sonra:</p>",
      ul(["Alıcı, ürünü 10 gün içinde geri göndermelidir.", "Ürün satıcıya ulaştıktan sonra iade süreci başlatılır.", "Ürün bedeli, en geç 14 gün içinde alıcının ödeme yaptığı yöntemle iade edilir.", "Bankaların iade süreleri değişkenlik gösterebilir."]),
      "<h2>4. İade Kargo Ücreti</h2><p>Cayma hakkı kapsamında yapılan iadelerde kargo ücretinin hangi tarafça karşılanacağı [NETLEŞTİRİLECEK — Admin › Sayfalar’dan güncelleyin]. Alıcının hatasından kaynaklanan iadelerde kargo ücreti alıcıya ait olabilir.</p>",
      "<h2>5. Cayma Hakkının Kullanılamayacağı Ürünler</h2><p>Aşağıdaki ürünlerde cayma hakkı kullanılamaz:</p>",
      ul(["Kişiye özel üretilen ürünler", "Hijyen nedeniyle iadesi uygun olmayan ürünler", "Hızlı bozulan veya son kullanma tarihi geçen ürünler", "Dijital içerikler ve anında ifa edilen hizmetler"]),
      "<h2>6. Hasarlı Ürünler</h2><p>Alıcı, kargo teslimi sırasında paketi kontrol etmelidir. Hasarlı paketler için kargo görevlisine tutanak tutturulmalıdır. Tutanak tutulmadan teslim alınan ürünler sağlam kabul edilir.</p>",
      "<h2>7. İletişim</h2><p>İade ve cayma talepleri için site üzerinde yer alan iletişim kanalları üzerinden bize ulaşabilirsiniz.</p>",
    ].join(""),
  },
  {
    slug: "cerez-politikasi",
    title: "Çerez Politikası",
    kind: "legal",
    sortOrder: 5,
    content: [
      "<p>Bu politika, Bıcırıklar Kids web sitesinde kullanılan çerezleri ve bunları nasıl yönetebileceğinizi açıklar. Kişisel verileriniz 6698 sayılı KVKK kapsamında işlenir; ayrıntılar için KVKK Aydınlatma Metni’ni inceleyebilirsiniz.</p>",
      "<h2>Çerez nedir?</h2><p>Çerezler, bir web sitesini ziyaret ettiğinizde tarayıcınıza kaydedilen küçük metin dosyalarıdır. Sitenin çalışmasını sağlamak, tercihlerinizi hatırlamak ve siteyi nasıl kullandığınızı anlamak için kullanılır.</p>",
      "<h2>Kullandığımız çerez kategorileri</h2>",
      "<h3>Zorunlu çerezler</h3><p>Sepetinizin ve favorilerinizin hatırlanması, oturum güvenliği ve çerez tercihinizin saklanması için gereklidir. Bu çerezler olmadan site düzgün çalışmaz; bu nedenle onayınıza bağlı değildir.</p>",
      "<h3>Analitik çerezler</h3><p>Yalnızca izin vermeniz halinde etkinleşir. Siteyi kaç kişinin ziyaret ettiğini ve hangi sayfaların kullanıldığını anlamamıza yardım eder (ör. Google Analytics).</p>",
      "<h3>Pazarlama çerezleri</h3><p>Yalnızca izin vermeniz halinde etkinleşir. Reklam kampanyalarının ölçülmesi ve size uygun içerik gösterilmesi için kullanılır (ör. Google Ads, Meta).</p>",
      "<h2>Tercihlerinizi nasıl yönetirsiniz?</h2><p>Siteye ilk girişinizde tercihinizi belirleyebilir, dilediğiniz zaman sayfanın alt kısmındaki “Çerez Tercihleri” bağlantısından değiştirebilirsiniz. Ayrıca tarayıcı ayarlarınızdan çerezleri silebilir veya engelleyebilirsiniz; zorunlu çerezleri engellemeniz halinde sepet gibi bazı özellikler çalışmayabilir.</p>",
      "<h2>İletişim</h2><p>Çerezler ve kişisel verilerinizle ilgili sorularınız için iletişim sayfamızdaki kanallardan bize ulaşabilirsiniz.</p>",
    ].join(""),
  },
  {
    slug: "mesafeli-satis-sozlesmesi",
    title: "Mesafeli Satış Sözleşmesi",
    kind: "legal",
    sortOrder: 6,
    content: [
      "<p><em>Bu metin 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği’ne göre hazırlanmış bir şablondur; yayına almadan önce hukuk danışmanınızla gözden geçiriniz.</em></p>",
      "<h2>1. Taraflar</h2><p><strong>Satıcı:</strong> Bıcırıklar Kids — Yayla Mah. Vatan Cad. 45/B Tuzla / İstanbul — info@dholazer.com — 0 (536) 825 26 34<br/><strong>Alıcı:</strong> Sipariş formunda bilgileri yer alan kişi.</p>",
      "<h2>2. Konu</h2><p>İşbu sözleşmenin konusu, alıcının satıcıya ait internet sitesinden elektronik ortamda siparişini verdiği, nitelikleri ve satış fiyatı sipariş özetinde belirtilen ürünün satışı ve teslimi ile ilgili olarak tarafların hak ve yükümlülüklerinin belirlenmesidir.</p>",
      "<h2>3. Sözleşme Konusu Ürün, Ödeme ve Teslimat</h2><p>Ürünlerin cinsi, miktarı, satış bedeli (vergiler dahil), kargo ücreti, ödeme şekli ve teslimat adresi sipariş özetinde ve sipariş onay e-postasında yer alır. Ürün, sözleşmenin kurulmasından itibaren yasal 30 günlük süre içinde alıcıya veya gösterdiği adresteki kişiye teslim edilir.</p>",
      "<h2>4. Cayma Hakkı</h2><p>Alıcı, ürünün kendisine veya gösterdiği adresteki kişiye teslim tarihinden itibaren 14 (on dört) gün içinde hiçbir gerekçe göstermeksizin ve cezai şart ödemeksizin cayma hakkını kullanabilir. Cayma hakkının kullanımına ilişkin koşullar İade Politikası’nda açıklanmıştır.</p>",
      "<h2>5. Cayma Hakkının İstisnaları</h2><p>Mesafeli Sözleşmeler Yönetmeliği’nin 15. maddesinde sayılan ürün ve hizmetlerde cayma hakkı kullanılamaz.</p>",
      "<h2>6. Genel Hükümler</h2><p>Alıcı, ürünün temel nitelikleri, satış fiyatı, ödeme şekli ve teslimata ilişkin ön bilgileri okuyup bilgi sahibi olduğunu ve elektronik ortamda gerekli teyidi verdiğini kabul eder.</p>",
      "<h2>7. Uyuşmazlıkların Çözümü</h2><p>İşbu sözleşmeden doğan uyuşmazlıklarda, Ticaret Bakanlığı’nca ilan edilen parasal sınırlar dahilinde alıcının yerleşim yerindeki Tüketici Hakem Heyetleri ile Tüketici Mahkemeleri yetkilidir.</p>",
    ].join(""),
  },
  {
    slug: "on-bilgilendirme-formu",
    title: "Ön Bilgilendirme Formu",
    kind: "legal",
    sortOrder: 7,
    showInFooter: false,
    content: [
      "<p><em>Bu metin Mesafeli Sözleşmeler Yönetmeliği’nin 5. maddesine göre hazırlanmış bir şablondur; yayına almadan önce hukuk danışmanınızla gözden geçiriniz.</em></p>",
      "<h2>Satıcı Bilgileri</h2><p>Bıcırıklar Kids — Yayla Mah. Vatan Cad. 45/B Tuzla / İstanbul — info@dholazer.com — 0 (536) 825 26 34</p>",
      "<h2>Ürün ve Fiyat Bilgileri</h2><p>Sözleşme konusu ürünlerin temel nitelikleri, vergiler dahil toplam fiyatı ve kargo ücreti ödeme sayfasındaki sipariş özetinde gösterilir.</p>",
      "<h2>Ödeme ve Teslimat</h2><p>Ödeme, ödeme adımında seçilen yöntemle yapılır. Ürün, en geç 30 gün içinde alıcının belirttiği adrese teslim edilir.</p>",
      "<h2>Cayma Hakkı</h2><p>Alıcı, teslim tarihinden itibaren 14 gün içinde cayma hakkını kullanabilir. Cayma bildirimi, İade Politikası’nda belirtilen iletişim kanallarına yapılır.</p>",
      "<h2>Şikâyet ve İtirazlar</h2><p>Şikâyet ve itirazlar için iletişim kanallarımızı kullanabilir, parasal sınırlar dahilinde Tüketici Hakem Heyetleri’ne veya Tüketici Mahkemeleri’ne başvurabilirsiniz.</p>",
    ].join(""),
  },
  {
    slug: "hakkimizda",
    title: "Hakkımızda",
    kind: "info",
    sortOrder: 10,
    showInFooter: false,
    excerpt: "Bıcırıklar Kids, çocukların kendi oyuncaklarını ve çantalarını kendi elleriyle üretebilmesi için keçe dikiş kitleri ve eğitici aktivite setleri hazırlar.",
    content: [
      "<h2>Minik eller için büyük hayaller</h2>",
      "<p>Bıcırıklar Kids; çocukların hayal gücünü harekete geçiren, el becerilerini kullanmaya davet eden ve üretmenin mutluluğunu yaşatan dikiş ve aktivite setleri hazırlar. Keçe çanta ve figürlü elyaf dolgulu keçe oyuncak kitlerimiz, çocukların güvenle kullanabileceği şekilde özenle hazırlanır.</p>",
      "<p>Her sette renkli keçe parçalar, çocuklar için plastik güvenli iğne ve adım adım ilerlemeyi kolaylaştıran bir anlatım bulunur. Böylece minikler kendi oyuncaklarını ve çantalarını kolayca üretebilir.</p>",
      "<h2>Ürün yelpazemiz</h2>",
      ul(["Keçe çanta dikiş kitleri", "Figürlü elyaf dolgulu keçe oyuncak kitleri", "Eğitim dikiş setleri", "Punch / örgü setleri", "Ahşap boyama setleri", "Eğitici aktivite ve kendin yap (DIY) kitleri"]),
      "<h2>Nasıl çalışıyoruz?</h2>",
      "<p>Ürünlerinizi sipariş verdiğiniz haliyle, birebir aynı şekilde teslim ederiz; bütün siparişler özenle paketlenir. Geleceğimiz olan pırıl pırıl çocuklarımız için özenle çalışıyoruz.</p>",
    ].join(""),
  },
  {
    slug: "kargo-ve-teslimat",
    title: "Kargo ve Teslimat",
    kind: "info",
    sortOrder: 11,
    showInFooter: false,
    content: [
      "<p>Tüm siparişler özenle paketlenerek anlaşmalı kargo firması ile gönderilir. Siparişiniz kargoya verildiğinde takip bilgisi e-posta adresinize iletilir ve <a href=\"/siparis-takibi\">Sipariş Takibi</a> sayfasından da görüntülenebilir.</p>",
      "<h2>Teslimat süresi</h2><p>Ürün, yasal olarak en geç 30 gün içinde teslim edilir. Güncel kargoya teslim süresi ve kargo ücreti bu sayfanın üst kısmında gösterilir.</p>",
      "<h2>Hasarlı paket</h2><p>Teslim sırasında paketi kontrol ediniz. Hasarlı paketler için kargo görevlisine tutanak tutturmanız gerekir; tutanak tutulmadan teslim alınan ürünler sağlam kabul edilir.</p>",
    ].join(""),
  },
];

/** /sss sayfasının soruları (sayfada görünür → FAQPage şeması). */
export const SITE_FAQ: FaqItem[] = [
  { question: "Siparişim ne zaman kargoya verilir?", answer: "Siparişler özenle paketlenerek kargoya verilir. Güncel kargoya teslim süresi Kargo ve Teslimat sayfasında yer alır; kargoya verildiğinde takip bilgisi e-posta ile iletilir." },
  { question: "Siparişimi nasıl takip edebilirim?", answer: "Sipariş Takibi sayfasına sipariş numaranızı ve sipariş verirken kullandığınız e-posta adresini yazarak siparişinizin durumunu görebilirsiniz." },
  { question: "Ürünü iade edebilir miyim?", answer: "Ürünü teslim aldığınız tarihten itibaren 14 gün içinde cayma hakkınızı kullanabilirsiniz. Ürünün kullanılmamış ve tekrar satılabilir durumda olması gerekir. Ayrıntılar İade Politikası sayfasındadır." },
  { question: "Dikiş kitlerinde iğne güvenli mi?", answer: "Kitlerimizde çocuklar için plastik güvenli iğne kullanılır. Küçük yaştaki çocukların aktiviteyi bir yetişkin eşliğinde yapmasını öneririz." },
  { question: "Kitin içinde neler var?", answer: "Her ürünün tam içeriği ürün sayfasındaki “Paket İçeriği” bölümünde listelenir. Keçe çanta kitlerinde keçe parçalar, plastik güvenli iğne ve dikiş ipi bulunur." },
  { question: "Hangi yaş için uygun?", answer: "Önerilen yaş aralığı her ürün sayfasında belirtilir. İlk deneyim için daha az parçalı kitleri tercih edebilirsiniz." },
];
