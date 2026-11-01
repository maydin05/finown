# Dört liste sayfasının kompakt tasarımı — canlı yayın

1 Kasım 2026. Kullanıcı GitHub ve Netlify yayınını, ardından mevcut kayıtlar/tarihler/ödeme durumları korunarak canlı mobil görünüm kontrolünü onayladı.

## Yayın

- Uygulama commit'i `9680a6c9b1bf1cd89f3ba8c339b70548dcedadca`; GitHub `main` ucu `git ls-remote` ile doğrulandı.
- Netlify deploy `6ae7664b83f59d79f6de2793`, `ready`, yayın 16:18:34 UTC / 19:18 Türkiye saati. Site `2bed4a00-a1b4-4f59-9989-5ad9b580baf0`; repo `maydin05/finown`, dal `main`, build `npm run build`, çıktı `dist` doğrulandı.
- Hedef https://finown.netlify.app/ . Bu yayın şema/veri/servis ayarı değişikliği içermiyor.

## Kontroller

- Yerel uygulama 41 birim/API testi, 51 mevcut + 3 yeni mobil senaryo, ESLint, üretim derlemesi ve diff kontrolünden geçti.
- Canlı oturumsuz mobil smoke 6/6 başarılı; auth yazma isteği gönderilmedi.
- Gerçek açık hesapta Ödemeler, Gelirler, Abonelikler ve Bankalar 320/375/430 × 667 ölçülerinde kontrol edildi. Yatay taşma yok. Ortak başlık 54 px, toplam kartları yaklaşık 72–131 px yüksekliğinde; ilk kayıt her sayfada alt gezinmenin üzerinde tamamen görünür.
- Sayfa adları, ay seçimi, tutarlar ve filtreler korunuyor. Eksik ekstre uyarısı Ödemeler sayfasında görünür. Eski karttan takip edilen giderler listenin altındaki açılır alanda.
- Dört sayfanın 375 px görüntüsü alındı. Gerçek hesaptaki kaydetme, silme ve ödeme durumu eylemleri kullanılmadı. Kontrol sonundaki konsol hata/uyarı listesi boş; viewport sıfırlandı, sekme Ödemeler sayfasında bırakıldı.
- Dokuz tablo için yayın öncesi ve sonrası tam satır karşılaştırması aynı: bankalar, ürünler, 173 ödeme, takip kayıtları, gider/gelir/abonelik kaynakları, abonelik ödemeleri ve kullanılabilir bakiye tablosu. Tarihler ve ödeme durumları dahil hiçbir mevcut kayıt değişmedi. Yedek ve kişisel görüntüler Git dışındaki `docs/private.local/` içinde.
- Canlı varlıklar yerel üretim çıktısıyla byte düzeyinde aynı:
  - `/assets/index-6gWavxN2.js`: SHA-256 `375085c2a7b48c840613b5cfd1bb69650e5f3edf8eaa07e835c2e4942b59f5fd`
  - `/assets/index-Da6rzbdA.css`: SHA-256 `974ece83345d0be19cdc39a1ca5256c79874620c47a044c4d28f0577acafd7cb`

Mobil doğrulama tarayıcı ölçülerindedir; fiziksel cihaz kabulü değildir. Büyük JS paketi uyarısı sürüyor. Bu kaydı ekleyen sonraki belge commit'i uygulama dosyalarını değiştirmez.

[Yerel uygulama ayrıntıları](2026-11-01_kompakt-liste-sayfalari.md).
