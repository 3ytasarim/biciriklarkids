import type { FaqItem } from "@/lib/db/schema";

/**
 * Ana sayfa "merak edilenler" (GEO): arama ve yanıt motorlarının kolayca alıntılayabileceği,
 * kısa ve doğrulanabilir yanıtlar. Ürün özellikleri mevcut sitedeki bilgilerle sınırlıdır; abartı/iddia yok.
 */
export const BRAND_FAQ: FaqItem[] = [
  {
    question: "Keçe dikiş kiti nedir?",
    answer:
      "Keçe dikiş kiti; hazır kesilmiş keçe parçaları, çocuklar için plastik iğne ve dikiş ipinden oluşan bir el işi setidir. Parçalar adım adım dikilerek bir çanta ya da yumuşak bir oyuncak haline getirilir. Makine, makas veya özel bir beceri gerekmez.",
  },
  {
    question: "Keçe oyuncak kiti nedir?",
    answer:
      "Keçe oyuncak kiti, figür şeklindeki keçe parçalarının birbirine dikilip içine elyaf dolgu konularak yumuşak bir oyuncağa dönüştürüldüğü kittir. Bıcırıklar Kids’in figürlü elyaf dolgulu keçe oyuncak kitlerinde deniz ve kara hayvanları gibi farklı figürler bulunur.",
  },
  {
    question: "Bir dikiş kitinin içinde neler bulunur?",
    answer:
      "Bıcırıklar Kids keçe çanta kitlerinde keçe parçalar, plastik güvenli iğne ve dikiş ipi bulunur; dikiş ipi ihtiyaçtan fazla konur. Oyuncak kitlerinde ayrıca dolgu için elyaf yer alır. Her ürünün tam içeriği ürün sayfasındaki “Paket İçeriği” bölümünde listelenir.",
  },
  {
    question: "Çocuklar için dikiş seti nasıl kullanılır?",
    answer:
      "Önce parçalar masaya yayılır ve bitmiş ürünün görseli incelenir. İğneye ip geçirilip düğüm atılır, ardından üst üste getirilen parçalar kenardaki delikler takip edilerek dikilir. Oyuncak kitlerinde son aşamada elyaf doldurulup açıklık kapatılır; çanta kitlerinde sap takılır.",
  },
  {
    question: "Yaş grubuna göre aktivite seti nasıl seçilir?",
    answer:
      "Her ürün sayfasında önerilen yaş aralığı ve zorluk seviyesi yer alır. İlk kez dikiş yapacak çocuklar için daha az parçalı ve büyük figürlü kitler, deneyimli çocuklar için çok parçalı setler uygundur. Küçük yaşlarda aktivitenin bir yetişkin eşliğinde yapılması önerilir.",
  },
  {
    question: "Çocuklara hangi yaratıcı aktivite seti alınabilir?",
    answer:
      "Dikmeyi sevenler için keçe çanta ve keçe oyuncak kitleri, sistemli ilerlemek isteyenler için eğitim dikiş setleri, farklı bir doku deneyimi için punch (örgü) setleri, boyamayı sevenler için ahşap boyama setleri öne çıkar. Hediye için “Tam Hediyelik” etiketli ürünlere bakabilirsiniz.",
  },
];
