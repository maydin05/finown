# Ortak hesapta ana sayfalar — yerel uygulama

## Onaylı kapsam

İkinci üye Özet, Ödemeler, Gelir, Abonelikler ve Bankalar sayfalarını mevcut tasarım ve gezinmeyle, yalnız bütçe sahibinin paylaştığı kayıtlar üzerinden görür. Finans kayıtları salt okunurdur. Aile bütçesindeki mevcut harcama talebi akışı korunur.

Bu çalışma yereldir. Commit, push, deploy veya üretim veritabanı işlemi yapılmadı. Mevcut paylaşım kapsamı değiştirilmez. Yeni migration gerekmiyor.

## Uygulama

- Oturumdan sonra sunucunun üyelik listesi okunur. Kendi bütçesinin sahibi kişisel veri sağlayıcısını kullanır; başka bütçenin ikinci üyesi ortak veri sağlayıcısını kullanır. Hesap değişiminde önceki sağlayıcı kaldırılır.
- `GET /family-api/budgets/:id/main-view` her istekte üyeliği doğrular. Mevcut korumalı finans okuma fonksiyonu kullanılır; RLS veya tablo yazma izinleri genişletilmez. POST kabul edilmez.
- Sunucu yalnız seçili kaynak, ödeme, ürün ve bunlara bağlı gelir/abonelik gerçekleşmelerini açık alan listesiyle döndürür. Banka adı/renkleri yalnız seçili ürün/aboneliğin bağımlılığı olduğunda eklenir. Kullanıcı kimlikleri, seçilmemiş ürün/ana kart bilgileri ve ham özel veri parmak izi aktarılmaz.
- Eski dönem işaretlerinin belirsizliği filtrelemeden önce değerlendirilir. Paylaşılmayan kaydın aynı kimliği taşıması, seçili geliri/gideri yanlışlıkla alınmış/ödenmiş yapamaz. Gerçek aylık gelir tutarları ve arşiv/toplam dışı durumları korunur.
- Bakiye ancak mevcut kapsamda `balance` seçiliyse gösterilir. Güncellik asıl veri bütünü üzerinden kontrol edilir; ham parmak izi yerine sunucunun kararlı HMAC değeri kullanılır. Paylaşılmayan bakiye sıfır sayılmaz.
- Paylaşılmayan karta bağlı seçili abonelik nakit çıkışına dönüştürülmez; bağlantı uyarısı korunur ve çift sayım yapılmaz.
- Ortak sağlayıcıdaki bütün finans yazma metotları kapalıdır. Ekleme/düzenleme/silme/ödeme işaretleme/ekstre girişi/bakiye düzenleme kontrolleri kaldırılır. Ayrıntı pencereleri, filtreler, ay geçişleri, bakiye akışı ve avantajlı kartlar kullanılabilir.
- Ortak veriler beş saniyede bir yeniden yetkilendirilerek okunur. Hata veya üyelik kaybında görünüm temizlenir. Veri/kapsam revizyonu değiştiğinde açık eski ayrıntılar kaldırılır. Kalıcı finans verisi önbelleği oluşturulmaz.
- Aile bütçesine gidildiğinde ikinci üyenin mevcut bütçesi otomatik açılır; talep oluşturma ve geçmiş ekranı kullanılmaya devam eder.

## Doğrulama

- Birim: 77 test başarılı; kapsam/alan izin listesi, eski dönem belirsizliği, gerçek aylık gelir, kart aboneliği ve arşiv/toplam dışı durumları dahil.
- Gerçek yerel Supabase Auth + geçici PostgreSQL: 15 test başarılı. İki ayrı oturum, üçüncü hesabın reddi, oturumsuz istek, POST reddi, kapsam değişimi, bakiye güncelliği, kısıtlı üretim function sözleşmesi ve üyelik kaldırma kontrol edildi. Finans tablolarının önce/sonra tam satır karşılaştırması eşit.
- Mevcut mobil ekranlar: 84 test başarılı, 320/375/430 px.
- Yeni ana sayfa akışı: üç mobil genişlikte başarılı. Görüntüleme sürecinde finans/aile yazma isteği veya üretim Supabase isteği yok. Kapsam kaldırıldığında açık detay kapandı; üyelik kaldırıldığında ortak veriler kaldırıldı.
- Mevcut aile/Auth akışları ve yeni ortak ana sayfalar birlikte: 15 gerçek yerel oturum mobil testi başarılı (önceki 84 mobil testle birlikte toplam 99).
- Lint ve üretim build başarılı; önceki bundle boyutu/Browserslist uyarıları sürüyor.

## Sınırlar

Canlı sürüm bu değişikliği içeriyor diye doğrulanmadı; yayın yapılmadı. Gerçek eş hesabıyla canlı kabul, onaylı bir yayından sonra ayrı kontrol edilmelidir. Test hesapları ve finans verileri geçici yerel ortamda sentetiktir; gerçek hesap, davet veya e-posta oluşturulmadı/gönderilmedi.

Yerel test görüntüsü incelendi; sentetik veri içerir. Kanıt `docs/private.local/` altında tutulur. Çalışma yerel kapsamda tutulduğundan GitHub/Trello’ya test yorumu veya görsel gönderilmedi.
