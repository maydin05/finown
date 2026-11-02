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

- Ana özellik commit’i `ff02a0623973b5d048b607f8e95c8feadaabc983`, GitHub `main` üzerinde doğrulandı. Netlify `6ae82152d64b30ae9051adfc` yayını aynı commit ile `ready`; yayın saati 2 Kasım 2026 08:36 TRT.
- Canlı `/family-api/health` 200 ve `ready=true`; oturumsuz `/me` ve `/budgets` 401. Canlı giriş ekranının 320/375/430 px testleri 6/6 başarılı.
- Mevcut canlı hesap oturumuyla aile ekranı açıldı; ek giriş gerekmedi. Henüz bütçe bulunmayan başlangıç ekranı ve alt gezinme kontrol edildi. 320/375/430 px ölçümlerde yatay taşma yok.
- Başlangıç ekranına açık başlık ve yönlendirme eklendi; boş bütçe seçicisi gizlendi ve yükleme metni üretime uyarlandı. Bu son düzenlemeden sonra ESLint, üretim derlemesi ve iki hesaplı altı yerel mobil test tekrar başarılı.
- Yayın sonrası on eski finans tablosunun tüm satırları başlangıç yedeğiyle birebir aynı. Aile bütçesi ve davet tabloları boş; gerçek bütçe/davet oluşturulmadı, mevcut kayıtlara yazılmadı.
- Yerel iki hesap testleri canlı iki gerçek hesap kabulü sayılmaz. Gerçek davet gönderilmeyeceği için ikinci hesabın katılımı ve ortak bütçedeki yazma işlemleri canlıda denenmedi. Mobil kontrol tarayıcıdaki viewport boyutlarıyla yapıldı; fiziksel cihaz kabulü değildir.

Referans: [Netlify Functions ortam değişkenleri](https://docs.netlify.com/build/functions/environment-variables/), [Supabase SSL doğrulaması](https://supabase.com/docs/guides/platform/ssl-enforcement).
