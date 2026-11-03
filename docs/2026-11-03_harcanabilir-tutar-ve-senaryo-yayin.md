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
