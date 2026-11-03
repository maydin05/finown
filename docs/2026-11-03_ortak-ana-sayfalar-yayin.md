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
- İlk kontrolde eş hesabıyla gerçek canlı kabul bekliyordu (bu not aşağıdaki kabul ile güncellendi): tarayıcı oturumu bütçe sahibine ait. Kullanıcıdan kendi tarayıcısında eş hesabına geçmesi istendi; parola istenmedi ve oturum taklidi yapılmadı. İki hesaplı ana sayfa ve yetkilendirme kabulü yerel testlerde başarılı, gerçek eş oturumu kontrolü bununla eşit sayılmadı.
- Çalışma sırasında gerçek hesap/davet oluşturulmadı ve e-posta gönderilmedi. Şema/ortam ayarı değişmedi.

## Gerçek eş hesabıyla canlı kabul — tamamlandı

- Kullanıcı eş hesabıyla kendisi giriş yaptı. Canlı aile ekranı `Talep sahibi · Ayrı hesap oturumu` rolünü doğruladı; ana sayfalarda ortak/salt okunur etiketi ve aynı beşli gezinme görünüyor.
- Özet, Ödemeler, Gelir, Abonelikler ve Bankalar 320/375/430 px ölçülerinde kontrol edildi; 15 sayfa/ölçü karşılaştırmasının tamamında yatay taşma yok.
- Ödeme, gelir ve abonelik detaylarında finans yazma kontrolleri yok. Banka detayında ekleme/düzenleme/silme kontrolleri yok. Ortak talep oluşturma erişimi korunuyor; talep oluşturulmadı.
- Bildirilen kartın Kasım, Aralık ve Ocak kayıtları aynı tarih/tutarla eş hesabının listesinde de açıldı. Veri veya paylaşım değişikliği yapılmadı.
- Gerçek eş kabulü sonrası tüm finans/aile/Auth kayıtlarının tam karşılaştırması yayın öncesiyle aynı. Mobil özet ve ödeme ayrıntısı görüntüleri incelenerek özel yerel alana kaydedildi. Geçici viewport sıfırlandı; eş oturumu açık bırakıldı.
- Kabul edilen kod SHA’sı `652956aa636bc632d609d9a37ee2f031c2039405`; yayın belgesi SHA’sı `fec6b38c7791006a9ac0a8d7390568394c2af27c`, Netlify `6ae9736d792d94d4ef9de8c8` üzerinde `ready` olarak doğrulandı.
