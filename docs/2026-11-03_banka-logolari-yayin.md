# Banka logoları — üretim yayını

3 Kasım 2026. Kullanıcı GitHub/Netlify yayınını ve canlı mobil kontrolü yetkilendirdi. Mevcut kayıtlar, tutarlar, tarihler ve ödeme durumları korunacak.

## Yayın kapsamı

- Ödemeler ve Özet’in banka bağlantılı kart/kredi hareketlerinde banka logosu ve banka etiketi görünür. Eşleştirme mevcut ürün → banka ilişkisine dayanır; kaynak kayıtları ve başlıkları değiştirmez.
- Dokuz bankanın işaretleri yerel statik dosyalardır. Kaynak adresleri ve SHA-256 kayıtları `public/banks/` içindedir. Tanınmayan banka, bağlantısız ürün veya görsel hatasında genel simge kullanılır; doğru banka etiketi korunur.
- Salt okunur ortak hesap yetkileri korunur. Yeni migration, ortam ayarı veya paylaşım değişikliği yoktur.
- Yayın öncesinde 87 mobil test başarılı; 320/375/430 px, görsellerin gerçekten yüklenmesi, yanlış eşleştirmeye karşı kontrol, Özet görünümü ve görsel hatası geri dönüşü dahil. Lint ve üretim build başarılı; mevcut bundle/Browserslist uyarıları sürüyor.
- On finans, beş aile tablosu ve Auth hesap/şifre durumunun taze karşılaştırma kopyası özel yerel alanda alındı.

## Canlı doğrulama

Yayın sonrası GitHub SHA, Netlify durumu, gerçek oturum mobil kontrolü ve veri karşılaştırması bu bölüme kaydedilecek. Yerel test tek başına canlı kabul sayılmaz. Kişisel veriler veya canlı ekran görüntüleri açık depoya gönderilmez.
