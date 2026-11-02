# Eş hesabı oluşturma — üretim yayını

2 Kasım 2026. Kullanıcı GitHub/Netlify yayınını ve yalnız kendi hesabına tanımlı sunucu ayarlarını yetkilendirdi. Canlı kontrolde gerçek hesap ve davet oluşturulmayacak, e-posta gönderilmeyecek; mevcut kayıtlar korunacak.

## Değişiklik

- Bütçe sahibi, aile yönetimindeki “Eşim için hesap oluştur” formunda e-posta ve başlangıç şifresini belirler. Yeni hesap doğrulama e-postası gönderilmeden oluşturulur ve mevcut ortak bütçeye talep sahibi olarak bağlanır.
- Genel kayıt ve şifre sıfırlama kapalı kalır. Eski bir hesabın e-postasıyla yeni hesap açılmaz veya şifresi değiştirilmez. Finans kayıtlarının paylaşımı mevcut açık seçim kuralını izler.
- Henüz bütçe yokken de aynı form görüntülenebilir; açık bir “önce ortak bütçe oluştur” açıklaması bulunur ve kaydetme düğmesi kapalıdır. Bu sayede hesap veya bütçe oluşturmadan formun mobil görünümü kontrol edilebilir.
- Üretim yetkisi yalnız doğrulanmış tek hesap kimliğine tanımlanır. İzin listesi ve bütçe sahipliği sunucuda birlikte kontrol edilir; istemci alanıyla bu yetki kazanılamaz.
- Bir bütçe için tek yeni üye hesabı; eşzamanlı isteklerde satır kilidi, yarım kalan işlemde bütçeye özgü Auth kimliğiyle güvenli kurtarma. İlk şifre korunur; mevcut hesaplara güncelleme uygulanmaz.

## Sunucu ayarları

- Netlify Functions/production: `FINOWN_SUPABASE_AUTH_ADMIN_KEY` secret ve `FINOWN_FAMILY_ACCOUNT_CREATORS` tek hesap kimliği listesi. Yönetici anahtarı frontend/build değişkenine veya Git'e eklenmez.
- Mevcut Supabase yönetici anahtarı yalnız kullanıcı okuma isteğiyle doğrulandı; yeni anahtar veya kullanıcı oluşturulmadı. İzin verilen hesap, özel erişim kaydı ve mevcut canlı hesapla eşleştirildi. Kişisel kimlik bilgileri bu kamuya açık belgede yer almıyor.
- Yeni migration gerekmiyor. Önceki aile şeması ve mevcut Supabase Auth kullanılıyor. Genel Auth/doğrulama ayarları ve kişisel finans RLS kuralları bu sürümde değiştirilmez.

## Yayın öncesi doğrulama

- ESLint, üretim derlemesi, 70 birim testi, 13 gerçek GoTrue/PostgreSQL sunucu testi ve 9 mobil Auth/aile testi başarılı.
- Mobil genişlikler 320/375/430 px. Yeni hesapla ayrı oturum, yalnız talep sahibi yetkisi, boş paylaşım kapsamı ve bütçe olmadan kaydetmenin kapalı olması doğrulandı.
- Netlify offline derlemesi ve `family.mjs` paketlemesi başarılı. Önceki büyük paket/Browserslist uyarıları devam ediyor.
- Yayından önce on finans tablosu, beş aile tablosu ve Auth hesap/şifre durumunun karşılaştırma kopyası Git dışındaki `docs/private.local/` altında alındı.

## Yayın sonrası doğrulama

- Özellik commit’i `366a1c60d98cc8c95ba148850334e97395d4b1b3`, GitHub `main` üzerinde doğrulandı. Netlify `6ae82f60a42c1d4119fbf766` aynı SHA ile `ready`; yayın zamanı 2 Kasım 2026 09:36 TRT.
- İki ortam değişkeni geri okundu: yalnız Functions/production, admin anahtarı secret, izin listesinde tam olarak doğrulanan tek hesap kimliği var. Kişisel kimlik/secret değerlerinin public kaynak veya üretim frontend paketinde bulunmadığı ayrıca kontrol edildi.
- Canlı `/family-api/health` 200 `ready=true`; oturumsuz `/me` 401. Mevcut sahibin canlı oturumunda hesap oluşturma formunun görünmesi sunucunun yetki sonucuyla doğrulandı.
- Canlı form 320/375/430 × 667 px boyutlarında kontrol edildi: yatay taşma yok, e-posta/şifre alanları boş, şifre varsayılan maskeli ve en az 10 karakter. Ortak bütçe henüz bulunmadığından kaydetme düğmesi kapalı; açıklama ve alanlar görünür. 375 × 812 px görünümün ekran görüntüsü özel yerel kayda alındı. Fiziksel cihaz kabulü yapılmadı.
- Canlıda hesap oluşturma, bütçe oluşturma, davet oluşturma/kabul veya ödeme kaydı yazma isteği gönderilmedi; e-posta gönderilmedi. Mevcut finans kayıtları, tarihleri ve ödeme durumları korundu.
- Yayın sonrası tam satır karşılaştırması: on finans tablosu, beş aile tablosu ve Auth hesap/şifre durumu önceki kopyayla aynı. Yeni kullanıcı, ortak bütçe veya davet oluşmadı.
- Gerçek yeni hesabın canlı giriş/üyelik kabulü bu kontrolün kapsamı dışındadır; bu akış ayrı yerel GoTrue/PostgreSQL testlerinde doğrulandı. Canlı yetkisiz ikinci hesapla deneme yapılmadı; sunucudaki tek hesap izin listesi geri okundu ve diğer aktörlerin reddi yerel testlerle doğrulandı.
