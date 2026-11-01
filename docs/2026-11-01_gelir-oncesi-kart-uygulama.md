# Gelirden önce gerekli tutar: ana ekran uygulaması

1 Kasım 2026. Kullanıcı onaylı önizlemenin ana ekrana uygulanmasını ve mobilde test edilmesini istedi. Bu belge yayın öncesi uygulama/test kaydıdır. Sonraki GitHub/Netlify yayını ve gerçek hesap kontrolü [yayın kaydında](2026-11-01_gelir-oncesi-kart-yayin.md) yer alır.

## Davranış

Kart, mevcut 7/30 günlük özetin kullandığı bekleyen satırları salt okunur değerlendirir. Yeni kayıt veya durum oluşturmaz. İlk pozitif, henüz alınmamış, ödeme durumu belirsiz olmayan gelir gününden önceki ödemeleri toplar. Aynı gün beklenen birden fazla gelir birlikte gösterilir.

| Durum | Gösterim |
| --- | --- |
| Gelirden önce bilinen ödemeler | Gerekli tutar, beklenen gelir tarihi/tutarı ve ödeme listesi |
| Gelirden önce tutarı eksik ödeme | “En az” tutarı ve eksik tutar uyarısı |
| Gelir günü ödeme | Önceki günlerden ayrı tutar; hesaba geçiş saati bilinmediği için karşılanmış sayılmaz |
| Seçili aralıkta beklenen gelir yok | Yalnız seçili aralığın ödemeleri; genel olarak hiç gelir olmadığı iddia edilmez |
| Öncesinde ödeme yok | Bunun açık ifadesi; sonraki ödemelerin karşılanacağı güvencesi verilmez |
| Eksik kaynak/belirsiz ödeme durumu | Doğrulama uyarısı korunur; kesin sonuç verilmez |

Mevcut bakiye bilinmediğinden kart kesin nakit açığı veya yeterlilik sonucu vermez. Sıfır tutarlı veya belirsiz gelir, pozitif para girişi gibi kullanılmaz. Ödenmiş satırlar ve alınmış gelirler gelecekteki yükümlülük/fonlama olarak eklenmez. Karttan ödenen abonelikler ekstreye tekrar eklenmez. Önceki tarihlerden geciken ödemeler bu kartın tutarına dahil değildir; mevcut uyarıda ve kart ayrıntısında ayrıca açıklanır.

Özetin tarih aralığı başlık yanında; gelir/ödeme/fark daha dar kartta tutulur. Yeni karta dokunulduğunda yalnız bilgi penceresi açılır. Ayrıntı penceresinde kaydetme, ödeme işaretleme veya silme eylemi yoktur. Gerçek uygulamada önizlemedeki senaryo seçimleri bulunmaz; hesap mevcut kayıtlardan yapılır.

## Veri koruma

- `cashFlow` ve mevcut plan kuralları değiştirilmedi. Yeni saf hesap, aynı özet satırlarının tarih sırasını değerlendirir; satırları yerinde sıralamaz/değiştirmez.
- API, Context, şema ve migration dosyalarında değişiklik yok. Üretim veritabanına sorgu/yazma yapılmadı.
- Testlerdeki tarih/tutar/durum değişimleri yalnız sentetik harness verisidir. Kullanıcının mevcut kayıtları bu çalışma kapsamında değiştirilmedi.
- Bu özellik ilk beklenen gelire kadar olan dönemi açıklar; bütün sonraki gelir aralıkları için bakiye projeksiyonu değildir. Bakiye girişi bu paketin kapsamında değildir.

## Doğrulama

- `npm run lint`: başarılı.
- `npm test`: **35/35**. Altı yeni hesap testi: pozitif dönem toplamı ile zamanlama ihtiyacı ayrımı; eksik/gerçek sıfır ekstre; gelir gecikmesi; aynı gün; ödenmiş/alınmış durumlar; ay/yıl sınırı; seçili aralıkta gelir olmaması; aynı gün birden fazla gelir; kuruş hassasiyeti; belirsiz gelir; girdi satırlarının korunması.
- `npm run test:mobile`: **45/45**, 320/375/430 px. Yeni pencere, klavye/fokus dönüşü, belirsiz tutar, aynı gün, gelir bulunmayan dönem, 7/30 gün ve ekstre formundan vazgeçme kontrol edildi. Mevcut diğer ekran/form testleri de geçti.
- İlk mobil turda 430 px'de ikinci ödeme alt gezinmeye fazla yakındı. Boşluk düzeltmesinden sonra tüm mobil testler geçti.
- 667 px yükseklikte ilk iki örnek ödeme tamamen görünür. CUA ile 375×667 ayrıca incelendi: kart alt sınırı 361 px; ilk iki satır alt sınırları 512/581 px; alt gezinme üst sınırı 590 px; yatay taşma yok.
- `npm run build` ve `git diff --check`: başarılı. Mevcut büyük JS paketi uyarısı sürüyor.

Yerel React önizlemesi: http://127.0.0.1:5175/tests/ui-preview.html?app=1. Sentetik gecikme/aynı gün/gelirsiz test örnekleri `&bridge=late`, `&bridge=same-day`, `&bridge=none` ile yalnız harness içinde açılır. Sonraki gerçek hesap kontrolünün kapsamı ve sınırları yayın kaydındadır.

Yerel görsel: `docs/private.local/2026-11-01_gelir-oncesi-uygulama-375.jpg` (Git dışında).
