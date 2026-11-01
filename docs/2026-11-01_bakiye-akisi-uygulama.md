# Gün gün bakiye akışı ve gecikenleri dahil etme — yerel uygulama

1 Kasım 2026. Kullanıcı onaylı önizlemenin ana ekrana uygulanmasını ve mobilde testini istedi; kayıt/tarih/durumların korunması şartıyla. Yerel uygulama ve kontroller tamamlandı. Bu aşamada commit/push/deploy yapılmadı; üretime sorgu veya yazma gönderilmedi. Yeni migration gerekmiyor.

## Davranış

- Mevcut açık kartı seçili 7/30 günlük aralığın tamamında tarih sırasıyla kullanılabilir bakiye, bekleyen ödemeler ve henüz alınmamış gelirleri değerlendirir. İlk gelirden sonraki açıklar da görünür. Ana kart ilk açık günü/tutarını, ayrıntı en yüksek açığı ve dönem sonu tahmini bakiyeyi gösterir.
- Açığı kapatabilecek ilk beklenen gelir günü gösterilir. Sonraki açıklar da çizgi ve gün listesinde görülebilir; tek açığın kapanması bütün dönemin karşılandığı anlamına gelmez.
- Kart ayrıntısında bakiye çizgisi, hareket günleri ve güne dokununca başlangıç/ödeme/beklenen gelir/gün sonu hesabı vardır. Ayrıntıda kayıt değiştiren eylem yoktur.
- Aynı günün ödemeleri gelirden önce varsayılır. Gün içi açık ile gün sonu bakiye ayrı hesaplanır; koşullu risk açıkça yazılır. Beklenen gelirler garanti edilmiş tahsilat değildir.
- “Geciken ödemeleri açığa kat” başlangıçta kapalıdır. Açılınca mevcut kayıtlı bekleyen ödeme satırları bugün ödenecek varsayılır. Asıl vade, kayıt ve ödeme durumu değişmez. Üstteki dönem gelir/ödeme/fark toplamları aynı kalır. Seçim yalnız sayfa belleğindedir.
- Geciken kapsamı mevcut ana ekran kuralıyla aynıdır: yalnız `payments` tablosundaki gerçek, geçmiş vadeli, ödenmemiş kayıtlar. Geçmiş aylara otomatik tekrarlayan gider/abonelik borcu üretilmez. Sanal eski ekstre tahminleri oluşturulmaz.
- Boş/eski/kayıtlarla uyumsuz bakiye sıfır sayılmaz; kesin açık/çizgi üretilmez. Mevcut manuel bakiye düzenleme ve kayıt değişince yeniden doğrulama korumaları sürer.
- Eksik tutarlar sonucun kesinleşmesini engeller. Bilinen açık, yalnız uygun kapsamda alt sınır olarak gösterilir; doğrulanmamış durum/gelirde tahmini etiketi kullanılır. Eksik tutarlı dönemin son bakiyesi kesinleştirilmez. Geçersiz negatif/sonlu olmayan tutarlar fonlama veya ödeme gibi hesaplanmaz.
- Alınmış maaşlar ve ödenmiş kayıtlar tekrar sayılmaz. Kartla ödenen abonelikler nakit çıkışına ikinci kez eklenmez. Bakiye güncelleme dışında yeni kayıt kaydetme akışı yoktur; bu görevde yalnız sentetik bakiye kullanıldı.

## Teknik kapsam ve veri koruma

`balanceFlow` yeni saf hesap fonksiyonudur. Günleri yerel takvimle dolaşır, para hesabını kuruş üzerinden yapar, kaynak dizileri/satırları değiştirmez. Gecikenlerin hesap günü ayrı `flowDate` alanında tutulur; `dueDate` aynen kalır. `cashFlow` mevcut geciken satırlarını salt okunur sonuç olarak döndürür; bilinen geciken toplamında geçersiz tutarlar dışlanır. API, Context, tracker, DB şeması ve kayıt işleme fonksiyonları değişmedi.

## Kontroller

- 50 birim/API testi başarılı: dönem toplamı artıdayken sonraki açık, ilk açık/en yüksek açık ayrımı, geciken seçiminin etkisi ve orijinal tarihlerin korunması, aynı gün sırası, kuruş hassasiyeti, eksik/negatif/belirsiz veriler, sıfır/boş bakiye, ödenmiş/alınmış/karttan karşılanan kayıtların tekrar sayılmaması ve yıl sınırı.
- 66 mobil test başarılı: 320/375/430 genişliklerde mevcut akışlar ve yeni günlük akış/gün seçimi/geciken anahtarı/üst toplamın korunması/7 günlük sınır/eksik ekstre senaryoları. Örnek 30 günlük ekran 667 px yükseklikte ilk iki ödeme görünürlüğünü de doğrular.
- ESLint, üretim derlemesi ve diff kontrolü başarılı. Mevcut büyük JS paketi uyarısı sürüyor.
- React uygulamasının yerel örnek veri ekranı 375×667 ölçüsünde görsel kontrol edildi; ana ekran ve çizgi görüntüleri Git dışındaki `docs/private.local/` içindedir. Bu, canlı hesap veya fiziksel cihaz kabulü değildir.

Örnek: http://127.0.0.1:5175/tests/ui-preview.html?app=1&flow=timing . 30 gün seçilip 5.000 TL sentetik bakiye girildiğinde 10 Kasım/3.000 TL açık ve 20 Kasım geliriyle kapanma görünür; dönem sonu 7.000 TL. Geciken 4.000 TL dahil edilince ilk açık 2 Kasım/2.000 TL, dönem boyunca en yüksek açık 7.000 TL olur. Bu tutarlar gerçek hesap verileri değildir.

Yayın ayrıca yetkilendirildiğinde taze Git/Netlify hedefi doğrulanmalı, mevcut üretim kayıtlarının tam satır önce/sonra karşılaştırması alınmalı ve canlı mobil ayrıntı yalnız bilgi amaçlı kontrol edilmelidir. Gerçek bakiye/tutar girme veya kayıt işaretleme test yetkisi varsayılmamalı.
