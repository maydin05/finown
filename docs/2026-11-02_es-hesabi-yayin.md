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

GitHub/Netlify sürümü, mobil canlı kontrol ve kayıt karşılaştırması sonuçları doğrulamadan sonra eklenir. Gerçek yeni hesabın canlı giriş kabulü bu kontrolün kapsamı dışındadır; canlıda hesap oluşturulmayacaktır.
