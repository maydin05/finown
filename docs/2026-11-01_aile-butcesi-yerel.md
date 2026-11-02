# Aile bütçesi ve harcama talepleri — yerel uygulama

> Üretim güncellemesi: Bu belge yerel aşamanın tarihsel kaydıdır. Güncel yayın için [üretim kaydına](2026-11-02_aile-butcesi-yayin.md) bak.

> Güncelleme — 1 Kasım 2026: Bu belgedeki “sunucu/iki hesap henüz uygulanmadı” ifadeleri ilk IndexedDB teslimini anlatır. Sonraki yerel sunucu, ayrı oturum ve RLS hazırlığı için [yeni kayıt](2026-11-01_aile-butcesi-sunucu-yerel.md) geçerlidir. Üretim kabulü yoktur.

1 Kasım 2026. Kullanıcı yan sohbetten devredilen modülün bağımsız incelenmesini, bulunan sorunların giderilmesini, ana uygulamaya yerelde aktarılmasını ve mobil testini istedi. GitHub/push/deploy ve üretim veri değişikliği kapsam dışıdır.

## Teslimin sınırı

Bu sürüm **ana React uygulamasına eklenen, yalnız geliştirmede açılan yerel deneme modülüdür**. `/family` rotası ve hesap menüsündeki giriş yalnız `import.meta.env.DEV` içinde bulunur. Üretim derlemesine aile kodu/deposu girmez. Bağımsız test ekranı `/tests/family-preview.html` aynı bileşeni çalıştırır.

Yerel IndexedDB ayrı tutulur: `finown-family-local-v1`. Talep sahibi / bütçe sahibi değiştiricisi açıkça bir **deneme görünümüdür**, gerçek kimlik doğrulama değildir. İki cihazda iki gerçek oturumla ortak bütçe, Supabase üyelik/RLS/davet, güvenilir sunucuda bütçe değerlendirme ve atomik onay henüz uygulanmış değildir. Yerel rol/sürüm kontrolleri bunların yerine geçmez. Bu teslim üretim veya gerçek ortak hesap kabulü değildir.

Mevcut Supabase veri/API/şema/RLS dosyaları değiştirilmez. Eski ödeme, kaynak, bakiye veya ödeme durumu güncelleme fonksiyonları aile modülünden çağrılmaz. Gerçek davet gönderilmez, hesaba erişim verilmez.

## Yerel işlevler

- Başlangıçta yalnız sentetik kayıtlar; ayrı bir alan üzerinden mevcut hesaptan **açıkça seçilen** kaynak ve ödemelerle salt okunur hesap. Kayıt seçimi gerçek paylaşım değildir. Kaynağın dönemlik alındı/ödeme geçmişi seçili kaynağa bağlı kullanılır; banka/kaynak kayıtları otomatik seçilmez. Kişisel çalışma alanı mevcut hesap kimliğine göre ayrılır.
- İhtiyaç adı, tutar, tarih, kategori, öncelik, açıklama, güvenli http/https ürün bağlantısı.
- Tutar/kart onayı, düşük teklif, teklifin güncel koşullarla kabulü, gerekçeli erteleme/uygun bulmama/geri çekme/iptal.
- Onay rezerv oluşturur. Gerçek alışveriş tek kayıtta rezervin yerini alır. Farklı tutar (daha düşük olsa da), tarih/kart veya dönem belirsizliği inceleme ister; gerçek harcama bütçeden kaybolmaz. Gelecek tarihli fiili alım reddedilir.
- Açıklama gibi mali olmayan düzenlemeler kararı korur; tutar/tarih değişikliği eski onay ve teklifi kaldırır.
- Yorumlar, zaman damgalı eklenen olay geçmişi, karar anındaki koşullar ve kişi bazında okunmamış bildirimler. Yerel olaylarda düzenleme/silme işlemi yoktur; tarayıcı deposu gerçek sunucu denetim kaydı değildir.
- Aynı IndexedDB yazma işlemi içinde okuma, sürüm kontrolü, değerlendirme ve kayıt; eski bütçe sürümü reddedilir. İşlem kimliği ile aynı içerikli tekrar yeni kayıt/olay üretmez. Diğer sekmelere bildirim ile yenileme.

## Hesap ve inceleme düzeltmeleri

- Mevcut `cashFlow` / `balanceFlow` kuralları kullanılır. Aynı gün bütün ödemeler gelirden önce değerlendirilir; yalnız adayın ödeme gününe kadar değil 90 günlük planın tamamına bakılır. Kayıtlı gecikenler bugün ödenecek varsayılır; gerçek vadeleri değiştirilmez.
- Güncel bakiye, güvenlik payı, zorunlu kayıtların açık kapsam teyidi, eksik ekstre ve belirsiz durumlar kontrol edilir. Eksik veriden kesin uygunluk üretilmez. Kaynak/bakiye değişikliği kapsam teyidini düşürür. Seçilmeyen özel kayıtların içeriği yerel bütçe kapsamına kopyalanmaz; değişiklik kontrolü için parmak izi kullanılır.
- Legacy durum çakışmaları seçili alt kümeden değil tam kaynak kimliği alanından, **her ay ayrı** çözülür. Bir aydaki yeni anahtar başka ayın çakışmasını kapatmaz.
- Kullanılabilir kart limiti tanımlı limitten ayrıdır; güncel teyit gerekir. Ana/sanal kart ortak rezervleri birlikte düşülür; sanal kartın kendi kullanılabilir limiti de doğrulanır. Eksik/döngülü ana kart bağı ve kesim günü belirsizliği onayı engeller.
- Gerçek nakit harcaması güncel bakiyeye, kart harcaması güncel kullanılabilir limite yansımışsa ayrıca tekrar düşülmez. Bunun için sahibi her harcamayı açıkça sınıflandırır; yeni bakiye veya değişmiş harcama eski teyidi geçersiz kılar. Bilinmeyen yansıma kesin onayı kapatır; ihtiyatlı senaryo kesin açık diye sunulmaz.
- Gerçek kart harcamasının mevcut ekstreye dahil olduğu aynı ana kart/tarih/tutar ve toplu tutar sınırıyla doğrulanabilir. Bu yalnız yerel ilişkilendirmedir; eski ödeme değiştirilmez, yeni ödeme yaratılmaz.
- Kısmi alım, iade ve satın alma sonrası fiili tutar düzeltmesi bu sürümde sunulmaz. Bunlar gerçekleşmiş borcu iptal ederek gizlemeye dönüştürülmez.

## Kontroller

Yan sohbetin 12 hedefli testi bağımsız olarak tekrar çalıştırıldı ve geçti. Yeni domain, yerel depo ve mobil akış testleri ile mevcut ekranların regresyon testleri repo içinde tutulur. Son çalıştırma sonuçları aşağıya kaydedilir. Fiziksel telefon / gerçek iki ayrı hesap / üretim DB / canlı kabul bu testlerin kapsamı değildir.

## Üretime geçiş için kalan uygulama

- Gerçek iki kullanıcı üyeliği ve davetin doğrulanmış kimliğe bağlanması; varsayılan özel RLS'yi genişletmeden ortak kayıtlara sınırlı erişim.
- Güvenilir sunucunun güncel seçilmiş kayıtları okuması; rol/üyelik, bütçe/limit değerlendirmesi, sürüm ve tekrar kontrolünün tek sunucu işlemiyle uygulanması.
- Sunucuda değiştirilemez olay geçmişi ve bildirim; aileler arası erişim/rol ihlali, eşzamanlı onay ve gerçek mutabakat testleri.
- Yerel deposu gerçek paylaşım altyapısı yapılmadan geliştirme kapısı kaldırılmamalıdır. Bu iş için üretim migration uygulanmamıştır; yeni SQL migration dosyası da hazırlanmış değildir.

## Son doğrulama sonuçları

- Yan sohbet önizlemesi: 12/12 hedefli test başarılı.
- `npm test`: 69/69 başarılı; bunun 19'u aile domain kuralları içindir. Kayıt seçiminde asıl verinin aynı kaldığı kontrol edilir.
- `npm run test:mobile`: son tam koşuda 84/84 başarılı. 18 aile akışı testi (6 senaryo × 320/375/430 px), önceki ekranlardan 66 regresyon testi. Aile akışlarında gerçek Supabase REST yazmaları engellenir; normal işlem boyunca böyle bir yazma isteği oluşmadığı ayrıca izlenir.
- Yerel IndexedDB sınırında iki bağımsız depo istemcisi aynı sürümle eşzamanlı onay gönderdi: tek onay/olay, diğerinde sürüm hatası. Bu sunucu veya iki gerçek kullanıcı kabulü değildir.
- Görsel tarayıcı kontrolü: 375 × 667, örnek talep oluşturma ve kart seçerek onaylama; yatay taşma yok. Görüntü Git dışındaki `docs/private.local/aile-yerel-375.png` içinde. Kontrol sonrası viewport sıfırlandı, yerel deneme sekmesi açık bırakıldı.
- ESLint, üretim derlemesi, `git diff --check` başarılı. Üretim çıktısında yerel modülün metni/depo kimliği bulunmadığı kontrol edildi. Önceden mevcut büyük JS paketi ve Browserslist güncellik uyarıları sürüyor.
- Ara iki toplu koşuda mevcut maaş formunun boş tutar kontrolü 375 px'te beklenen özel mesaj yerine genel hata mesajı gösterdi. Kaynak dosyaları değiştirilmeden yapılan ayrı 5 tekrar ve son tam 84 test geçti. Neden kesinleştirilmedi; maaş formuna bu çalışma kapsamında değişiklik yapılmadı.
- Commit, push, Netlify deploy, Supabase veri/şema değişikliği, gerçek kullanıcı daveti yapılmadı. Aile modülü gerçek kayıt güncelleme API'lerini kullanmaz.
