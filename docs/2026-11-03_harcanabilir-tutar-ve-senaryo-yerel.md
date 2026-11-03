# Harcanabilir tutar ve maaş senaryoları — yerel uygulama

3 Kasım 2026: Kullanıcı onayıyla ana ekrana uygulandı. Yerel çalışma; commit/push, Netlify yayını veya veritabanı güncellemesi yapılmadı. Yeni migration gerekmiyor. Canlı hesaba giriş/test yapılmadı; üretim finans kayıtlarını okuyan veya değiştiren bir komut çalıştırılmadı.

## Davranış

- Harcanabilir tutar, seçili liste dönemi 7 gün olsa da daima bugünden itibaren 30 günlük akışın en düşük bakiyesinden hesaplanır. Bugünkü bakiye de minimuma dahildir; henüz alınmamış gelir yalnız kendi gününde eklenir. Aynı gün ödemeler önce varsayılır. Negatif sonuç sıfır gösterilir, ödeme açığı ve korunacak payın eksikliği ayrı anlatılır.
- Kart, önceki ayrı bakiye kartının yerini alır. Bakiye düzenleme, 7/30 günlük ana plan ayrıntısı ve gecikenleri dahil etme korunur. Üst gelir/ödeme/dönem farkı üç sütunda sıkıştırıldı; kısa mobil ekranda ilk iki ödeme görünürlüğü korundu. Eksik ekstre ve aynı gün sırası açıklamalarının ayrıntıları hesap/akış pencerelerindedir.
- Güncel bakiye, yeterli finans bilgisi veya doğrulanmış ortak bütçe rezervleri yoksa sayısal harcama payı gösterilmez. Boş bakiye sıfır değildir; mevcut fingerprint/as-of korumaları kullanılır.
- Mevcut aile bütçesi GET uçlarıyla güvenlik payı, onaylı rezervler ve gerçek harcamalar salt okunur alınır. Aynı nakit havuzu için birden fazla politika varsa en yüksek güvenlik payı kullanılır. Ekstre eşleştirmesi ve nakit bakiyeye yansıma, mevcut `familyLedger` kurallarına dayanır; temsil edilmiş harcama tekrar düşülmez.
- Aile kapsamı güncel değilse veya API/sunucu ve yerel finans görünümü uyuşmuyorsa harcama tutarı netleştirilmez. Üyelik her sorguda mevcut sunucu yetkilendirmesiyle kontrol edilir; beş saniyelik okuma yenilenmesi hata verince eski kesin sonuç kaldırılır. Finans fingerprint'i, hesap, gün veya bakiye değiştiğinde önceki koruma verisi kullanılamaz. Yeni izin, RLS değişikliği veya sunucu yazma ucu yoktur.
- İsteğe bağlı ek güvenlik payı başlangıçta sıfırdır; kullanıcı yalnız açık ana ekran için artırabilir. Ortak bütçenin gerçek güvenlik payı otomatik alınır, örnek önizlemedeki tutar gerçek ayarlara yazılmaz. Ek pay, sayfadan ayrılınca/veriler değişince sıfırlanır.
- Deneme için yalnız 30 günlük aralıktaki bekleyen, tutarı bilinen gelirlerden biri seçilir. Bu tek gerçekleşmenin tutarı, 0–10 günlük gecikmesi ve bugün yapılacak ek harcama denenir. Alınmış gelirler seçilemez; diğer aylar ve gerçek maaş planı değişmez. Geciken gelir ufkun dışına çıkarsa bu dönemi finanse etmez.
- Senaryo sonucu ana planla karşılaştırılır; gün gün senaryo akışı ayrı açılır. Ana planın 7/30 gün toplamları ve kayıt listesi değiştirilmez. Vazgeçme/Escape taslağı uygulamaz; “Ana plana dön” denemeyi kaldırır. Sayfadan ayrılınca veya finans kayıtları değişince senaryo sıfırlanır. Salt okunur ortak hesap da yerel deneme yapabilir; bu, kayıt değiştirme yetkisi vermez.

## Yerel örnek ekran ve hesaplar

http://127.0.0.1:5175/tests/spending-plan-preview.html

Bu ekran gerçek ana ekran bileşenlerini sentetik verilerle çalıştırır; oturum, gerçek hesap veya DB bağlantısı kullanmaz. `?shared`, `?missing`, `?stale`, `?familyError` kontrol örnekleridir. `?familyRemote` yalnız otomatik testlerin sahte GET yanıtlarıyla okuma adaptörünü sınadığı moddur; gerçek sunucu kabulü değildir.

25.000 TL örnek bakiye, 120.000 TL beklenen gelir ve 5.000 TL korunacak pay için dönem sonu 9.000 TL iken en düşük bakiye 7.000 TL, harcanabilir tutar 2.000 TL olur. 115.000 TL gelirde korunacak payda 1.000 TL eksik kalır; ödeme açığı yoktur. 140.000 TL gelirde maaş öncesi dar dönem değişmediğinden bugün harcanabilir tutar yine 2.000 TL'dir. Üç günlük gecikme 21 Kasım'da 5.000 TL açık, bugün 10.000 TL ek harcama 9 Kasım'da 3.000 TL açık oluşturur. Bunlar kişisel finans verileri değildir.

## Doğrulama

- 90 birim/API testi başarılı. Yeni sekiz test: minimum/son bakiye ayrımı, kaynak satırların değişmezliği, maaş düşüşü/gecikme/ek harcama, eksik tutar/bakiye, gecikenlerin korunması, kuruş hesabı, aynı gün sırası, yıl ve ufuk sınırı, alınmış gelirin seçilememesi, geçersiz tutarlar, aile rezervlerinin ekstre/nakit yansımasıyla çift sayılmaması, eski kapsam/gün/finans görünümünde sonucu engelleme.
- 320/375/430 px genişliklerde 108 mobil test başarılı. Yeni 12 test; form, iptal, geçersiz girdiler, sıfırlama, ek pay, salt okunur hesap örneği, eksik/eski veri, GET adaptörünün yenilenmesi ve 403 yanıtında sonucu kaldırmasını kapsar. Sentetik testlerde yazma isteği oluşmadığı ayrıca doğrulandı.
- Son doğrulama, iki eşzamanlı çalışanla tüm 108 mobil senaryoda başarılıdır. Önceki yüksek eşzamanlı koşuda iki form kontrolü aralıklı hata verdi (58/60); ilgili altı kontrol ayrı koşuda geçti, ardından tüm paket 108/108 doğrulandı. Bu aralıklı başarısızlıklar sessizce başarı sayılmadı.
- ESLint ve üretim build başarılı. Önceden var olan büyük JS paketi uyarısı sürüyor.
- 375×812 ana ekran ve maaş senaryosu formu tarayıcıda görsel incelendi. 320/375/430×667 ilk iki ödeme görünürlüğü mevcut regresyonla kontrol edildi. Görseller `docs/private.local/2026-11-03_harcanabilir-yerel-ana-ekran.jpg` ve `2026-11-03_harcanabilir-yerel-senaryo.jpg` içinde, Git dışında.
- Bu görev gerçek iki hesap/Supabase Auth, canlı aile sunucusu, canlı finans verileri veya fiziksel telefon kabulü değildir. Sunucu erişim kuralları değiştirilmedi; HTTP okuma testi kontrollü sahte yanıtlarla yapıldı. Kullanıcı GitHub'a gönderimi ve yayını beklettiğinden dış kartlara rapor/görsel gönderilmedi.

Loglar: `/tmp/finown-spending-unit.log`, `/tmp/finown-spending-final-mobile.log`, `/tmp/finown-spending-final-overview.log`, `/tmp/finown-spending-lint.log`, `/tmp/finown-spending-build.log`.

## Yayın öncesi

Kullanıcı ayrıca yetkilendirirse güncel Git hedefi/değişiklik sahipliği doğrulanmalı; yalnız onaylı dosyalar gönderilmeli. Migration yoktur. Gerçek hesapta aile GET yanıtı ve harcama payının belirsizlik nedenleri salt okunur incelenmeli; üretim kayıtları veya bakiyesi test amacıyla kaydedilmemelidir. Yerel kabul canlı doğrulama sayılmamalıdır.

## Yayın güncellemesi

3 Kasım 2026: Bu belgenin üstündeki yerel durum tarihsel aşamadır. Kullanıcının ayrı yayın onayıyla özellik GitHub/Netlify üretimine alındı, canlı mobil kabul ve satır koruması doğrulandı. Güncel kanıt: [üretim yayın kaydı](2026-11-03_harcanabilir-tutar-ve-senaryo-yayin.md).
