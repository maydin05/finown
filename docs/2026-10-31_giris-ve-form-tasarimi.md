# Giriş ve kayıt formları — 31 Ekim 2026

Durum: uygulama ve yerel testler tamamlandı; kullanıcı GitHub gönderimi ve Netlify üretim yayınına açık yetki verdi. Kullanıcı giriş ekranı ve ekleme/düzenleme formlarının renkli, sade tasarıma uyarlanmasını istedi.

## Değişiklikler

- Giriş/kayıt: açık zemin, mavi vurgu, ortak marka görünümü, ilişkili alan etiketleri, otomatik doldurma ve şifreyi göster/gizle düğmesi. Üretimde mevcut Supabase giriş/kayıt çağrıları korunuyor.
- Ortak `FormModal`: işlem türüne uygun renk, sade başlık, kaydırılabilir alanlar ve ayrı Kaydet/Vazgeç bölümü. Kaydetme sürerken alanlar ve tekrar gönderim kapatılır; üst katmandan gelen reddedilmiş kayıt hatası formda gösterilir. Mevcut üst katman hata işleyicileri korunuyor.
- Gelir/gider/abonelik, banka, kart/kredi, ekstre/taksit, abonelik ödeme ve not formları yeni yapıyı kullanıyor. Karmaşık kaynak/ürün alanları ve çağrıları korundu.
- Banka renk seçimleri renk adları, seçili işareti ve erişilebilir durumla gösteriliyor.
- Modal yeniden render olduğunda odağı başa taşıyan etki düzeltildi; yazı yazarken alan odağı korunuyor. Escape ve odak geri verme kontrolleri devam ediyor.
- Kayıtlı sıfır ekstre tutarı formda boş yerine `0` gösteriliyor.

Hesaplama, veri sağlayıcısı, API ve üretim kayıtları değiştirilmedi. Onay/silme diyalogları bu form yenileme kapsamına dahil edilmedi.

## Doğrulama

- 22 birim/bileşen testi başarılı.
- 320/375/430 px Chromium emülasyonunda 24/24 mobil test başarılı: mevcut ekranların 12 testi ve yeni form akışlarının 12 testi.
- Form kontrolleri: gelir tutarı/tarihi, geleceğe dönük düzenleme kapsamı, yıllık/değişken abonelik ve kart bağlantısı, banka renk seçimi, sanal kart/kredi koşullu alanları, sıfır ekstre, abonelik ödemesinin gerçek tutarı/tarihi/notu, hata halinde notun korunması, klavye odağı ve görünür kayıt düğmesi.
- Giriş/kayıt alanları, şifre görünürlüğü ve otomatik doldurma türü kontrol edildi. Gerçek giriş veya hesap oluşturma testi yapılmadı.
- ESLint, build ve `git diff --check` başarılı. Mevcut paket boyutu/Browserslist uyarıları sürüyor.
- Gerçek cihaz, canlı kullanıcı oturumu ve gerçek veritabanı kayıt işlemi bu testlere dahil değil.

## Yerel inceleme

- Formlar: `http://127.0.0.1:5175/tests/forms-preview.html`
- Giriş/kayıt: `http://127.0.0.1:5175/tests/forms-preview.html?screen=login`

Önizlemede gerçek bileşenler örnek verilerle çalışır. Kaydet işlemleri yalnız sayfa belleğine yazılır; giriş/kayıt için örnek auth sağlayıcısı kullanılır, gerçek hesap çağrısı yapılmaz. Üretim uygulamasının kaydetme/giriş hizmeti bundan ayrıdır. `npm run test:mobile` iki mobil test dosyasını da çalıştırır.

Görsel kayıtlar: [Giriş](preview/2026-10-31_renkli-giris.png), [gider](preview/2026-10-31_renkli-gider-formu.png), [abonelik](preview/2026-10-31_renkli-abonelik-formu.png), [banka](preview/2026-10-31_renkli-banka-formu.png), [kart](preview/2026-10-31_renkli-kart-formu.png). Tamamı örnek veridir.
