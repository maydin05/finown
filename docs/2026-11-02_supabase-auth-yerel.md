# E-posta/şifre ile gerçek Supabase Auth — yerel hazırlık

> Üretim güncellemesi: Bu belge yerel aşamanın tarihsel kaydıdır. Güncel yayın için [üretim kaydına](2026-11-02_aile-butcesi-yayin.md) bak.

2 Kasım 2026. Kullanıcı gerçek Supabase Auth entegrasyonunun yerelde hazırlanıp test edilmesini istedi. Giriş sade kalacak: **e-posta, şifre, giriş**. Kayıt ve şifre sıfırlama yok; gerçek davet, üretim verisi/ayarları, GitHub ve yayın kapsam dışı.

## Değişiklik

- Ortak `Login.jsx` artık yalnız `signInWithPassword` çağırır. Kayıt akışı ve bağlantısı kaldırıldı; sıfırlama/OTP/OAuth eklenmedi. Şifreyi göster/gizle ve Türkçe hata mesajı var. Aynı isteğin çift gönderimi engellenir.
- Ana uygulamadaki aile rotası mevcut `supabase.auth` nesnesini aktarır; ek bir özel giriş hesabı kullanılmaz. Yerel bağımsız test ekranı ise aynı SDK'yi yerel Supabase Auth'a bağlar. Üretim Finown hesabıyla kabul testi yapılmadı.
- Önceki özel scrypt/çerez tabanlı test girişi ve kayıt endpointleri kaldırıldı. Aile istekleri SDK'nin güncel access tokenını Bearer başlığında taşır. Sunucu sabit olarak yapılandırılmış Supabase Auth'a `getUser(token)` çağırarak kimliği doğrular; istemciden kullanıcı kimliği/rol alınmaz. Üyelik/onay yetkisi ayrıca DB'de kontrol edilir.
- Yerel test ortamında **gerçek Supabase Auth (GoTrue) v2.195.0** ve PostgreSQL 18 Docker'da çalışır. Auth/finans verileri üretimden bağımsız, geçici veritabanındadır. `.env` veya gerçek Supabase CLI profili değiştirilmez.
- Test hesapları kurulum sırasında yalnız yerel Auth admin API'siyle önceden hazırlanır; kullanıcının kayıt olma ekranı yoktur. Auth'ta signup kapalıdır. Uygulamanın auth gateway'i yalnız password/refresh token, kullanıcı doğrulama ve çıkışa izin verir; signup/recover/invite/admin/şifre değiştirme yolları kapalıdır. SMTP yoktur, gerçek kişiye e-posta gönderilmez.
- Yerel admin/JWT secret yalnız sunucu/test sürecindedir; frontend yalnız yerel anon anahtarını alır. Üretim/gerçek proje tokenı yanlış yerel sağlayıcıya sessizce uyarlanmaz; doğrulanamayan token reddedilir.
- Aynı sahibin tekrar bütçe oluşturması mevcut bütçeyi döndürür. Tekil owner kısıtı, aynı kişisel ödeme kaynaklarının birden fazla ayrı aile rezervinde sayılmasını önler.

## Test ve izolasyon

- `npm run test:family-server`: gerçek GoTrue ile yedi entegrasyon/DB senaryosu. Doğru/yanlış parola, bağımsız kullanıcılar, bozuk/süresi dolmuş JWT, SDK refresh ve çıkış sonrası refresh reddi; kayıt/sıfırlama uçlarının kapalı olması; davet hedefi/süre/tekrar/geri çekme; yetki/başka aile; kayıt kapsamı; atomik sürüm/tekrar koruması; RLS ve değiştirilemez geçmiş; üyelik kaldırma.
- On kişisel finans tablosunun sentetik tam satırları test başı/sonu aynıdır. İlgili finansal değişiklik testi yalnız kendi sentetik maaşını değiştirip geri alır.
- İki hesaplı mobil test kendi **8786** API/GoTrue/DB ortamını kurar. Kullanıcının açık **8784** deneme ortamını yeniden kullanmaz veya sıfırlamaz. Böylece tekrar koşularında eski rezervler/hesaplar test sonucunu etkilemez.
- Playwright'ta SIGTERM ile kontrollü kapanma ve 15 saniye süre tanınır; Docker test konteynerleri/ağı kaldırılır. Normal Vite regresyonlarıyla aynı 5173 portunu kullandığından iki mobil test komutu sırayla çalıştırılır.
- Girişin hata, başarı, sayfa yenileme, token yenileme ve çıkış akışı 320/375/430 × 667 px'te test edilir; giriş düğmesi ilk ekrandadır. Aile talep/onay akışı iki bağımsız tarayıcı oturumuyla ayrıca yürür. Bunlar fiziksel telefon/üretim kabulü değildir.

## Çalıştırma

```sh
npm run dev:family-server
# Vite, açık 5175 yerel sunucusundan veya ayrı terminalden çalışır.
npm run test:family-server
npm run test:family-server:mobile
npm run test:mobile
npm test
npm run lint
npm run build
```

Deneme: `http://127.0.0.1:5175/tests/family-server-preview.html`.

Hazır yerel hesaplar `owner@family.test` / `member@family.test`; yalnız yerel test giriş bilgileri Git dışındaki `docs/private.local/yerel-auth-test-girisi.md` dosyasındadır. Canlı Finown hesabının şifresini bu izole test ortamında kullanma. Ortam kapanınca test DB silinir; önceki kişisel kayıtlar veya IndexedDB taslakları taşınmaz/değiştirilmez.

## Sınırlar

Bu gerçek Supabase Auth yazılımı/SDK'siyle yapılmış yerel entegrasyon kanıtıdır; `zowlpzmvwiszwhtvsagj` üretim projesinin ayarlarının değiştiği veya canlı aile modülünün çalıştığı anlamına gelmez. Üretim Auth ayarlarına, kullanıcılarına, oturumlarına, finans kayıtlarına veya şemasına bu işte yazma yapılmadı. Yayına çıkış ayrıca gerçek hedef URL/DB rolü, üyelik migration'ı ve staging/canlı kabul gerektirir.

Kaynaklar: [Supabase getUser: sunucuda kimlik doğrulama](https://supabase.com/docs/reference/javascript/auth-getuser), [Auth yerel yapılandırması](https://supabase.com/docs/guides/self-hosting/auth/config), [Supabase Auth örnek ayarları](https://github.com/supabase/auth/blob/master/example.env), [Playwright kontrollü kapanma](https://playwright.dev/docs/test-webserver).

## Son doğrulama

- Gerçek GoTrue ile sunucu/PostgreSQL testleri **7/7** geçti; bozuk/süresi dolmuş token, kayıt kapısı, scope/rol, tek bütçe, finans korunması dahil.
- Ayrı test ortamıyla giriş/aile mobil testleri **6/6** geçti (320/375/430 px); giriş düğmesi 667 px yüksekliğin içinde. Test API'si/konteynerleri/ağı kontrollü kapanışla kaldırıldı, yalnız manuel denemenin GoTrue+PostgreSQL çifti kaldı.
- Mevcut ekranlar ve IndexedDB aile denemesinin mobil regresyonları **84/84** geçti. Önceki eşzamanlı komutun 5173 port çakışması test çalıştırma hatasıydı; seri son koşu başarılıdır.
- `npm test` **70/70**, ESLint ve üretim derlemesi başarılı; diff kontrolü temiz. Önceden mevcut büyük paket/Browserslist uyarıları sürüyor.
- Tarayıcıda hazır owner test hesabıyla gerçek Supabase girişi ve çıkışı doğrulandı. Finansal kayıt oluşturulmadı, ortak bütçe seçilmedi/oluşturulmadı. Sekme boş giriş ekranında bırakıldı; 375 × 667 görüntü `docs/private.local/2026-11-02_supabase-giris-375.png`, viewport sıfırlandı.
- HEAD `93730c9`; commit/push/deploy yok. Üretim proje ayarı/verisi ve gerçek kullanıcı hesabı değiştirilmedi; gerçek davet/e-posta gönderilmedi.
