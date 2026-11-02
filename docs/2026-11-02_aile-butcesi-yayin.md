# Aile bütçesi ve sade Supabase Auth — üretim yayını

2 Kasım 2026. Kullanıcı GitHub/Netlify yayınını, gereken veritabanı güncellemesini ve mevcut kayıtlar korunarak canlı mobil kontrolü yetkilendirdi. Gerçek davet gönderilmeyecek.

## Üretime hazırlanan davranış

- Hesap menüsünden `/family`: ortak bütçe, açık kayıt seçimi, talep/onay/öneri, rezerv/gerçek harcama, mutabakat, yorum ve bildirimler. Yerel deneme görünümü ve rol değiştiricisi üretim akışına taşınmadı; üretim ekranı ayrı bileşenden yüklenir.
- Tek e-posta/şifre girişi. Aile ekranı ana uygulamanın mevcut Supabase oturumunu kullanır; ayrı test hesabı istemez. Kayıt olma ve şifre sıfırlama arayüzü yoktur.
- Üretim Netlify Function `/family-api/*`: kimlik Supabase `getUser(token)` ile doğrulanır; rol/üyelik, kaynak kapsamı ve bütçe değerlendirmesi sunucudadır. Localhost/Docker/test kimliği üretim işleyicisinden kullanılmaz.
- İşlemler aynı PG bağlantısında transaction, satır kilidi, sürüm ve tekrar kontrolüyle kaydedilir. Tek bütçe sahibi için tekrar oluşturma mevcut bütçeyi döndürür. Diğer aileye erişim ve talep sahibinin onay yetkisi reddedilir.
- Davet yalnız hedef hesaba bağlı, süreli ve tek kullanımlık bağlantıdır; e-posta gönderme işlevi yoktur. Bu yayın kontrolünde gerçek davet oluşturulmayacak/gönderilmeyecek.

## Veritabanı ve erişim

- `202611010004_family_budget.sql`, Supabase Management API ile açık yazma yetkisi kapsamında uygulandı. Çalıştırılan dosyanın SHA-256 değeri `13f53524fb1edb1027bc5eb3aa3cb62ad53c19cc5e7a07d9072be1305c0225c7`.
- Yeni aile tabloları, üyelik RLS'si, değiştirilemez olay geçmişi ve yalnız sunucuya açık kapsamlı okuma işlevi eklendi. Eski kişisel finans tablolarının RLS kuralları genişletilmedi.
- Ayrı LOGIN/NOINHERIT/NOBYPASSRLS sunucu hesabı yalnız `family_server` rolüne geçebilir. Finans tablolarını doğrudan okuyamadığı ve transaction içindeki rol geçişi gerçek bağlantıda doğrulandı.
- Pooler hedefi mevcut Finown CLI bağlantı metadatasından doğrulandı. TLS sertifika doğrulaması kapatılmadı; Supabase'in kamuya açık kök CA sertifikası eklendi ve `tls_authorized=true` doğrulandı.
- Kalıcı HMAC anahtarı, DB bağlantısı ve Auth anon anahtarı Netlify'da yalnız Functions/production kapsamına yazıldı. DB/HMAC sırları secret olarak saklanır; frontend `VITE_*` alanına eklenmez, Git'e girmez.
- Supabase Auth'ta `disable_signup=true`; `site_url=https://finown.netlify.app`. Mevcut kullanıcıların şifresi/hesabı, SMTP veya oturum ayarları değiştirilmedi.
- Önce/sonra on finans tablosunun tüm satırları aynı. Tam yedekler ve ayrıntılı karşılaştırmalar Git dışındaki `docs/private.local/` içinde.
- Kısıtlı sunucu rolüyle gerçek şemada bir aile okuma denemesi transaction içinde yapıldı ve ROLLBACK ile kapatıldı; varsayılan paylaşım boş, sahibin kayıt seçenekleri ulaşılabilir. Finans kaydına yazılmadı.

## Yerel doğrulama

- 70 birim/API, 8 gerçek GoTrue/PostgreSQL sunucu testi, 84 mevcut/yerel aile mobil ve 6 iki hesaplı Auth/aile mobil testi başarılı. Üretim işleyicisinin kısıtlı DB hesabı ve iki ayrı soğuk başlangıçta aynı HMAC temeli de test edildi.
- 320/375/430 px; sade giriş, yanlış şifre, refresh/çıkış, iki oturum, davet kabulü, talep/onay/gerçek harcama ve erişim kaldırma yerelde doğrulandı.
- ESLint, Vite üretim derlemesi, Netlify offline derlemesi ve `family.mjs` function paketlemesi başarılı. Önceden mevcut büyük JS paketi/Browserslist uyarıları sürüyor.

## Yayın ve canlı kabul

GitHub SHA, Netlify yayın kimliği ve canlı mobil kontrol sonucu doğrulamadan sonra bu kayda eklenir. Yerel testler canlı iki gerçek hesap kabulü sayılmaz; gerçek davet gönderilmeyeceği için ikinci hesabın katılımı canlıda denenmez.

Referans: [Netlify Functions ortam değişkenleri](https://docs.netlify.com/build/functions/environment-variables/), [Supabase SSL doğrulaması](https://supabase.com/docs/guides/platform/ssl-enforcement).
