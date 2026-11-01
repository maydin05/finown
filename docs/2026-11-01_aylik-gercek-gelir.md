# Aylık gerçek gelir tutarı — yerel uygulama

1 Kasım 2026. Kullanıcı, planlanan maaştan farklı alınan tutarı yalnız ilgili ay için kaydedebilmek ve sonradan düzeltebilmek istedi. Yerel uygulama tamamlandı. Bu çalışma kapsamında commit/push/deploy yapılmadı; üretim veritabanına bağlanılmadı veya veri/şema değişikliği yapılmadı.

## Davranış

- Gelirler sayfasında veya Özet'teki beklenen gelir ayrıntısında “Alındı olarak işaretle”, aylık gerçek tutar formunu açar. Planlanan tutar başlangıç değeri olarak gelir; tutar ve isteğe bağlı kesinti/ek mesai notu girilir.
- Örnek: planlanan aylık 120.000 TL iken kasımda 115.000 TL alınmış kaydı oluşturulur. Aralık 120.000 TL kalır. Kasım daha sonra 140.000 TL olarak düzeltilebilir.
- Gelirler sayfasında başarılı kayıt sonrası Alınan sekmesine geçilir. Alınmış kaydın ayrıntısında planlanan ve gerçek tutar ayrı gösterilir. “Bu ay alınan tutarı düzenle” aylık kaydı, “Gelir planını düzenle” ana planı hedefler. Plan düzenleme formuna aylık gerçek tutar taşınmaz.
- “Alındı” geri alınırsa yalnız ilgili aylık kayıt bekleyene döner. Eski tracker kayıtları yazılmaz/silinmez; aylık kayıt varsa görünümde önceliklidir. Diğer ayların durumları değişmez.
- Daha önce yalnız alınmış işareti bulunan kayıtlara tahmini gerçek tutar oluşturulmaz. Mevcut durum korunur ve tutarın planlanan değer olduğu uyarılır; kullanıcı ilgili ayı tamamlayabilir.
- Alınmış gelir 7/30 günlük beklenen gelire ikinci kez eklenmez. Gerçek tutar/durum değişimi kullanılabilir bakiye doğrulamasını geçersiz kılar; banka bakiyesi otomatik artırılmaz.
- Boş, negatif ve ikiden çok ondalıklı tutar reddedilir; açıkça girilmiş sıfır geçerlidir. Vazgeçme/kayıt hatası önceki kayıtları korur. Form kaydederken ekranda bulunan tutarı okur.

## Veri yapısı ve yayın sırası

`supabase/migrations/202611010003_income_receipts.sql` hazırlandı; yalnız geçici yerel PostgreSQL üzerinde uygulandı. Kullanıcı + gelir kaynağı + yıl/ay için tek kayıt tutar. İlk kayıttaki plan tutarı ve planlanan tarih korunur; düzeltmeler gerçek tutar, durum ve notu günceller. Ödeme, gelir planı ve tracker tablolarına yazmaz. Gelir kaynağı silinirse bu kaynağa ait yeni aylık kayıtlar foreign key üzerinden silinir; bu işlem yalnız gelecekteki açık kaynak silme eylemine bağlıdır, migration mevcut kayıtları silmez.

Tablo RLS ile kullanıcıya ve kendi gelir kaynağına bağlıdır. Anonim erişim ve authenticated DELETE izni yoktur. Kaydetme RPC'si SECURITY INVOKER; beklenen oturum sahibini yeniden doğrular. SQL doğrulaması ve upsert atomiktir.

Yayın ayrı yetki ister. Yetki geldiğinde hedef proje ve canlı şema kontrol edilip yalnız bu migration frontend yayınından önce uygulanmalıdır; frontend ilk yüklemede yeni tabloyu okur. Mevcut gelirler veya alınmış işaretleri otomatik taşınmamalı. Üretim öncesi/sonrası salt okunur tam satır karşılaştırması alınmalı; gerçek maaş tutarı verilmeden canlı test kaydı oluşturulmamalı.

## Doğrulama

- 45 birim/API testi başarılı: aya özel tutar, komşu aylar/plan korunması, legacy tracker önceliği, geri alma, beklenen gelirden düşme, bakiye doğrulamasının yenilenmesi, boş/sıfır/negatif/ondalık doğrulaması ve tek sahiplik kontrollü RPC.
- 60 mobil test başarılı: 320/375/430 genişliklerde mevcut akışlar ve yeni maaş kaydı/düzeltme/geri alma/vazgeçme/hata senaryoları. Örnek kasım 115.000/140.000 TL, aralık planı 120.000 TL; testler sentetik veridir.
- Yalıtılmış PostgreSQL 18 testleri başarılı: aynı aya upsert, farklı ayların korunması, plan tutarı/tarih anlık görüntüsünün korunması, sıfır ve geri alma, sahiplik/RLS/anon kısıtları ve geçersiz girişler. Mevcut kaynak, ödeme ve tracker satırları tam satır karşılaştırmasında aynı.
- ESLint, üretim derlemesi ve diff kontrolü başarılı. Büyük JS paketi uyarısı sürüyor.
- 375×667 yerel örnek veri formu ve aylık ayrıntı görsel kontrolünden geçti. Ekran görüntüleri Git dışındaki `docs/private.local/` içinde; gerçek hesap testi veya fiziksel cihaz kabulü değildir.

Önizleme: http://127.0.0.1:5175/tests/ui-preview.html?app=1&salary=1 . Gelir sekmesindeki örnek maaş 120.000 TL; kayıtlar yalnız bellekte, sayfa yenilenince sıfırlanır.

## Yayın yetkisi — 1 Kasım 2026

Yukarıdaki yerel durum tarihsel kayıttır. Kullanıcı GitHub, Netlify ve gerekli DB güncellemesini yetkilendirdi. Yeni migration 16:49 UTC'de Supabase `zowlpzmvwiszwhtvsagj` projesine uygulandı. Yeni tablo/RPC önceden yoktu; uygulama sonrasında sahiplik politikası ve izinler yeniden okundu. Yeni tablo boş bırakıldı. Mevcut dokuz tablonun tam satır karşılaştırması aynı; özel yedek ve hash kaydı Git dışındadır. Frontend yayını ve canlı mobil kontrol ayrı yayın kaydında tutulacak.
