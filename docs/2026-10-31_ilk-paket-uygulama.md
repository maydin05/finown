# Finown — ilk paket uygulaması

31 Ekim 2026. Kullanıcının öncesi/sonrası sunumuna verdiği onayla uygulandı.

## Durum

- **Yerel kod: HAZIR.** Önce kayıt/hesaplama düzeltmeleri, 12 test ve build; ardından ekstre uyarısı ve 7/30 günlük özet uygulandı.
- **Son doğrulama: 22/22 test, lint ve build başarılı.**
- **Üretim arayüzü: YAYINLANMADI.** Commit/push/deploy yapılmadı.
- **Üretim verisi: yalnız ayrıca onaylanan kira / elektrik / market düzenlemesi uygulandı ve DB readback ile doğrulandı.** Şema değiştirilmedi.
- **Canlı kullanıcı kabulü: NOT_RUN.** Yeni uygulamayla canlı hesaba giriş yapılmadı; üretimde test ödeme/silme yapılmadı.
- **Dar mobil ekran kabulü: tamamlanmadı.** Tarayıcı viewport denemesi ve sonraki bağlantı/sıfırlama çağrıları zaman aşımına uğradı; mobil PASS iddiası yok. Öncesinde varsayılan görünümde örnek verili etkileşim kontrolü başarıyla tamamlandı.

## Kayıt / hesaplama düzeltmeleri

1. Tracker artık olmayan `id` alanını aramıyor; kullanıcı ve anahtar birleşimiyle upsert yapıyor. Yeni gelir/gider anahtarları tür içeriyor. Eski anahtar yalnız tek bir kaynak türüne aitse okunuyor; belirsiz eşleşmeler uyarı alıyor. False yeni değer, eski true değerini geçersiz kılıyor. Eski kayıtlar topluca dönüştürülmedi.
2. Normal veri yüklemedeki otomatik abonelik ödeme aktarımı kaldırıldı. Veri okumak artık ödeme kaydı oluşturmuyor. Geçmişte aktarılmış mevcut ödemeler silinmedi.
3. Gider kaynağı ve gerçek ödeme satırı için ayrı silme hedefi var. Sanal ekstre satırında silme düğmesi yok. Gerçek ödeme silme API’si state ile birlikte çalışıyor; üretimde silme denenmedi.
4. Abonelik takvimi aylık / üç aylık / altı aylık / yıllık ve tek seferlik dönemleri ayırıyor. Ayın olmayan günleri son geçerli güne sınırlandırılıyor. Başlangıç/bitiş dahil; tek seferlik eski kayıttaki ilgisiz recurring bitiş alanı tarihi bozmuyor. Kayıtlı ödeme geçmişi korunuyor.
5. Takvim günü ve varsayılan ödeme tarihi yerel `YYYY-MM-DD` olarak üretiliyor. Abonelik ödeme kaydı tarihleri de aynı ay sonu sınırlandırmasını kullanıyor.
6. Veri çekme hatası görünür; eksik abonelik ödeme geçmişi başarılı boş veri gibi kabul edilmiyor. Tracker kaydetme hatası geri alınıp kullanıcıya bildiriliyor.

Ana dosyalar: `src/domain/finance.js`, `src/hooks/useViewData.js`, `src/api/finown.js`, `src/context/DataContext.jsx`, `src/App.jsx`.

## Kullanıcının teyit ettiği giderler

Kullanıcının gösterilip teyit edilen bir gideri güncel tutar, aylık tekrar ve ödeme günüyle düzenlendi. Geçmiş aylara yeni tutar yayılmadı. Karttan takip edilmesi istenen kaynaklar silinmeden, kullanıcıya ait `expense_excluded:ID` işaretleriyle ayrı toplamdan çıkarıldı. Kullanıcı/kayıt koşullu tek işlem ve ayrı SELECT readback tamamlandı. Kişisel ayrıntılar `docs/private.local/` altında Git dışında tutulur.

## Ekstre ve 7/30 günlük özet

- Eksik ekstre `null` tutar ve “Ekstre tutarı girilmedi” olarak gösterilir. Kullanıcının açıkça kaydettiği 0 TL bilinen sıfır kabul edilir.
- Fiziksel ana kartlar için ekstre beklenir; sanal karta ayrıca ekstre üretilmez. Canlı hesapta fiziksel/sanal kart ayrımı doğrulandı. Önceki eksik ekstre çıkarımı sanal/fiziksel ayrımı içermiyordu; geçerli eksik ekstre hesabı yeni kuralla yapılır.
- Giderler üzerinde bugünden başlayan gerçek 7/30 gün aralığı var; seçili aylık ekrandan bağımsız ve yıl/ay sınırlarını aşar.
- Beklenen gelir, bilinen bekleyen ödeme, aradaki fark, eksik tutar ve bilgi uyarıları, tarih sıralı liste gösterilir. Alınmış gelir ve ödenmiş kayıtlar bu bekleyen tutarlarda yoktur.
- Kartla ilişkili abonelikler listede görünür, ekstre toplamına ikinci kez eklenmez. Kart/ana kart bağlantısı belirsizse ayrıca uyarı vardır.
- Önceki tarihli ödenmemiş gerçek ödeme kayıtları ayrıca belirtilir; dönem farkına gizlice eklenmez. Geçmiş için yıllarca sanal tekrar borcu üretilmez.
- Başlangıç bakiyesi bulunmadığından fark “harcanabilir para / kesin yeterlilik” olarak sunulmaz.
- Eksik metadata veya durumu belirsiz kayıt varsa toplamın sınırı açıkça yazılır. Ek olarak tarihi eksik bir gelir kaydı bulundu; değiştirilmedi, özet uyarısına dahil edildi.

Ana dosyalar: `src/components/CashFlowSummary.jsx`, `src/pages/Expenses.jsx`, `src/components/items/PaymentItem.jsx`.

## Doğrulama

- `npm test`: **22/22**. Bileşik tracker upsert ve false kaydı; hatalı okumanın reddi; salt okunur fetch; yıllık/üç/altı aylık periyot; tek seferlik geçmiş; ay sonu/leap-year; eski durumun korunması ve tür ayrımı; silme yönü; 7 gün sınırı; üç aya yayılan 30 gün; gerçek sıfır/eksik tutar; kart+abonelik çift sayım; sanal kart; takip dışı kaynak; gecikmiş ödeme ayrımı; gerçek React bileşenlerinin HTML çıktısı.
- `npm run lint`: başarılı. Önceden kalan kullanılmayan import/değişkenler davranış değiştirmeden temizlendi. Context hook’u ayrı `src/context/store.js` modülüne taşındı; Provider yalnız bileşen dışa aktarıyor ve Fast Refresh lint istisnası gerekmiyor.
- `npm run build`: başarılı. Önceden de var olan büyük JS paketi uyarısı sürüyor (~1.12 MB / gzip ~305 KB); Browserslist güncellik uyarısı var.
- `git diff --check`: başarılı.
- Canlı kullanıcıya ait veriler bellekte salt okunur SELECT ile yeni modelden geçirildi; teyit edilen gider kuralları, eksik ekstreler ve bilgi uyarıları doğrulandı. Tutarlar ve hareket dökümü diske aktarılmadı; sorgular yanıt alarak tamamlandı. Kişisel sayımlar Git dışındaki yerel kayıttadır.
- Tarayıcıda yalnız sentetik veriyle gerçek yeni bileşenler kullanıldı: 7 → 30 gün aralığı değişti; örnek kartın tutarı girilince eksik uyarısı kalktı, toplam ve fark beklenen şekilde değişti. Bu işlem gerçek hesaba yazmadı; ana uygulamanın Supabase kaydetme akışı için üretim kabulü değildir.
- Tekrar kullanılabilir yerel örnek ekran: `tests/ui-preview.html` (Vite dev server altında). Derlenen üretim çıktısının giriş noktası değildir. Ekran kanıtı: `docs/preview/2026-10-31_ornek-odeme-ozeti.png`.

## Sonraki kapı

Kod yerelde hazırdır. Yayın yetkisi verilirse remote/Netlify hedefi yeniden doğrulanıp yayın ve canlı readback yapılmalı; bunlar yerel test başarısından ayrı durumlar olarak kaydedilmeli. Gerçek cihaz/mobil ve gerçek kullanıcı kabulü ayrıca tamamlanmalıdır.
