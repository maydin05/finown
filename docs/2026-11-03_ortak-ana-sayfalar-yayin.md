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

- Özellik SHA’sı `652956aa636bc632d609d9a37ee2f031c2039405`, GitHub `main` ucunda readback ile doğrulandı.
- Netlify `6ae972f16b5e864abbb1335a`, aynı SHA ile `ready`; yayın zamanı 3 Kasım 2026 08:37 TRT. Canlı health 200/ready, oturumsuz ana görünüm isteği 401.
- Yeni sürüm mevcut bütçe sahibi oturumunda açıldı. Ödemeler sayfasında 320/375/430 px ölçülerde yatay taşma yok. Bildirilen kartın aylık kaydı ve salt okunur inceleme amacıyla açılan ayrıntısı mevcut DB tutar/tarihiyle eşleşti. Kapat dışında kayıt işlemi yapılmadı; ekran kanıtı özel yerel alanda tutuldu.
- On finans, beş aile tablosu ve Auth hesap/şifre durumunun tam satır karşılaştırması aynı kaldı. Mevcut tutarlar, tarihler, durumlar ve paylaşım kapsamı korunuyor.
- Eş hesabıyla gerçek canlı kabul **bekliyor**: tarayıcı oturumu bütçe sahibine ait. Kullanıcıdan kendi tarayıcısında eş hesabına geçmesi istendi; parola istenmedi ve oturum taklidi yapılmadı. İki hesaplı ana sayfa ve yetkilendirme kabulü yerel testlerde başarılı, gerçek eş oturumu kontrolü bununla eşit sayılmadı.
- Çalışma sırasında gerçek hesap/davet oluşturulmadı ve e-posta gönderilmedi. Şema/ortam ayarı değişmedi.
