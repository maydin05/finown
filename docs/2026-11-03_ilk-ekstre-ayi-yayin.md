# Kartın ilk ekstre ayı — üretim yayını

3 Kasım 2026. Kullanıcı özelliğin GitHub/Netlify yayınını, gerekli veritabanı güncellemesini, belirtilen kartın Kasım 2026 başlangıcının kaydedilmesini ve mevcut ödeme kayıtları korunarak canlı mobil kontrolünü yetkilendirdi.

## Yayın kapsamı ve veritabanı

- Fiziki kart formunda isteğe bağlı ilk ekstre yılı/ayı; banka ayrıntısı ve ortak salt okunur ürün geçmişinde okunur başlangıç bilgisi.
- Sınır sadece otomatik boş ekstre üretimini etkiler. Başlangıçtan önceki kayıtlı ödeme de korunur; ödeme tarihi, tutarı, durumu veya geçmişi yeniden üretilmez. Başlangıcı boş kartlarda önceki davranış sürer.
- `202611030001_card_first_statement_month.sql` üretimde uygulandı. Kaynak SHA-256: `0b9ac32c17747a28573599c98f83a4442d8378d41aeb8f3c74d8565581d47b94`. Nullable DATE alanı, ayın ilk günü/aralık/kart türü kontrolü ve kolon açıklaması içerir; backfill veya erişim genişletme yoktur.
- Yeni alanın olmadığı canlı şemadan taze kopya alındı. Kayıtlı kartın değişmediği satır karşılaştırmasıyla kontrol edilerek migration ve tek kartın başlangıç kaydı aynı transaction’da tamamlandı. İşlem öncesi ürün tetikleyicileri incelendi; ödeme üreten tetikleyici yoktu.
- İşlem sonrası yalnız yeni kolon farkı var: hedef kartta başlangıç ayı, diğer ürünlerde null. Diğer bütün ürün alanları, tüm ödeme kayıtları ve diğer finans/aile/Auth satırları kopyayla aynı. Kişisel hedef/ödeme ayrıntıları Git dışında tutulur.
- Üretimde migration geçmişi tablosu bulunmadığından bu dosya özel olarak uygulanıp şema readback’iyle doğrulandı; başka eski migration veya toplu `db push` çalıştırılmadı.

## Yayın öncesi test

82 birim, 16 gerçek yerel Auth/PostgreSQL sunucu ve 99 mobil test başarılı. Yeni ay sınırı, kısmi seçim/iptal/temizleme, gerçek ödeme geçmişinin korunması, bakiye güncelliği, ortak DTO ve yerel migration testleri dahil. Lint ve üretim derlemesi başarılı; önceki bundle/Browserslist uyarıları sürüyor.

## Canlı kabul

- Özellik SHA’sı `b587a7e29042b046ea713ff3d1dd5dac568f1d5c`, GitHub `main` üzerinde readback ile doğrulandı. Netlify `6ae9a243c94fe6cb90b50136`, aynı SHA ile `ready`; yayın zamanı 3 Kasım 2026 11:59 TRT. Canlı health 200/ready. Üretim derlemesi ve Netlify Function paketlemesi başarılı.
- Mevcut bütçe sahibinin gerçek oturumunda önceki ayın otomatik kart satırının kalktığı görüldü. Kayıtlı üç ayın ödeme satırları aynı tarih/tutarla listelendi; kayıt veya durum işlemi yapılmadı.
- Banka kart ayrıntısında kayıtlı ilk ekstre ayı doğru göründü. Düzenleme formunda kayıtlı yıl/ay okundu; alanlara müdahale edilmeden Vazgeç ile kapatıldı.
- Önceki ay ve başlangıç ayı Ödemeler listesi ile ürün formu 320/375/430 × 812 px ölçülerinde kontrol edildi. Dokuz görünüm/ölçüde yatay taşma yok; önceki ayda otomatik satır yok, başlangıç ayında gerçek kayıt var.
- Yayın ve canlı kontrol sonrasında bütün satırlar, yalnız onaylı DB adımını içeren kopyayla birebir aynı. İlk kopyaya göre izinli tek değer farkı hedef kartın yeni başlangıç alanı; tüm ödeme kayıtları, tutarlar, tarihler, durumlar, diğer ürün alanları, diğer finans/aile/Auth kayıtları korunuyor.
- Kolon DATE/nullable ve kontrol kısıtı doğrulanmış durumda. Yeni hesap, davet, e-posta, erişim genişletme veya ödeme işlemi yapılmadı.
- Canlı form görüntüsü incelenip Git dışındaki özel alana alındı. Geçici viewport sıfırlandı; sayfa güncel ayda açık bırakıldı. Fiziksel cihaz kabulü yapılmadı.
- Canlı görüntüler ve kişisel finans ayrıntıları kamuya açık depoya gönderilmedi.
