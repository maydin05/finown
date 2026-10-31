# Finown — ilk iyileştirme önerileri

31 Ekim 2026. Üç ayrı ajan: UI/UX, teknik yapı, kullanıcıya ait veriler ve finansal takip faydası. Kod/üretim veri/ayar değişikliği yapılmadı. Bu dosya araştırma çıktısıdır; uygulama onayı değildir.

## Hedef ve önerilen yaklaşım

Mehmet’in seçtiği öncelik: **“Önümüzdeki günlerde ne kadar ödeme var, gelir yeterli mi?”**

Mevcut dört sekmeli yapıyı koru. İlk kullanıcıya görünen iyileştirme, Giderler ekranının üstünde ay sınırını da aşan bir **Önümüzdeki 7 gün / 30 gün** özeti olsun. Yeni bir kapsamlı dashboard veya yeniden yazım gerekmiyor. Önce toplamları etkileyen mevcut hatalar giderilmeli.

## İlk paket

| Sıra | Dokunuş | Günlük karşılığı | Efor |
| --- | --- | --- | --- |
| 1 | Ödeme satırı silme hedefini düzelt; gelir/gider durumlarını kayıt türüne göre ayır; kontrolsüz açılış aktarımını kaldır | Bir işlemin başka kaydı etkilemesini önle | Silme S; eski durum geçişi M |
| 2 | Gider türü, yıllık abonelik periyodu ve ay sonu tarihlerini doğrula | Ödemeler doğru dönemde, eksiksiz görünsün | Kod S–M; veri düzeltmesi ayrı onay |
| 3 | Eksik ekstreyi “0 TL” yerine “Tutar girilmedi” göster; toplamı “Bilinen ödemeler” olarak etiketle | Borç yok ile henüz bilinmiyor ayrılsın | S |
| 4 | Giderler üzerinde gerçek 7/30 günlük vade ve gelir özeti ekle | Yaklaşan yük ile beklenen geliri bir bakışta karşılaştır | M |
| 5 | Kaydetme kilidi, görünür hata ve tekrar deneme; “Ödendi işaretle” metni | Kaydın gerçekleştiği anlaşılsın, çift kayıt ihtiyacı azalsın | S |
| 6 | “Bu aya dön” düğmesi ve geciken/bugün/yaklaşan filtreleri | Günlük takibe dönüş ve öncelik seçimi hızlansın | S |

S/M göreli efor tahminidir; süre taahhüdü değildir. İlk iki satırın mevcut veri üzerindeki düzeltmesi kullanıcıyla doğrulanmadan yapılmamalı.

## 7/30 gün özetinin kapsamı

- Beklenen gelir, bilinen ödemeler, bunların farkı, tutarı eksik kart sayısı.
- Bugün / geciken / yaklaşan vadeler ve tarih sıralı tek liste.
- Aylık görünümün filtresini kullanmak yerine gerçek tarih aralığı: örneğin ayın son günündeki 7 günlük görünüm gelecek ayı da kapsamalı.
- Beklenen gelir ile alınmış gelir ayrı gösterilmeli; “alındı” kaydı mevcut nakit bakiyesi değildir.
- 17 aboneliğin kartla ilişkisi bulundu; aktiflik/vade ayrıca filtrelenmeli. Karttan ödenen abonelik ile kart ekstresi aynı nakit çıkışı olarak iki kere toplanmamalı. Harcama takibi ile bankadan çıkacak para için açık kapsama kuralı tanımlanmalı.
- Banka/nakit başlangıç bakiyesi tutulmadığından ilk sürüm **“Beklenen gelir − bilinen ödemeler farkı”** diyebilir. “Ödemelerin kesin karşılanıyor” veya “harcanabilir paran” sonucu veremez. Sonraki adım isteğe bağlı, tarihli kullanılabilir bakiye girişi olabilir.
- Eksik veya güncelliği doğrulanmamış veri varsa görünür uyarı; kesin yeter/yetmez sonucu üretme.

## UI/UX incelemesi

Korunacaklar: dört sekme, ortak ekleme düğmesi, aylık liste, beklenen/ödenen ayrımı, abonelikte beklenen/gerçek tutar, modal sabit işlem alanı.

Küçük dokunuşlar:

1. Eksik kart ekstresi satırına “Ekstre tutarı gir”; toplamın altına eksik kayıt adedi. `src/pages/Expenses.jsx:43,66`, `src/components/items/PaymentItem.jsx:112`.
2. Formlarda alan altında doğrulama, “Kaydediliyor…” ve hata halinde formu açık tutma. `src/App.jsx:176,186,198`, `src/modals/BankModal.jsx:70`.
3. “Öde” yerine “Ödendi işaretle”; bankadan ödeme yapılmadığını kısa yardımcı metinle açıkla. `src/components/items/PaymentItem.jsx:152`, `src/modals/PaymentConfirmModal.jsx:98`.
4. Ay/yıl seçici ve “Bu aya dön”. `src/App.jsx:43,355`, `src/pages/Expenses.jsx:99`.
5. Veri alınamadı, hiç kayıt yok, seçili ay boş, hepsi ödendi durumlarını ayır. `src/context/DataContext.jsx:109`, `src/pages/Subscriptions.jsx:201`.
6. Dokunmatik ekranda görünür düzenle/sil menüsü, ikonlarda erişilebilir ad, modal odak yönetimi. `src/pages/Banks.jsx:398`, `src/components/ui/Modal.jsx:17`.

Oturumlu canlı ekranlara görsel kabul testi yapılmadı. Kaynak/stil incelemesidir; kontrast ve gerçek cihaz taşması ölçülmedi. Salt okunur incelemeyi korumak için login yapılmadı: uygulama açılışı eski ödeme aktarımını tetikleyebiliyor.

## Teknik inceleme

### Öncelikli doğruluk ve kayıt koruma bulguları

- **Yanlış silme hedefi:** Giderler tüm satırları `delete_expense` olarak açıyor; handler `expense_sources` üzerinden siliyor. Kart/taksit ödeme ID’si başka gider ID’siyle eşleşirse ilgisiz kayıt hedeflenebilir. Gerçek ödeme ile gider kaynağı ayrılmalı; sanal kartın silme anlamı ayrıca tanımlanmalı. `src/pages/Expenses.jsx:173`, `src/App.jsx:262-275`. Üretimde silme denenmedi.
- **Durum anahtarı çakışması:** Gelir/gider ortak `ID_AY_YIL` anahtarı kullanıyor. Aynı ID’li iki kayıt birlikte tamamlanmış görünebilir. Açılışta aynı eski anahtar abonelik ödemesi olarak yorumlanabiliyor. Yeni anahtar tür içermeli; eski anahtarın kaynağı tahminle dönüştürülmemeli. `src/pages/Incomes.jsx:24`, `src/pages/Expenses.jsx:90`, `src/context/DataContext.jsx:25-108`.
- **Tracker şema uyumsuzluğu:** API `trackers.id` varsayıyor; canlı tabloda yalnız `user_id`, `key`, `value` var. `(user_id,key)` üzerinden upsert yapılmalı. `src/api/finown.js:270`.
- **Periyot ve gün:** Abonelik dalında yıllık/üç aylık filtre yok; 31. gün Şubat’ta Mart’a taşıyor. Ortak takvim yardımcısı ve son güne sınırlandırma gerekli. `src/hooks/useViewData.js:11,22,118,126`, `src/context/DataContext.jsx:272`.
- **Hata görünürlüğü:** Veri okuma ve ödeme işaretleme hataları konsolda kalabiliyor; abonelik ödeme okuma hatası boş diziye dönüştürülebiliyor. Eksik veriyle tamamlandı özeti/otomatik aktarım yapılmamalı. `src/api/finown.js:154`, `src/context/DataContext.jsx:109,239`.

### İkinci tur

- Gelecek tarihli düzenlemede eski kaydı kapatıp yenisini açan iki işlemi atomik yap; kesinti halinde dönem boşluğu bırakma. `src/App.jsx:225`.
- Kodda sabit elden borcu yönetilebilir kayda dönüştür; kur tarihi ve eski kur uyarısı ekle. `src/pages/Banks.jsx:7,12,320`. Mevcut tutarı bu araştırmada değiştirmedik.
- Sayfa bazlı yükleme/paket boyutu ve lint temizliği. Bunlar ilk nakit akışı özeti kadar yüksek kullanıcı faydası taşımıyor.

### Teknik doğrulama

- Build başarılı; JS paketinde yaklaşık 1.113 KB / gzip 302 KB boyut uyarısı.
- Lint 19 hata: çoğu kullanılmayan değişken; bir Fast Refresh dosya ayrımı hatası. Lint geçmiyor.
- Sentetik kontroller: yıllık abonelik Şubat’ta listeleniyor; aynı ID’li gelir/gider birlikte true oluyor; Şubat/31 Mart’a taşıyor. Bunlar gerçek üretim kullanıcı kabulü değildir.
- İlk anlamlı regresyon kontrolleri: kayıt türüne göre silme, durum tür ayrımı, yıllık periyot, ay sonu ve ay sınırını geçen 7 günlük görünüm.

## Veri incelemesi

Yalnız yetkili kullanıcıya ait salt okunur sorgularla kontrol edildi. Kişisel kayıt sayıları ve ayrıntılar Git dışındaki `docs/private.local/` klasöründe korunur.

- Bazı kaynaklarda kategori ile tekrar türü uyumsuzluğu bulundu; veri düzeltmeleri kullanıcı teyidine bağlı tutuldu.
- Yıllık abonelik periyodu ve fiziksel/sanal kart ayrımı gerçek veriyle doğrulandı.
- Önceki ekstre sayımı fiziksel/sanal ayrımı içermiyordu; yeni kural geçerlidir.
- Eski aktarılan ödeme kayıtları gerçek banka işlem kanıtı sayılmadı.
- Kullanıcı-sınırlı mevcut kaynak ID kümelerinde çakışma görülmedi; tasarım riski gelecekteki kayıtlar için giderildi.

## Uygulama sırası önerisi

Önce **güvenilir kayıt ve tarih**, sonra **eksik tutar işareti + kısa vadeli özet**, ardından **küçük form ve gezinme kolaylıkları**. İlk pakette banka entegrasyonu, otomatik ödeme, yatırım önerisi, kapsamlı grafik sistemi veya yeni ana ekran gerekmiyor.

Bu araştırma sonucunda hiçbir kod düzeltmesi veya veri temizliği uygulanmadı. Bulguların çözümü için ayrıca kapsam seçilmeli; özellikle geçmiş ödeme durumları ve yanlış türdeki mevcut kayıtların anlamı Mehmet’le teyit edilmeli.

Bütün salt okunur DB sorguları yanıt alarak tamamlandı. Araştırmada uygulama kodu ve üretim verileri değişmedi; yalnız bu rapor ile README rapor bağlantısı eklendi.

## 31 Ekim — Uygulama güncellemesi

Bu belge ilk araştırmanın tarihsel kaydıdır. Kullanıcı onayıyla ilk iki aşama yerelde uygulandı; ayrıca teyit edilen üç gider düzenlendi. Güncel kapsam ve kabul sınırları: [İlk paket uygulama kaydı](2026-10-31_ilk-paket-uygulama.md). Önceki eksik ekstre değerlendirmesi sanal kart ayrımı içermediğinden yeni fiziksel kart hesabıyla geçersiz kılındı.
