# Banka ödemelerinde logo ve banka etiketi — yerel

3 Kasım 2026. Kullanıcı ödeme satırlarında banka logolarının görünmesini istedi.

- Ödemeler listesindeki kart/kredi kayıtları ve Özet’in yaklaşan hareketleri mevcut ürün → banka ilişkisiyle eşleştirilir. Başlıktan banka tahmini yapılmaz; veri kaydı veya başlık değiştirilmez.
- Dokuz banka için resmî web sitelerinde kullanılan küçük marka görselleri uygulamanın yerel statik dosyalarına alındı. Kaynak adresleri ve dosya hash’leri `public/banks/README.md` / `sources.json` içinde. Haricî logo servisi veya üçüncü taraf görsel isteği yok.
- Logo 28 px, Özet’te 25 px olarak mevcut simge alanında gösterilir. Banka adı mevcut tarih satırına eklenir; satır için ayrı bir üst bilgi alanı açılmaz. Ayrıntıda da banka adı görünür.
- Bankası bulunamayan bağlantısız ödemelerde genel simge korunur. Tanınmayan banka veya görsel yükleme hatasında genel simge ve okunur banka adı gösterilir. Tutarlar, vadeler, ödeme durumları ve salt okunur yetkiler değişmez.
- DEV-only tıklanabilir deneme: `/tests/bank-logos-preview.html`. Bütün kayıtlar sentetik; Auth/DB/yazma işlemi yok. Özet ve Ödemeler arasında geçiş yapılabilir.

## Kontrol

- 320/375/430 px: dokuz görselin gerçekten yüklenmesi, banka etiketi, ödeme ayrıntısı, bankaya bağlı olmayan kayıtta yanlış logo atanmaması, Özet’e yansıma ve kasıtlı görsel hatasında geri dönüş başarılı. Yatay taşma yok; finans yazma veya haricî kaynak isteği yok.
- Yeni üç test mevcut mobil pakete eklendi; toplam 87 mobil test başarılı.
- Lint ve üretim build başarılı; mevcut bundle/Browserslist uyarıları sürüyor.
- Mobil ilk ekran ve dokuz bankanın tam görünümü görsel olarak incelendi. Örnek görüntüler özel yerel alanda tutuluyor.

Bu yerel kontrolün yapıldığı anda logo değişikliği henüz commit/push/deploy edilmemişti. Sonraki onaylı yayın ve canlı logo kabulü [üretim yayın kaydında](2026-11-03_banka-logolari-yayin.md) doğrulandı. Canlı eş hesabında yapılan önceki ana sayfa kabulü, bu logo değişikliğinin canlı kabulü sayılmaz. Üretim kayıtları ve şema bu görsel çalışma sırasında değiştirilmedi.
