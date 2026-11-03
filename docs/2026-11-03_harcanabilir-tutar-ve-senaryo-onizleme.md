# Harcanabilir tutar ve maaş senaryoları — tasarım önizlemesi

Durum: 3 Kasım 2026, yalnız yerel tıklanabilir tasarım. Ana uygulamaya entegrasyon, veritabanı değişikliği, commit/push veya yayın yapılmadı. Gerçek hesap verileri okunmadı ve kullanılmadı.

## Amaç

Mevcut `IncomeBridge` ödeme açığını, `CashFlowSummary` beklenen gelir ile ödemelerin farkını gösteriyor. Öneri, yeni ekranlar eklemek yerine kompakt ana ekranda harcanabilir tutar ve kayıtlardan bağımsız maaş/harcama denemesi sunmak.

Önizleme: http://127.0.0.1:5175/tests/spend-scenarios-preview.html

Tek dosya, dış kütüphane veya API isteği yok. Tüm tutarlar, tarihler ve isimler sentetik örnektir. Öncesi sekmesi mevcut yaklaşımın sadeleştirilmiş temsili; canlı ekranın birebir kopyası değildir. Sayfa yenilenince denemeler sıfırlanır; hiçbir kayıt veya tarayıcı deposuna yazılmaz.

## Örnek model

Örnek bugün 3 Kasım 2026, aralık 3 Kasım–2 Aralık (30 gün): başlangıç 25.000 TL; 5 Kasım 10.000 TL, 9 Kasım 8.000 TL, 21 Kasım 12.000 TL, 24 Kasım 106.000 TL ödeme; 20 Kasım beklenen maaş 120.000 TL. Korunacak 5.000 TL, 3.000 TL güvenlik payı ve ödeme toplamında yer almayan 2.000 TL ortak bütçe rezervinden oluşur.

Harcanabilir tutar, başlangıç dahil dönem boyunca gelirden önceki ödemeler de dikkate alınarak en düşük bakiyeden korunacak tutarın çıkarılmasıdır; negatif sonuç sıfır gösterilir. Dönem sonu bakiye tek başına harcama payı kabul edilmez. Sonuç bilinen kayıtlara ve beklenen gelire bağlı tahmindir. Aynı gün ödemeler gelirden önce varsayılır. Üretime uygulanacak hesapta mevcut aile bütçesi rezervleriyle çifte düşüm yapılmamalıdır.

| Deneme | Sonuç |
| --- | --- |
| Ana plan | En düşük bakiye 7.000 TL, harcanabilir 2.000 TL, dönem sonu 9.000 TL |
| Maaş 115.000 TL | Harcanabilir 0 TL; ödeme açığı yok, korunacak tutarda 1.000 TL eksik |
| Maaş 140.000 TL | Harcanabilir yine 2.000 TL; maaş öncesindeki dar dönem değişmez |
| Maaş 3 gün gecikir | İlk açık 21 Kasım, en yüksek açık 5.000 TL |
| Bugün 10.000 TL ek harcama | İlk açık 9 Kasım, en yüksek açık 3.000 TL |
| Geciken örnek 4.000 TL dahil | Harcanabilir 0 TL; korunacak tutarda 2.000 TL eksik |
| Eksik ekstre | Harcanabilir tutar sayısal olarak kesinleştirilmez |

## Tıklanabilir alanlar

- Öncesi/sonrası sekmeleri.
- Hesabı gör ayrıntısı, güvenlik payı ve rezerv açıklaması.
- Maaş tutarı, 0–10 gün gecikme, bugünkü ek harcama; dört hazır deneme.
- Denemeyi ekranda gösterme, kaydetmeden kapatma ve ana plana dönme.
- Eksik ekstre ve geciken ödeme örnek seçenekleri.

## Kontrol ve sınırlar

Playwright ile 320/375/430×812 görünümünde toplam 36 kontrol başarılı: yatay taşma, ilk ödeme görünürlüğü, hesap ayrıntısı, dört senaryo sonucu, sıfırlama, eksik ekstre, geciken seçeneği, öncesi/sonrası geçişi, tarayıcı hata ve harici istek kontrolü. Mevcut uygulamayı veya canlı verileri değiştiren işlem yok. 375×812 ekran görüntüsü ayrıca incelendi; ilk dört örnek ödeme ilk ekranda görünür. Görsel Git dışındaki `docs/private.local/` içinde.

Bu, üretim entegrasyon testi veya fiziksel telefon testi değildir. Gerçek rezervlerin ana ekrana bağlanması, güncel bakiye korumaları, gerçek veri hesap kuralları ve hesaplar arası yetkiler uygulama onayından sonra mevcut finans alanıyla birlikte ele alınmalıdır. İlgili bir GitHub/Trello kartı bu tasarım işi için tanımlanmadığından dış sisteme rapor veya görsel gönderilmedi.
