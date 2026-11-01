# Kullanılabilir bakiye ve ödeme açığı — canlı yayın

1 Kasım 2026. Kullanıcı GitHub gönderimini, Netlify üretim yayınını ve yalnız bu özellik için gerekli veritabanı güncellemesini yetkilendirdi. Mevcut ödeme kayıtları, tarihleri ve durumları korunacak şekilde çalışıldı.

## Yayın ve şema

- Uygulama commit'i: `272946644fedb33f9e6b923ced7238ff6850280c`. GitHub `main` ucu `git ls-remote` ile doğrulandı.
- Netlify üretim deploy'u: `6ae757fc4df3675f2f0695fa`, `ready`; yayın 15:17:31 UTC / 18:17 Türkiye saati. Hedef https://finown.netlify.app/; site `2bed4a00-a1b4-4f59-9989-5ad9b580baf0`, repo `maydin05/finown`, dal `main` doğrulandı.
- `202611010002_available_balance.sql`, frontend yayınından önce Supabase `zowlpzmvwiszwhtvsagj` projesine uygulandı. Öncesinde aynı tablo ve RPC'nin bulunmadığı okundu; yeni migration dışında eski SQL dosyaları çalıştırılmadı.
- Yeni `available_balances` tablosu ve `save_available_balance` RPC'si yeniden okundu. RLS açık, anonim okuma yok, authenticated DELETE yok; RPC SECURITY INVOKER. Gerçek bakiye girilmedi; yeni tablo kontrol sonunda boş.
- Tüm mevcut finans tablolarının tam satır yedeği güncellemeden önce Git dışına alındı. Şema sonrası ve canlı kontroller sonrası karşılaştırmada bankalar, ödeme/takip kayıtları, ürünler, gider/gelir/abonelik kaynakları ve abonelik ödemeleri aynı kaldı. 173 ödeme kaydı, tarihleri ve durumları korundu. Özel yedek ve doğrulama kayıtları `docs/private.local/` içinde.

## Kontroller

- Uygulama aşamasında 41 birim/API testi, 51 sentetik mobil test, yalıtılmış PostgreSQL migration/sahiplik/ödeme koruma testleri, ESLint ve üretim derlemesi başarılı. Büyük JS paketi uyarısı sürüyor.
- Yayın sonrası oturumsuz mobil smoke: 6/6 başarılı; gerçek auth yazma isteği gönderilmedi.
- Gerçek açık hesapta 7 ve 30 günlük ana ekran 320/375/430 × 667 ölçülerinde kontrol edildi. Yatay taşma yok; yaklaşan ilk iki ödeme alt gezinmenin üzerinde tamamen görünür.
- Bakiye formu üç genişlikte açıldı; tutar başlangıçta boş, kaydet düğmesi görünür. Form `Vazgeç` ile kapatıldı, tutar girilmedi veya kaydedilmedi.
- Ayrıntı penceresi üç genişlikte kontrol edildi. Bakiye girilmediğinde açık hesaplanmıyor; boş bakiye sıfır varsayılmıyor. Gelir öncesi ödemeler ve gelir günündeki ödemeler ayrı gösteriliyor.
- Canlı sekmenin konsol hata/uyarı listesi kontrol sonunda boş. Viewport ayarı sıfırlandı ve sekme 7 günlük ana ekranda bırakıldı.
- Canlı JS/CSS yerel üretim çıktısıyla byte düzeyinde aynı:
  - `/assets/index-B-BZPYKs.js`: SHA-256 `35bd21016624a93e3d737a1579971a3dd7962fbae14ef7a0656ea6711b71b2bd`
  - `/assets/index-Ba0OoO1L.css`: SHA-256 `ff95b1f70ed9ffde2829a88f7a4857fbae1a6e4d2eb13017aea273a221511215`

Sınır: Mobil kontroller tarayıcı viewport ölçülerindedir; fiziksel cihaz kabulü değildir. Gerçek hesapta bakiye kaydetme ve yeniden yükleme akışı, tutar verilmediği için denenmedi. Kaydetme/başarısız kayıt/güncellik hesapları sentetik mobil ve yalıtılmış SQL testleriyle doğrulandı. Bu yayın kaydını ekleyen sonraki belge commit'i uygulama dosyalarını değiştirmez.

[Yerel uygulama ve test ayrıntıları](2026-11-01_bakiye-ve-acik-uygulama.md).
