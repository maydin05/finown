# Gün gün bakiye akışı ve gecikenleri dahil etme — canlı yayın

1 Kasım 2026. Kullanıcı GitHub/Netlify yayınını ve mevcut kayıtlar/tarihler/ödeme durumları korunarak canlı mobil kontrolü yetkilendirdi.

## Yayın

- Uygulama commit'i `2e23e8c0f791c522b093374e4a1cb9cd5eab3a72`; GitHub `main` ucu ayrı `git ls-remote` ile doğrulandı.
- Netlify üretim deploy'u `6ae775fd81792aa470bc25bb`, `ready`, yayın 17:25:34 UTC / 20:25 Türkiye saati. Site `2bed4a00-a1b4-4f59-9989-5ad9b580baf0`, repo `maydin05/finown`, dal `main`, build/publish hedefi doğrulandı.
- Hedef https://finown.netlify.app/ . DB şema/veri/servis ayarı değişikliği yapılmadı; bu özellik migration gerektirmiyor.

## Kontroller

- Yerel uygulama: 50 birim/API testi, 66 sentetik mobil test, ESLint, üretim derlemesi ve diff kontrolü başarılı. İlk açık/en yüksek açık, gecikenlerin bugün ödenecek varsayımı ve eski vadenin korunması, dönem toplamının değişmemesi, aynı gün, eksik tutar ve tekrar sayım korumaları doğrulandı.
- Canlı oturumsuz mobil smoke 6/6 başarılı; gerçek auth yazma isteği gönderilmedi.
- Gerçek açık hesapta ana ekranın 30 günlük görünümü ve akış ayrıntısı 320/375/430 × 667 ölçülerinde kontrol edildi. Yatay taşma yok, ilk iki ödeme alt gezinmenin üzerinde görünür; ayrıntı penceresi ekrana sığıyor.
- Günlük listede bir güne dokununca o günün ödeme/beklenen gelir hesabı açılıyor. Güncel bakiye bulunmadığında kalan tutar/çizgi üretilmiyor; boş bakiye sıfır sayılmıyor. Eksik ekstre uyarısı ve tutarı eksik satırlar korunuyor.
- Gerçek hesapta manuel bakiye kaydı yok ve kayıtlı geçmiş vadeli bekleyen ödeme sayısı sıfır. Bu nedenle canlıda grafiğin/açık tutarının görünmesi veya geciken anahtarının açılıp kapanması denenmedi; uygun biçimde bakiye istendi, gereksiz geciken anahtarı gösterilmedi. Sayısal çizgi ve anahtar etkileşimleri sentetik mobil testlerde doğrulandı. Test için gerçek bakiye veya gecikmiş ödeme oluşturulmadı.
- Üretimden alınan salt okunur anlık görüntü üzerinde aynı saf domain fonksiyonları çalıştırılarak canlı 7/30 günlük toplamlar ve geciken kapsamı eşleştirildi. Bakiye olmadan açık/son bakiye üretilmediği de doğrulandı.
- Yayın öncesi ve kontrol sonrası on tablonun tüm satırları aynı: bankalar, 173 ödeme, tracker kayıtları, ürünler, gider/gelir/abonelik kaynakları, abonelik ödemeleri, kullanılabilir bakiye ve aylık gelir kayıtları. Tutarlar, tarihler ve durumlar korundu. Yedek, kişisel finansal karşılaştırmalar ve görüntüler Git dışındaki `docs/private.local/` içindedir.
- Canlı sekmenin konsol hata/uyarı listesi boş. Viewport sıfırlandı; sekme 30 günlük ana ekranda bırakıldı. Gerçek hesapta hiçbir kayıt kaydetme/ödeme işaretleme/silme yapılmadı.
- Canlı JS/CSS yerel üretim çıktısıyla byte düzeyinde aynı:
  - `/assets/index-Btg-mCb-.js`: SHA-256 `0f864020755dfb5205718ea15c23fec10359d0c8ed73b1ac1593b2e84d443a5f`
  - `/assets/index-HECP4Tkz.css`: SHA-256 `4d037b346389faf06b8dfd9a6fae30fb44e46c82097c7b32f72fd711d23b9222`

Mobil kontrol tarayıcı ölçülerindedir; fiziksel cihaz kabulü değildir. Mevcut büyük JS paketi uyarısı sürüyor. Bu kaydı ekleyen sonraki belge commit'i uygulama dosyalarını değiştirmez.

[Yerel uygulama ve hesap kapsamı](2026-11-01_bakiye-akisi-uygulama.md).
