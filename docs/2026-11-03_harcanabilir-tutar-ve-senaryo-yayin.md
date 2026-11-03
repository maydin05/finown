# Harcanabilir tutar ve maaş senaryoları — üretim yayını

3 Kasım 2026. Kullanıcı GitHub/Netlify yayınını ve mevcut kayıtlar, tutarlar, tarihler ve ödeme durumları korunarak canlı mobil kontrolü yetkilendirdi.

## Kapsam ve koruma

- Harcanabilir tutar: 30 günlük en düşük bakiye, ortak bütçe rezervleri ve güvenlik payı; güncel olmayan/eksik bilgide kesin sonuç verilmez.
- Maaş tutarı, gecikmesi ve bugünkü ek harcama yalnız ekran belleğinde denenir. Bekleyen gelirin tek gerçekleşmesi hesap kopyasında değişir; gerçek gelir planı ve ödeme kayıtları değişmez.
- Mevcut 7/30 günlük ana plan, bakiye ayrıntısı ve gecikenleri dahil etme korunur. Kısa mobil ekranda ilk ödemeler için kompakt üst özet kullanılır.
- Şema, yönetim ayarı, RLS veya sunucu yetkisi değişikliği yok. Migration gerekmez. Yeni yazma ucu yok; ortak bütçe mevcut yetkilendirilmiş GET uçlarından okunur.
- Kişisel finans detayları, tam satır karşılaştırma kopyaları ve canlı ekran görüntüleri Git dışında tutulur.

## Yayın öncesi

Hedef repo `maydin05/finown`, Netlify site `2bed4a00-a1b4-4f59-9989-5ad9b580baf0`, üretim dalı `main`; başlangıç Git/Netlify SHA `abece3d0de2a5f6c0bd89f7b0b43827042f25475` salt okunur doğrulandı. Çalışma ağacındaki dosyalar bu onaylı özellik ve önizlemelerine ait.

90 birim/API testi, lint ve üretim derlemesi yayın hazırlığında yeniden başarılı. Yerel uygulamadaki 108 mobil regresyon (320/375/430 px), iki çalışanla tamamen geçti; önceki aralıklı form kontrolü sonuçları yerel kayıtta korunuyor. Gerçek iki hesap veya canlı kabul, yerel örnek testiyle eş tutulmuyor. Netlify Function paketlemesi ayrıca doğrulanır. Mevcut büyük bundle uyarısı sürüyor.

Yayın öncesi finans/aile/Auth temel kayıtlarının salt okunur kopyası alındı. Üretime finans kaydı yazılmadı. GitHub gönderimi, Netlify yayın sonucu ve canlı mobil kabul aşağıya ayrıca eklenecek; bu hazırlık metni tamamlanmış yayın kanıtı değildir.

## Tamamlanan yayın ve canlı kabul

- Özellik commit'i `f9a85fac65a544b5ee39e6b5a545b726b53d5450`, GitHub `main` üzerinde exact SHA readback ile doğrulandı.
- Netlify üretim deploy'u `6ae9f0b5ed7d8e3ae5805797`, aynı commit ile `ready`; yayın 3 Kasım 2026 17:33:54 TRT. Frontend build, lint ve 90 birim/API testi başarılı. Netlify Function paketlemesi `netlify functions:build --src netlify/functions --functions .netlify/functions` ile başarılı. CLI bu sürümde `--offline` seçeneğini desteklemediği için kaynak/hedef açık verildi; bu paketleme üretim ayarı değiştirmez.
- Gerçek bütçe sahibinin açık canlı oturumunda yeni kompakt kart ve bekleyen maaş seçimi doğrulandı. Kullanılabilir bakiye bulunmadığından sayısal harcama payı gösterilmedi. Eksik ekstreler ve doğrulanması gereken ortak bütçe kapsamı da ayrıntıda açıklandı; hesap tamamlanmış gibi sunulmadı.
- Ana ekran, maaş senaryosu formu ve hesap ayrıntısı 320/375/430×812 ölçülerinde kontrol edildi (dokuz görünüm/ölçü). Yatay taşma yok, pencereler ekrana sığıyor. Ana ekranda ilk iki ödeme alt gezinmenin üzerinde kaldı.
- Senaryo formunda örnek maaş tutarı, üç günlük gecikme ve örnek ek harcama yalnız ekran belleğinde denendi. “Senaryoyu göster” sonrasında ana plana dönüldü; yeniden açılan formda özgün beklenen gelir ve sıfır gecikme/ek harcama geri geldi. Yeni maaş/ödeme/bakiye veya aile politikası kaydedilmedi. Hesap ayrıntısı Vazgeç ile kapatıldı.
- 7/30 günlük geçiş ve belirsizlik uyarıları görüldü. Görüntüde sayısal sonuç için bakiye/ekstre/kapsam doğrulaması gerekliliği korunuyor; bu eksikleri test amacıyla doldurmak yetki kapsamına dahil edilmedi.
- Canlı kontrolden sonra 10 finans tablosu, 5 aile tablosu ve Auth temel alanları dahil 16 veri kümesinin bütün satırları yayın öncesi kopyayla aynı. Ödeme kayıtları, tutarlar, tarihler ve durumlar değişmedi. Ayrıntılı kopyalar ve sonuç Git dışındaki özel alanda tutuldu.
- Ana ekran ve senaryo formunun görüntüleri incelendi, `docs/private.local/2026-11-03_harcanabilir-canli-ana-ekran.jpg` ve `2026-11-03_harcanabilir-canli-senaryo.jpg` olarak Git dışında saklandı. Geçici viewport kaldırıldı; ana planın 7 günlük ekranı açık bırakıldı. Fiziksel telefon ve bu turda eş hesabı kabulü yapılmadı.
- GitHub issue listesi boş; proje belgelerinde ilgili Trello kart bağlantısı bulunmadı. Teknik test/yayın kaydı bu belgede GitHub'a gönderiliyor; kişisel finans içeren canlı görseller kamuya açık depoya veya dış karta yüklenmiyor.
