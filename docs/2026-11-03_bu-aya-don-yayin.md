# “Bu aya dön” — üretim yayını

3 Kasım 2026. Kullanıcı başlık düzenlemesinin GitHub/Netlify yayınını ve canlı mobil kontrolünü yetkilendirdi. Mevcut kayıtlar, tutarlar, tarihler ve ödeme durumları korunacak.

## Kapsam

- Ödemeler, Gelir ve Abonelikler sayfalarında güncel yıl/ay görüntülenirken “Bu aya dön” düğmesi oluşturulmaz.
- Başka ay veya yıl seçilince düğme, sayfa başlığı ve ay seçiciyle aynı yatay satırda görünür. Tıklamak güncel aya döndürür; düğme kaybolur.
- Dar mobil görünümde başlık ve ay seçici aralıkları uyarlanır. Finans hesabı, kayıt içeriği, sunucu/şema/erişim ayarı değişikliği yoktur.
- Yerel kapsam ve test ayrıntıları `2026-11-03_bu-aya-don-dugmesi-yerel.md` içindedir. Yayın öncesi taze veri karşılaştırma kopyası özel yerel alanda alındı.

## Yayın öncesi kontroller

- Son tam mobil pakette 90 test başarılı; üç ekran/üç genişlikte mevcut ayda gizlenme, başka ayda başlıkla aynı satırda görünme ve geri dönüş davranışı dahil.
- Lint ve üretim build başarılı; önceki bundle/Browserslist uyarıları sürüyor. Yerel notta kaydedilmiş tekil maaş testi, son tam pakette de başarılı.

## Yayın ve canlı kabul

- Özellik SHA’sı `e33e25623ed898c6c35d070214ebde7525cd9756`, GitHub `main` üzerinde readback ile doğrulandı. Netlify `6ae986b435c0e09a258156b1`, aynı SHA ile `ready`; yayın zamanı 3 Kasım 2026 10:01 TRT.
- Mevcut gerçek bütçe sahibi oturumunda üç sayfa kontrol edildi. Kasım 2026’da düğme yok; Aralık’a geçildiğinde düğme başlıkla aynı satırda. Düğmeye basınca Kasım’a dönüyor ve gizleniyor.
- Ödemeler, Gelir ve Abonelikler’de 320/375/430 × 812 px ölçülerinin dokuzunda da yatay taşma yok; başlık ve düğmenin dikey merkezleri aynı satırda.
- Mevcut kayıtlar, tutarlar, tarihler ve ödeme durumlarının yanı sıra aile/paylaşım ve Auth hesap/şifre durumu yayın öncesi kopyayla birebir aynı. Veri veya şema değişikliği yapılmadı.
- Canlı mobil başlık görüntüsü incelenerek özel yerel alana kaydedildi. Geçici viewport sıfırlandı; sayfa güncel ayda bırakıldı. Fiziksel cihaz kabulü yapılmadı.
- Kişisel finans ayrıntıları ve canlı görüntüler açık depoya gönderilmedi.
