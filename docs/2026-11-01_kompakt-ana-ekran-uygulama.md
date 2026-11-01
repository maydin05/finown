# Kompakt ana ekran uygulaması

1 Kasım 2026. Kullanıcı onaylı kompakt önizlemenin ana ekrana uygulanmasını ve mobilde test edilmesini istedi. Durum: yerelde uygulandı; bu değişiklik için commit/push/Netlify yayını yapılmadı.

## Öncesi / sonrası

| Önce | Sonra |
| --- | --- |
| Büyük üst boşluk, selamlama ve ayrı başlık | Ana ekranda küçük logo/işlemler; Özet ve tarih yanında 7/30 gün seçimi |
| Baskın fark rakamı ve iki geniş renkli kutu | Gelir/ödeme tutarları üstte; daha küçük fark rakamı altta aynı kartta |
| Eksik ekstre uyarısı karttan ayrı | Kartın altında doğrudan “Sonuç kesinleşmedi” ve Tamamla bağlantısı |
| Genel hareket listesi | İlk açılışta yaklaşan ödemeler; Gelirler/Tümü filtreleri korunur |
| Tekrarlanan liste açma kontrolü | Liste sonunda tek aç/kısalt kontrolü |

Beklenen gelirler varken fark tahmin olarak açıklanır; eksik ekstre veya doğrulanması gereken bilgi varsa buna özel uyarı görünür. “Gelir yeterli” veya “harcanabilir bakiye” sonucu üretilmez. Gecikmiş ödeme ve eksik kaynak uyarıları korunur; kayıt açma, ekstre girişi ve ödeme durumunu kaydetme callback'leri değiştirilmedi.

Kompakt Header stili yalnız ana ekran rotasında etkindir. Diğer sayfaların header ölçüleri korunur. Mevcut hesaplama fonksiyonu, API, Context, şema ve migration dosyalarında değişiklik yoktur. Üretim veritabanına istek/yazma yapılmadı. Gerçek ödeme kayıtları ve tarih/durumları bu çalışma kapsamında değiştirilmedi; ödeme kaydı oluşturan testler yalnız sentetik UI harness içinde çalıştı.

## Doğrulama

- `npm run lint`: başarılı.
- `npm test`: **29/29**. Eksik ekstreli özetin tahmini olduğuna ve eksik veri olmayan özetin de beklenen gelire dayandığına ilişkin kontroller eklendi.
- `npm run test:mobile`: **42/42**, 320/375/430 piksel; 7/30 gün, ekstre tamamlama, bilgi penceresi/klavye, hareket ayrıntıları, durum akışları ve diğer ekranların mevcut kontrolleri.
- Yeni mobil kontrol: 667 piksel yüksekliğinde ilk iki yaklaşan ödemenin tamamen alt gezinmenin üstünde kalması; taşma olmaması; filtre değiştirmenin dönem toplamını etkilememesi; ekstre formundan vazgeçmenin fark/uyarıyı koruması.
- CUA ile yerel React uygulaması ayrıca 375×667 boyutunda incelendi. Özet alt sınırı 326 px, ilk iki ödeme alt sınırları 485/554 px, alt gezinme üst sınırı 590 px. Sentetik örnek veri kullanıldı.
- `npm run build` ve `git diff --check`: başarılı. Mevcut büyük JS paketi uyarısı devam ediyor.

Yerel uygulama önizlemesi: http://127.0.0.1:5175/tests/ui-preview.html?app=1. Gerçek kullanıcı oturumuyla canlı/cihaz kabulü bu çalışmanın kapsamına dahil değildir; henüz yayınlanmadı. Örnek verili mobil görsel `docs/private.local/2026-11-01_kompakt-ana-ekran-uygulama-375.jpg` içinde yerel olarak korunur.
