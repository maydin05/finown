# Aylık gerçek maaş/gelir tutarı — canlı yayın

1 Kasım 2026. Kullanıcı GitHub gönderimini, Netlify üretim yayınını ve gerekli veritabanı güncellemesini yetkilendirdi; mevcut kayıtların, tarihlerin ve ödeme durumlarının korunmasını istedi.

## Yayın ve veritabanı

- Uygulama commit'i `a61bb15494597cb431864690c4badff6e88fa0c6`; GitHub `main` ucu `git ls-remote` ile doğrulandı.
- Netlify üretim deploy'u `6ae76da1e417fef6f8774fb6`, `ready`; yayın 16:49:52 UTC / 19:49 Türkiye saati. Hedef https://finown.netlify.app/ ; site `2bed4a00-a1b4-4f59-9989-5ad9b580baf0`, repo `maydin05/finown`, dal `main`, build ve yayın dizini doğrulandı.
- `202611010003_income_receipts.sql`, frontend yayınından önce Supabase `zowlpzmvwiszwhtvsagj` projesine uygulandı. Yeni tablo/RPC'nin önceden bulunmadığı doğrulandı; eski SQL/migration dosyaları yeniden çalıştırılmadı.
- RLS açık; anonim tablo okuma ve authenticated DELETE yok. Kaydetme RPC'si SECURITY INVOKER. Tablo ve RPC uygulama sonrası yeniden okundu.
- Üretimde gerçek/tahmini maaş tutarı oluşturulmadı. Yeni tablo son kontrolde boş; eski alınmış işaretleri otomatik taşınmadı.

## Doğrulama

- Yerel uygulama: 45 birim/API testi, 60 mobil test, yalıtılmış PostgreSQL 18 migration/RLS/ay izolasyonu testleri, ESLint, build ve diff kontrolü başarılı. Büyük JS paketi uyarısı sürüyor.
- Canlı oturumsuz mobil smoke 6/6 başarılı; gerçek auth yazma isteği gönderilmedi.
- Gerçek açık hesapta Gelirler → maaş ayrıntısı → “Alındı olarak işaretle” yeni aylık formu açıyor. Bu aşama yalnız formu açar, durum kaydetmez. Doğru ay ve planlanan tutar önceden dolu; not boş. Form kaydedilmeden Vazgeç ile kapatıldı.
- Form 320/375/430 × 667 ölçülerinde kontrol edildi: yatay taşma yok, pencere ekrana sığıyor ve kaydet düğmesi görünür. 375 px görüntü Git dışında saklandı.
- Sonraki ayın maaş planı aynı tutar ve ödeme gününü koruyor. Özet'teki beklenen gelir ayrıntısından aynı aylık form açıldığı da kaydetmeden kontrol edildi.
- Konsol hata/uyarı listesi kontrol sonunda boş. Viewport sıfırlandı ve canlı sekme Gelirler sayfasında bırakıldı.
- Üretim öncesi tam satır yedeği ve güncelleme/canlı kontrol sonrası karşılaştırma mevcut dokuz tabloda aynı sonucu verdi: bankalar, 173 ödeme, tracker kayıtları, ürünler, gider/gelir/abonelik kaynakları, abonelik ödemeleri ve kullanılabilir bakiye. Tarihler, tutarlar ve ödeme/alınmış durumları değişmedi. Yedekler ve kişisel kanıtlar `docs/private.local/` içinde Git dışında.
- Canlı JS/CSS yerel üretim çıktısıyla byte düzeyinde aynı:
  - `/assets/index-Ck-KBF00.js`: SHA-256 `503c28cedfd493f2d95c6bcb1f30ed5be92080d480b5c908f52374288f3bc08a`
  - `/assets/index-Da6rzbdA.css`: SHA-256 `974ece83345d0be19cdc39a1ca5256c79874620c47a044c4d28f0577acafd7cb`

Sınır: Gerçek hesapta kaydetme/düzeltme/geri alma yapılmadı; bu akışlar sentetik mobil ve yalıtılmış SQL testleriyle doğrulandı. Mobil kontrol tarayıcı ölçülerindedir, fiziksel cihaz kabulü değildir. Bu kaydı ekleyen sonraki belge commit'i uygulama dosyalarını değiştirmez.

[Yerel uygulama, aylık tutar örnekleri ve test kapsamı](2026-11-01_aylik-gercek-gelir.md).
