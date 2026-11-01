# Kompakt ana ekran: canlı yayın

1 Kasım 2026. Kullanıcı GitHub gönderimi, Netlify yayını ve canlı mobil kontrol için açık yetki verdi. Ödeme kayıtları/tarih/durumlarında değişiklik yapılmaması kapsamın sınırıdır.

## Yayın

- Uygulama commit'i `594dd81de9381f26535d9332835226db8e5fd5fd`. GitHub `main` ucu ayrı `git ls-remote` ile eşleşti.
- Netlify üretim deploy'u `6ae72ee24c6c91f68034ce32`, **ready**, yayın `2026-11-01T12:22:08.711Z` (Türkiye saati 15:22).
- Site: https://finown.netlify.app/. Site ID `2bed4a00-a1b4-4f59-9989-5ad9b580baf0`; bağlı repo `maydin05/finown`, dal `main`, build `npm run build`, çıktı `dist` yeniden doğrulandı.
- GitHub push sonrası otomatik üretim derlemesi yayımlandı. SQL, migration, servis ayarı veya ödeme verisine yazma yapılmadı.

## Kontroller

- Yayınlanan uygulama dosyaları önceki uygulama aşamasında ESLint, 29 birim/bileşen testi, 42 sentetik mobil test, üretim derlemesi ve diff kontrolünden geçti.
- Canlı oturumsuz mobil smoke **6/6**: üç mobil genişlikte giriş ekranı/SPA rotaları, giriş-kayıt geçişi, şifre görünürlüğü ve boş alan doğrulaması; gerçek kimlik doğrulama isteği gönderilmedi.
- Açık gerçek kullanıcı oturumunda **320/375/430 × 667** boyutlarında 7/30 günlük ana ekran kontrol edildi. Yatay taşma yok; ilk iki ödeme alt gezinme çubuğunun üzerinde tamamen görünür.
- Eksik ekstre bulunan dönemde tahmini fark/sonuç kesinleşmedi açıklaması ve Tamamla bağlantısı doğrulandı. Ekstre formu açıldı, hiçbir alan değiştirilmeden Vazgeç ile kapatıldı. Kaydetme yapılmadı.
- Gelirler/Tümü/Ödemeler filtreleri ve dönem farkı açıklaması çalıştı. Filtre geçişleri toplamı değiştirmedi. Kontrol sonunda canlı sekmede konsol hata/uyarı kaydı yoktu.
- Yayın öncesi/sonrası tam satır karşılaştırması ödeme kayıtları, takip işaretleri, ürün/gider/gelir/abonelik kaynakları ve abonelik ödeme kayıtlarının değişmediğini doğruladı. Ödeme işaretleme, yeni kayıt oluşturma, silme veya kaydetme işlemi yapılmadı.
- Canlı JS/CSS yerel üretim derlemesiyle byte düzeyinde aynı:
  - `/assets/index-DK8CHp55.js` — SHA-256 `8c0d3112ec6e0e5f261075bf73e9f653b0c8090645c04a2790653de9455a2ba7`
  - `/assets/index-CLiX_zuj.css` — SHA-256 `f719a2ebdd906edec00b608d074ff750e718635399b4ad2fa88c28a7ef636a56`

Gerçek hesap görseli ve veri karşılaştırmaları Git dışındaki `docs/private.local/` içindedir. Mobil kontrol tarayıcı viewport ölçülerinde yapıldı; fiziksel cihaz kabulü değildir. Mevcut büyük JS paketi uyarısı devam ediyor. Bu kaydı ekleyen sonraki belge commit'i uygulama dosyalarını değiştirmez.

[Uygulama kapsamı ve yerel testler](2026-11-01_kompakt-ana-ekran-uygulama.md).
