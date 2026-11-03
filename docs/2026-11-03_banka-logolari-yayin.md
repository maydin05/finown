# Banka logoları — üretim yayını

3 Kasım 2026. Kullanıcı GitHub/Netlify yayınını ve canlı mobil kontrolü yetkilendirdi. Mevcut kayıtlar, tutarlar, tarihler ve ödeme durumları korunacak.

## Yayın kapsamı

- Ödemeler ve Özet’in banka bağlantılı kart/kredi hareketlerinde banka logosu ve banka etiketi görünür. Eşleştirme mevcut ürün → banka ilişkisine dayanır; kaynak kayıtları ve başlıkları değiştirmez.
- Dokuz bankanın işaretleri yerel statik dosyalardır. Kaynak adresleri ve SHA-256 kayıtları `public/banks/` içindedir. Tanınmayan banka, bağlantısız ürün veya görsel hatasında genel simge kullanılır; doğru banka etiketi korunur.
- Salt okunur ortak hesap yetkileri korunur. Yeni migration, ortam ayarı veya paylaşım değişikliği yoktur.
- Yayın öncesinde 87 mobil test başarılı; 320/375/430 px, görsellerin gerçekten yüklenmesi, yanlış eşleştirmeye karşı kontrol, Özet görünümü ve görsel hatası geri dönüşü dahil. Lint ve üretim build başarılı; mevcut bundle/Browserslist uyarıları sürüyor.
- On finans, beş aile tablosu ve Auth hesap/şifre durumunun taze karşılaştırma kopyası özel yerel alanda alındı.

## Canlı doğrulama

- Özellik SHA’sı `4461eff17f68168ba424dd0dc27f660a6a50d8c7`, GitHub `main` üzerinde readback ile doğrulandı. Netlify `6ae9771667337373ed9a8b85`, aynı SHA ile `ready`; yayın zamanı 3 Kasım 2026 08:54 TRT.
- Dokuz statik logo dosyası canlıdan HTTP 200 ile alındı; her dosyanın SHA-256 değeri kaynak manifestiyle aynı.
- Eşin gerçek açık salt okunur oturumunda Ödemeler ve 30 günlük Özet kontrol edildi. Banka etiketleri görünüyor ve kullanılan bütün logolar tarayıcıda yüklenmiş durumda. Genel gider simgeleri banka işaretine dönüştürülmedi.
- Her iki ekranda 320/375/430 × 812 px ölçülerinde yatay taşma yok. Mevcut kart/kredi kayıtları ve eksik ekstre durumları korunuyor. Ekleme, düzenleme, silme veya ödeme işaretleme işlemi yapılmadı.
- On finans, beş aile tablosu ve Auth hesap/şifre durumunun tam satır karşılaştırması yayın öncesiyle birebir aynı. Mevcut kayıtlar, tutarlar, tarihler, ödeme durumları ve paylaşım kapsamı değişmedi.
- Canlı mobil ekran görüntüsü incelendi ve Git dışındaki özel yerel alana kaydedildi. Geçici viewport sıfırlandı; canlı oturum açık bırakıldı. Fiziksel cihaz kontrolü yapılmadı.
- Kişisel veriler ve canlı ekran görüntüleri açık depoya gönderilmedi. Üretim şeması, sunucu ayarları ve erişim yetkileri değiştirilmedi.
