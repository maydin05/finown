# Kartın ilk ekstre ayı — yerel uygulama

3 Kasım 2026. Kullanıcı ilk ekstre ayı özelliğinin yerelde hazırlanmasını, Kasım 2026 başlangıcının test edilmesini ve mevcut ödeme kayıtlarının korunmasını istedi. O aşamada yayın yetkisi verilmemişti. Sonraki onaylı işlem ve canlı kabul [üretim yayın kaydında](2026-11-03_ilk-ekstre-ayi-yayin.md) takip edilir.

## Davranış

- Fiziki kart formunda isteğe bağlı “İlk ekstre ayı” için yıl/ay seçimleri bulunur. Yalnız yıl veya yalnız ay kaydedilemez; seçim kaldırılabilir, iptal mevcut kartı değiştirmez. Native month alanı yerine açık yıl/ay seçimleri kullanılır.
- `firstStatementMonth` yalnız otomatik boş ekstre üretimini sınırlar. Başlangıçtan önce kaydedilmiş gerçek ödeme, tutarı sıfır olsa veya ödendi işaretli olsa bile korunur ve ilgili ayda görünür. Sınırdan sonraki kayıtlı ekstreye ikinci bir boş satır eklenmez.
- Başlangıç bilinmiyorsa eski davranış sürer; en eski ödeme veya kart adından başlangıç tahmin edilmez. Sanal kart bağımsız ekstre oluşturmaz. Bozuk başlangıç bilgisi toplamı kesinmiş gibi göstermez; eksik bilgi uyarısına katılır.
- Ödemeler, Özet/bakiye akışı, bankanın salt okunur kart ayrıntısı ve ortak hesap aynı alanı kullanır. Ortak sunucu yalnız kapsamda seçili ürüne ait başlangıcı aktarır; yetki genişlemez.
- API yalnız ürün alanını normalleştirip kaydeder. Bu işlem ödeme tablosuna yazmaz; tutar/tarih/durum değişikliği veya ekstre geçmişi üretmez. Kısmi ürün düzenlemesi başlangıç alanını silmez.
- Başlangıç değişirse bakiye güncellik temeli değişir. Alan bütün kartlarda boşken mevcut bakiyelerin eski temeli korunur; sırf nullable kolonun eklenmesi bütün bakiyeleri eskimiş yapmaz.

## Veritabanı hazırlığı

`supabase/migrations/202611030001_card_first_statement_month.sql`, `products.first_statement_month` için nullable DATE alanı ve ayın ilk günü/kart türü/aralık kontrolü ekler. Backfill, ödeme güncellemesi, yeni tablo veya erişim kuralı içermez.

Migration yalnız geçici yerel PostgreSQL’de ayrı test şemasına uygulanarak doğrulandı. Önce/sonra ödeme satırları birebir aynı; boş alanın geriye dönük doldurulmadığı ve geçersiz ay/gün/ürün türlerinin reddedildiği kontrol edildi. Bu çalışma üretimde migration çalıştırmadı. Yayın öncesinde canlı şema kontrolü ve migration için kullanıcı yetkisi gerekir.

## Kontroller

- 82 birim testi: ay sınırı, yıl geçişi, eksik/bozuk başlangıç, kayıtlı geçmişin korunması, API’nin yalnız ürün yazması, ortak DTO/geçmiş ve bakiye güncelliği dahil başarılı.
- 16 gerçek yerel Auth/PostgreSQL sunucu testi, yeni migration ve ortak uç noktadan alanın aktarımı dahil başarılı.
- 96 mobil test başarılı: yeni altı test 320/375/430 px genişliklerde Ekim satırının bastırılmasını, kayıtlı üç ayın tutar/tarih/durumlarını, kısmi seçimi, iptali, temizlemeyi, Özet’i ve salt okunur banka ayrıntısını kapsar. Görüntüleme/kaydetme işlemleri sentetik React durumunda; üretim veya haricî istek yok.
- Gerçek iki yerel hesapla ortak ana sayfa akışında üç mobil test daha başarılı; toplam 99 mobil test. Ortak salt okunur görünüm, kapsam/üyelik kaldırma ve kaynak kayıtlarının korunması kontrol edildi. Lint ve üretim build başarılı; mevcut bundle/Browserslist uyarıları sürüyor.
- Önceden alınmış özel yerel veri kopyasında da Kasım 2026 başlangıcı denenerek önceki otomatik satırın bastırıldığı ve mevcut üç kaydın değiştirilmediği doğrulandı. Kaynak kopya dosyası aynı kaldı; bu kontrolün canlı veri tazeliği iddiası yoktur.
- Önizlemenin gizli test çıktısı dar mobilde taşma yaratıyordu; çıktı gerçek `hidden` alanına alındı. Mobil testte yalnız innerWidth karşılaştırması yerine istenen viewport genişliği de kontrol ediliyor.
- Formun mobil görüntüsü incelendi ve özel yerel alana alındı. Geçici viewport sıfırlandı.

## Önizleme ve sınır

DEV-only `/tests/card-statements-preview.html`: örnek banka/kart ve örnek tutarlar içerir; Ekim’le başlar, ilk ekstre ayı Kasım 2026’dır. Formu değiştirip kaydetmek yalnız bu sayfanın belleğini değiştirir. Gerçek oturum veya DB bağlantısı yoktur.

Bu yerel kontrol aşamasında commit/push/deploy yapılmamış ve canlı kart kaydına başlangıç yazılmamıştı. Sonraki onaylı işlemler üretim yayın kaydındadır. Gerçek ödeme kayıtları, tutarlar, tarihler ve durumlar bu çalışma tarafından değiştirilmedi. Özel kopyalar ve görüntüler Git dışında tutulur; çalışma yerel kapsamda kaldığından dış kartlara içerik gönderilmedi.
