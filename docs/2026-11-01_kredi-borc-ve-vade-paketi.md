# Kredi, bağlı borç ve vade paketi

1 Kasım 2026. Durum: uygulama kodu yerelde hazır; eklemeli veritabanı değişikliği Finown Supabase projesine uygulandı ve geri okundu. Bu paket için commit, push veya Netlify yayını yapılmadı.

## Davranış

| Alan | Önce | Sonra |
| --- | --- | --- |
| Yeni kredi | Ürün kaydı ve taksitler birlikte oluşturulmuyordu | Tek işlemde ürün ve bekleyen taksitler; hata halinde tamamı geri alınır |
| Tekrar deneme | Aynı isteğin yeniden gönderilmesi çift kayıt riski taşır | Aynı istek kimliği aynı planı döndürür; farklı içerik reddedilir |
| Ay sonu taksitleri | Plan önizlemesi yok | Örneğin 31 Ocak → 28 Şubat → 31 Mart; kayıttan önce ilk taksitler ve toplam görünür |
| Mevcut kredi | Plan alanları düzenlenebiliyordu | Banka/ad düzenlenir; taksit alanları kilitlidir, eski ödeme satırları yeniden üretilmez |
| Kalan kredi | Ana kayıttaki tutar güncelliğini yitirebilirdi | Gerçek ödenmemiş taksitlerin toplamı gösterilir; ödeme değişiminde ana kayıt da güncellenir |
| Elden borç | Sabit döviz tutarı ve kur dönüşümü | Sonlu TL gider planı üzerinden tek takip; mevcut gider kaynağına işaret eklenir |
| Ay ve vade | Aylık gezinme | Ödemeler, Gelir, Abonelik ekranlarında “Bu aya dön”; ödeneceklerde Geciken/Bugün/7 gün filtreleri |

Borç planı bitiş tarihi gerektirir. Ödemeler ekranı ile Bankalar ekranı aynı kaynak ve aynı durum işaretlerini kullanır. Borç ödemesi ikinci bir satır olarak eklenmez. Belirsiz eski durumlar veya eksik plan bilgisi sıfır borç gibi sunulmaz; uyarı gösterilir.

7 günlük filtre bugün dahil yedi takvim gününü kapsar ve ay sınırını aşabilir. Geciken filtresi geçmiş aylardaki gerçek ödeme satırlarını ve mevcut ayın kaynak vadelerini gösterir; eski aylara tahmini gider üretmez. Eksik kart ekstresi uyarıları korunur. Üstteki aylık özet ile süzülmüş listenin kapsamı ayrıca açıklanır.

## Veritabanı

Kaynak: `supabase/migrations/202611010001_loan_plans_and_debt_link.sql`.

- `expense_sources.is_debt` ve `products.creation_request_id` eklenir.
- Kullanıcı + istek kimliği için benzersizlik; kredi oluşturma için tek işlem ve istek kilidi.
- `create_loan_with_payments` ve `update_loan_details` kullanıcı oturumu, sahiplik ve mevcut RLS ile çalışır (`security invoker`). Anon rolüne yürütme izni verilmez.
- Ödeme değişiminde ilgili kredinin kalan tutarını güncelleyen tetikleyici; kurulumda eski satırları tarayıp değiştirmez.
- Mevcut kredi düzenleme fonksiyonu ödeme tablosuna yazmaz.
- PostgREST şema önbelleği yenilenir. Yetki genişletme veya RLS değişikliği yoktur.

Migration, Management API üzerinden korumalı tek işlemle uygulandı; CLI ile toplu `db push` çalıştırılmadı. Canlıda yeni kredi oluşturma testi yapılmadı. Finansal inceleme, kişisel eşleştirme, önce/sonra yedekleri ve hash kayıtları Git dışındaki `docs/private.local/` içinde tutulur.

## Doğrulama

- `npm run lint`: başarılı.
- `npm test`: **29/29**.
- `npm run test:mobile`: **39/39**, 320/375/430 piksel; sentetik verilerle gezinme, detay pencereleri, ödeme durumu, borç bakiyesi, vade filtreleri ve kredi formları.
- `npm run build`: başarılı. Mevcut büyük JS paket boyutu uyarısı devam ediyor.
- `bash scripts/test-package123-db.sh`: yalıtılmış PostgreSQL 18 içinde başarılı. Tek işlemde oluşturma/geri alma, ay sonu, bekleyen durumlar, aynı istekle tekrar, eşzamanlı tekrar, eşzamanlı ödeme güncelleme, bakiye/geri alma, sahiplik/RLS ve mevcut taksitlerin korunması doğrulandı. Docker gerektirir ve kendi geçici konteynerini kapatır.
- Üretimde tam satır karşılaştırması: mevcut ödeme satırları, durum işaretleri, ürünlerin önceki alanları ve gider kaynaklarının önceki alanları korundu. Yalnız onaylı mevcut borç kaynağı işaretlendi; yeni ödeme veya durum satırı oluşturulmadı. Fonksiyonların `security invoker` ve anon erişimine kapalı olduğu geri okundu.
- `git diff --check`: başarılı.

Yerel önizleme: `http://127.0.0.1:5175/tests/ui-preview.html?app=1`; form önizlemesi: `http://127.0.0.1:5175/tests/forms-preview.html`. Önizlemeler sentetik veriler içerir. Yeni arayüzün gerçek hesapla canlı kabulü, frontend yayını sonrasında yapılmalıdır.
