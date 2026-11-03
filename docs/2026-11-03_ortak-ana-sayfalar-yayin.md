# Ortak ana sayfalar — üretim yayını

3 Kasım 2026. Kullanıcı GitHub ve Netlify yayınını, eş hesabıyla canlı mobil kontrolünü yetkilendirdi. Mevcut kayıtlar, tutarlar, tarihler ve ödeme durumları korunacak.

## Kapsam ve yayın öncesi kanıt

- Özet, Ödemeler, Gelir, Abonelikler ve Bankalar ortak üye tarafından aynı ana gezinmeyle salt okunur kullanılabilir. Kayıtlar mevcut paylaşım kapsamıyla sınırlıdır. Harcama talebi ve ortak geçmiş akışı korunur.
- Yeni GET ana görünüm uç noktası her okumada üyeliği doğrular; finans yazma uç noktası veya RLS yetkisi eklenmez. Paylaşılmayan kaynaklar, özel kullanıcı alanları ve ham özel finans parmak izi gönderilmez.
- Yeni migration veya üretim ortam ayarı gerekmiyor. Mevcut kapsam ve kullanıcı hesapları değiştirilmez.
- 77 birim, 15 gerçek yerel Supabase Auth/PostgreSQL sunucu ve 99 mobil test başarılı. 320/375/430 px ana gezinme/ay filtreleri, salt okunur detaylar, sıfır finans yazma isteği, kapsam ve üyelik kaybında eski verinin temizlenmesi kontrol edildi. Lint ve üretim build başarılı; önceki bundle/Browserslist uyarıları sürüyor.
- Yayın öncesi on finans, beş aile tablosu ve Auth hesap/şifre durumunun karşılaştırma kopyası Git dışındaki özel alanda alındı.
- Kullanıcının bildirdiği kart ödemeleri salt okunur DB ve canlı ay listeleriyle karşılaştırıldı. Kayıt kaybı saptanmadı; satırlarda banka yerine ürün adı gösterilmesi ayırt etmeyi zorlaştırıyor. Kişisel kayıt ayrıntıları özel yerel inceleme belgesinde tutuluyor; kayıt değişikliği yapılmadı.

## Canlı kabul

Git, Netlify ve gerçek oturum sonuçları yayın sonrası bu bölüme eklenecek. Yerel testler tek başına canlı kabul sayılmaz.
