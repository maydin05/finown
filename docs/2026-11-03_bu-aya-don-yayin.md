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

GitHub, Netlify, son test ve gerçek oturum kontrol sonuçları yayın sonrası eklenecek. Kişisel finans ayrıntıları ve canlı görüntüler açık depoya gönderilmez.
