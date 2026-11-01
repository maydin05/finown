# Gelirden önce gerekli tutar: canlı yayın

1 Kasım 2026. Kullanıcı kartın GitHub/Netlify yayınını ve gerçek hesabında, mevcut ödeme kayıtları/tarih/durumlarına dokunulmadan mobil kontrolünü onayladı.

## Yayın

- Uygulama commit'i `e6e1c188ea599d547f49712c8a14ad3d4f99a5b5`. GitHub `main` ucu ayrı `git ls-remote` ile doğrulandı.
- Netlify üretim deploy'u `6ae73e3ee739a350563bcce5`, **ready**, yayın `2026-11-01T13:27:40.192Z` (Türkiye saati 16:27).
- Hedef https://finown.netlify.app/; site ID `2bed4a00-a1b4-4f59-9989-5ad9b580baf0`. Bağlı repo `maydin05/finown`, dal `main`, build `npm run build`, çıktı `dist` yeniden doğrulandı.
- GitHub push sonrası otomatik Netlify yayını tamamlandı. Bu işte DB/şema/servis ayarı değişmedi.

## Doğrulama

- Yayına gönderilen uygulama önceki uygulama aşamasında ESLint, **35 birim/bileşen testi**, **45 sentetik mobil test**, üretim derlemesi ve diff kontrolünden geçti.
- Canlı oturumsuz mobil smoke **6/6**: üç genişlikte SPA rotaları/giriş ekranı, giriş-kayıt geçişi, şifre görünürlüğü, boş alan doğrulaması; gerçek auth isteği gönderilmedi.
- Gerçek açık hesapta 7 ve 30 günlük görünüm **320/375/430 × 667** boyutunda kontrol edildi. Yatay taşma yok, ilk iki ödeme tamamen görünür.
- Kart tutarı, ilk beklenen gelir günü ve gelir günündeki ayrı ödeme tutarı; salt okunur DB yedeği üzerinde aynı hesap fonksiyonu çalıştırılarak canlı UI ile karşılaştırıldı ve eşleşti. Kişisel finansal değerler yalnız yerel özel kayıtta tutulur.
- Ayrıntı penceresi üç mobil genişlikte açıldı. Önceki ve aynı gün ödemeleri ayrı gösteriyor; mevcut bakiye bilinmediği ve bunun kesin nakit açığı olmadığı açıklanıyor. Pencere yalnız bilgi/kapatma içeriyor, kayıt değiştiren eylem yok.
- Gerçek hesapta hiçbir kayıt oluşturma, kaydetme, ödeme işaretleme veya silme işlemi yapılmadı. Öncesi/sonrası tam satır karşılaştırması ödeme, takip işareti, ürün/gider/gelir/abonelik kaynakları ve abonelik ödemelerinin aynı kaldığını doğruladı.
- Kontrol sonunda canlı sekmede konsol hata/uyarı listesi boş. Geçici viewport ayarı sıfırlandı, sekme ana ekranda 7 günlük görünümde bırakıldı.
- Canlı JS/CSS yerel üretim derlemesiyle byte düzeyinde aynı:
  - `/assets/index-zl-TgG3o.js` — SHA-256 `4c6cb4a32eb4f3343ef58ad2b4654b9cf40cbb82acc235b62200e2f5352e3f72`
  - `/assets/index-gR9N-gQv.css` — SHA-256 `2c0661d785ed2187dd8b5a0ab8ec73edd308e157ef457057b96436b73f0b4da5`

Gerçek hesap ekran görüntüsü ve veri karşılaştırmaları Git dışındaki `docs/private.local/` klasöründedir. Mobil kontroller tarayıcı viewport ölçülerindedir; fiziksel cihaz kabulü değildir. Mevcut büyük JS paketi uyarısı devam ediyor. Yayın kaydını ekleyen sonraki belge commit'i uygulama dosyalarını değiştirmez.

[Uygulama kuralları ve yerel test kapsamı](2026-11-01_gelir-oncesi-kart-uygulama.md).
