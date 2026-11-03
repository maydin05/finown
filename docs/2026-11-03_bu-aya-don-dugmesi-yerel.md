# “Bu aya dön” düğmesi — yerel düzenleme

3 Kasım 2026. Kullanıcı düğmenin yalnız başka ay görüntülendiğinde görünmesini ve Ödemeler başlığıyla aynı satırda olmasını istedi.

- Ortak `MonthHeader`, seçili yıl ve ayı tarayıcının güncel yıl/ayıyla karşılaştırır. Mevcut ayda düğme hiç oluşturulmaz; başka ay veya başka yılda görünür. Tıklamak mevcut geri dönüş davranışını kullanır.
- Düğme başlık satırında, sayfa adı ile ay seçici arasındadır. Ayrı bir dikey alan tüketmez. Dar mobil genişliklerde ay seçici ve boşluklar sıkıştırılır; başlık, düğme ve ay/yıl aynı satırda kalır.
- Aynı bileşeni kullanan Ödemeler, Gelir ve Abonelikler bu davranışı paylaşır. Veri, API, ödeme durumu veya finansal hesaplama değişikliği yok.

## Kontrol

- Üç sayfada 320/375/430 px: mevcut ayda düğme yok; bir sonraki ayda var; başlık ve düğmenin dikey merkezleri aynı satırda; yatay taşma yok; düğmeyle dönüldüğünde güncel ay açılıyor ve düğme kayboluyor. Yeni üç mobil test başarılı.
- Genel 90 mobil testin ilk koşusunda 89 başarılı; bir mevcut maaş formu doğrulama testinde beklenen boş-tutar uyarısı yerine genel kaydetme uyarısı geldi. Aynı test tek başına yeniden çalıştırıldığında başarılı. Maaş formu kodu değiştirilmedi; ilk koşudaki farklılığın nedeni bu kapsamda doğrulanmadı.
- Lint ve üretim build başarılı; önceki bundle/Browserslist uyarıları sürüyor.
- Yerel tıklanabilir banka önizlemesinde Kasım’da düğme yok; Aralık’ta Ödemeler başlığının yanında göründüğü mobil ekran görüntüsüyle incelendi. Örnek görüntü Git dışında tutulur. Geçici viewport sıfırlandı.

Çalışma yereldir; commit/push/deploy ve üretim verisi işlemi yapılmadı. Canlı ekran kabulü henüz yapılmadı.
