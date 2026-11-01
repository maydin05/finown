# Ödemeler, gelirler, abonelikler ve bankalar — kompakt üst alanlar

1 Kasım 2026. Kullanıcı özet sayfasındaki kompakt yaklaşımın diğer dört sayfaya uygulanmasını istedi. Bu aşama yerel uygulama ve test kapsamındadır; commit, push ve deploy yapılmadı. Üretim veritabanına bağlanılmadı veya yazılmadı.

## Değişiklikler

- Ortak logo/eylem alanı tüm uygulama sayfalarında özet sayfasının kompakt yüksekliğini kullanıyor.
- Ödemeler, gelirler ve aboneliklerde sayfa adı ile ay seçimi aynı satırda. Önceki/sonraki ay ve bu aya dön eylemleri korunuyor.
- Aylık toplam ve ikincil toplamlar yan yana, daha küçük bir kartta; sayfa renkleri ve tutar etiketleri korunuyor. Aboneliklerin yıllık tahmini ve geçmiş ödeme toplamı erişilebilir durumda.
- Sekme, vade filtresi ve kart aralıkları daraltıldı. Eksik ekstre uyarısı görünür kalıyor.
- Eksik gider bilgileri sayısı görünür bir açılır alanda. Kart ekstresinden takip edilen eski giderler listenin altına taşındı; ayrı toplanmama açıklaması korunuyor.
- Bankalarda toplam borç, tanımlı limitler ve kredi borcu daha dar kartta. Elden borç açıklaması açılabilir; elden borç ve hesap listeleri daha erken başlıyor. Banka ayrıntısının başlık aralıkları da aynı çizgide.

Hesaplamalar, API, kayıt işleme fonksiyonları, ödeme tarihleri ve durumları değiştirilmedi. Veritabanı güncellemesi gerekmiyor.

## Doğrulama

- Önceden var olan 51 mobil senaryo geçti.
- 320/375/430 × 667 için üç ek senaryo geçti: dört sayfada yatay taşma yok; özet kartı 155 px altında, ilk kayıt 410 px üst sınırından önce başlıyor ve alt gezinmenin üzerinde tamamen görünüyor. Ay değiştirme ve borç ayrıntısı da kullanılabilir.
- 41 birim/API testi, ESLint, üretim derlemesi ve diff kontrolü başarılı. Mevcut büyük JS paketi uyarısı devam ediyor.
- Dört sayfa 375 × 667 örnek veri ekranında görsel olarak kontrol edildi. Yerel görüntüler Git dışındaki `docs/private.local/` içindedir.
- Kontroller tarayıcı mobil ölçülerinde ve sentetik verilerle yapıldı; canlı veya fiziksel cihaz kabulü değildir.

Yerel ekran: http://127.0.0.1:5175/tests/ui-preview.html?app=1 . Alt gezinmeden dört sayfa açılabilir.
