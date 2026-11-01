# Kredi, bağlı borç ve vade paketi: yayın kaydı

1 Kasım 2026. Kullanıcı paketin GitHub'a gönderilmesini, Netlify'da yayımlanmasını ve mevcut ödeme verisine dokunulmadan canlı kontrolünü onayladı.

## Yayın

- Uygulama commit'i: `d52fdda13fe191070f82ec1356f7715f3e812a4b`. GitHub `main` ucu ayrı `git ls-remote` ile eşleşti.
- Netlify üretim deploy'u: `6ae728366c97829483fd94ef`, durum **ready**, yayın `2026-11-01T11:53:41.838Z` (Türkiye saati 14:53).
- Hedef repo `maydin05/finown`, dal `main`; site ID `2bed4a00-a1b4-4f59-9989-5ad9b580baf0` yeniden doğrulandı. GitHub push sonrası Netlify otomatik üretim derlemesi yayımlandı.
- Canlı adres: https://finown.netlify.app/.
- Eklemeli Supabase değişikliği önceki uygulama aşamasında tamamlanmıştı. Bu yayın sırasında migration, veri veya ayar değişikliği yapılmadı.

## Doğrulama

- Yayın öncesi ESLint, build ve diff kontrolü başarılı. Aynı paket için önceki uygulama aşamasında 29 birim/bileşen, 39 sentetik mobil test ve yalıtılmış PostgreSQL testleri başarılıydı.
- Canlı oturumsuz mobil smoke: **6/6**, 320/375/430 px; SPA rotaları, giriş/kayıt geçişi, şifre görünürlüğü ve boş alan doğrulaması. Gerçek kimlik doğrulama isteği gönderilmedi.
- Açık gerçek hesapta yeni borç görünümü, kalan kredi tutarları, iki mevcut kredinin taksit tutarı/ilk tarihi ve kilitli plan alanları kontrol edildi. Formlar kaydetmeden kapatıldı.
- Gerçek hesapta 7 günlük liste, Bugün/Geciken filtreleri ve üç aylık ekranda “Bu aya dön” çalıştı. Banka görünümü, 7 günlük liste ve mevcut kredi formu 320/375/430 px'de yatay taşmadan görüntülendi. Bunlar tarayıcı viewport kontrolleridir; fiziksel cihaz kabulü değildir.
- Gerçek hesap sekmesinde kontrol sonunda konsol hata/uyarı kaydı görülmedi.
- Yayın öncesi/sonrası tam satır karşılaştırması ödeme satırları, tarih/tutar/durumları, takip işaretleri, ürünler ve gider kaynaklarının aynı kaldığını doğruladı. Hiçbir ödeme, silme, yeni kayıt veya kaydetme işlemi yapılmadı.
- Canlı JS/CSS dosyaları yerel üretim derlemesiyle byte düzeyinde aynı:
  - `/assets/index-DME1WqOp.js` — SHA-256 `ce21afcc881947befea4dbd5d2eb27b2c93b44f12f7cf91efd17ff09477948c1`
  - `/assets/index-DAGQI_Yp.css` — SHA-256 `45f5c52b343d349aacc643c222bfb4f34dd7c079516ba37c3a42b44c2d7135d1`

Gerçek hesabın ekran görüntüsü, satır karşılaştırması ve kişisel inceleme ayrıntıları `docs/private.local/` altında Git dışında tutulur. Yeni kredi oluşturmanın yazma davranışı üretimde denenmedi; sentetik verilerle yalıtılmış PostgreSQL ve API testleriyle doğrulandı. Mevcut büyük JS paketi uyarısı devam ediyor.

Bu kaydı ekleyen sonraki belge commit'i uygulama dosyalarını değiştirmez.

Uygulama ve test kapsamı: [Kredi, bağlı borç ve vade paketi](2026-11-01_kredi-borc-ve-vade-paketi.md).
