# Aile bütçesi — iki ayrı hesap ve sunucu kontrolü (yerel)

> Üretim güncellemesi: Bu belge yerel aşamanın tarihsel kaydıdır. Güncel yayın için [üretim kaydına](2026-11-02_aile-butcesi-yayin.md) bak.

> Güncelleme — 2 Kasım 2026: Aşağıdaki özel yerel kimlik adaptörü/scrypt/çerez ve kayıt ekranı bilgileri ilk teslimi anlatır. Bunlar gerçek Supabase Auth ve yalnız e-posta/şifre girişiyle değiştirildi; [güncel kayıt](2026-11-02_supabase-auth-yerel.md).

1 Kasım 2026. Kullanıcı iki ayrı hesapla ortak bütçe, davet ve sunucu yetkilendirmesinin **yerelde** hazırlanıp test edilmesini istedi. Gerçek davet, üretim veri/şema değişikliği, GitHub ve yayın kapsam dışıdır.

## Çalışan kapsam

- Rol düğmesi yerine ayrı parolalı iki yerel hesap ve bağımsız HTTP oturumları. İkinci üye kendi oturumunda aynı bütçeyi okur; ortak kayıtlar ikinci bir bütçeye kopyalanmaz.
- Bütçe sahibi açıkça kaynak/ödeme/kart/bakiye seçer. Başlangıçta kapsam boştur. Seçilmiş kaynağın dönemlik alındı/ödeme bilgileri birlikte kullanılır. Seçilmemiş kayıtların başlıkları ve tutarları ikinci kullanıcıya verilmez.
- Hedef hesaba bağlı, 24 saatlik, tek kullanımlık yerel davet. Yalnız hash'i saklanır; düz kod yalnız oluşturulduğunda sahibine döner. Yanlış hesap, süresi dolmuş, geri çekilmiş ve kullanılmış davetler reddedilir. Yeni davet önceki bekleyen daveti geçersiz kılar. En fazla bir sahibi ve bir talep sahibi vardır.
- Bütçe sahibi daveti veya ikinci üyenin erişimini kaldırabilir. Mevcut üye oturumu açık olsa da sonraki sunucu isteği reddedilir; geçmiş/rezerv/gerçek harcama silinmez.
- Talep/teklif/onay/satın alma/inceleme/yorum/bildirim akışları önceki React bileşenleriyle çalışır. Sunuculu modda kişi değiştiricisi bulunmaz. Hesap/davet ayarları ana içeriği ötelememek için kapanabilir alandadır.

## Sunucu sınırı

`server/family/service.mjs` gerçek aktörü oturumdan alır. İstemcinin gönderdiği rol veya hazır bütçe sonucu kullanılmaz. Yetki, seçili kayıtlar, güncel kullanılabilir bakiye, kayıtlı gecikenler, 90 günlük sıra, güvenlik payı, kart limiti ve rezervler sunucuda yeniden değerlendirilir.

Her mutasyon **aynı PostgreSQL bağlantısında** BEGIN/COMMIT ile çalışır. Bütçe satırı kilitlenir, finansal kaynaklar okuma boyunca SHARE kilidiyle sabitlenir, bütçe sürümü ve güncel finansal sürüm doğrulanır. Sonra rezerv/gerçek harcama, bildirim, işlem kimliği ve geçmiş atomik kaydedilir. Farklı eşzamanlı eski sürüm reddedilir; aynı işlem kimliği+aynı içerik tekrarında yeni olay oluşmaz. Farklı kişi/içerikle aynı işlem kimliği reddedilir. İstemcide eski ağ yanıtı yeni sürümü ezmez.

Ham özel finans özeti/bakiye temeli ikinci kullanıcıya çıkmaz. Bunların dışa dönük değişiklik işaretleri sunucunun anahtarıyla HMAC-SHA256 üretilir; paylaşılmamış bir tutarı ham hash üzerinden deneme riski azaltılır. Bu yerel ortamda anahtar süreç ömrüyle sınırlıdır; kalıcı sunucuya geçişte yönetilen, kalıcı bir secret gerekir.

SQL taslağı `supabase/migrations/202611010004_family_budget.sql`:

- Aile, üyelik, davet, olay ve işlem tabloları; iki rolün tekilliği ve üyelik/state tutarlılığı.
- İstemciye doğrudan aile yazma yetkisi verilmez. Üyelik bazında RLS, aileler arası okuma kısıtı; tam state JSON ve özel snapshot işlevi istemciye kapalıdır.
- Eski kişisel finans tablolarının RLS kuralları genişletilmez. Özel finans namespace'ini çözen işlev yalnız güvenilir `family_server` rolüne açıktır ve çağıran üyeliğini tekrar kontrol eder.
- Olay geçmişine sunucu yalnız ekleme yapar; UPDATE/DELETE hem yetki hem trigger ile engellenir. Karar anındaki koşullar korunur.

Bu SQL dosyası üretime uygulanmadı; yalnız bu işin oluşturduğu geçici Docker PostgreSQL ortamlarında çalıştırıldı.

## Yerel kimlik adaptörü ve ortam

Bu sürüm **Supabase canlı Auth veya gerçek e-posta doğrulaması değildir**. `http.mjs` yalnız `.test` adresleri için yerel kimlik adaptörü sağlar; yerel test adresleri doğrulanmış kabul edilir. Parolalar rastgele salt+scrypt ile, oturum tokenları hash olarak saklanır. Oturum çerezi HttpOnly/SameSite=Strict ve 8 saatlidir; çıkış mevcut oturumu sunucuda iptal eder. POST istekleri özel başlık, JSON ve yerel Origin kontrolü ister. Giriş/hesap oluşturma için deneme sınırı vardır.

- Dinleme yalnız `127.0.0.1:8784`; PostgreSQL portu da yalnız 127.0.0.1'e rastgele bağlanır.
- `.env`, mevcut Supabase CLI profili, üretim DB URL'si veya gerçek kullanıcı tokenı okunmaz.
- SMTP/e-posta sağlayıcısı yoktur; gerçek davet gönderilemez. Yeni yerel hesapta yalnız sentetik finans verisi hazırlanır.
- Veritabanı geçicidir: yerel sunucu kapatılınca Docker konteyneri ve test hesapları gider. Önceki IndexedDB deneme kayıtları ayrı tutulur ve bu sunucuya taşınmaz.
- Aile arayüzü hâlâ yalnız geliştirmede bulunur; üretim paketine veya canlı rotalara açılmadı.

## Çalıştırma ve kontrol

Repo kökünden, Docker açıkken:

```sh
npm run dev:family-server
```

Başka terminalde Vite çalışır. Bu çalışmada mevcut `5175` sunucusu korunmuştur:

- `http://127.0.0.1:5175/tests/family-server-preview.html`
- Ana uygulamanın yerel aile ekranında “Sunuculu iki hesap testi” seçeneği.

İki hesabı elle denemek için farklı tarayıcı profilleri/gizli pencere gerekir; aynı tarayıcının iki sekmesi aynı çerezi paylaşır. Yalnız `.test` adresi ve gerçek hesaplardan farklı test parolası kullanılır. İkinci kullanıcıya varsayılan finans düzenleme/onay yetkisi verilmez.

```sh
npm run test:family-server
npm run test:family-server:mobile
npm test
npm run test:mobile
npm run lint
npm run build
```

Sunucu testleri kendi geçici Docker DB'sini kurar ve bitince kapatır. İki hesaplı mobil test mevcut yerel API'yi kullanabilir; yoksa ayrı Playwright yapılandırması onu başlatır. Gerçek servis çağrısı veya gerçek e-posta yoktur.

## Doğrulamalar

- 7 sunucu/PostgreSQL senaryosu: bağımsız oturum, yanlış parola/oturum yokluğu, çıkış iptali, çerez özellikleri ve POST koruması; davet hedefi/süre/tek kullanım/geri çekme ve eşzamanlı kabul; açık kayıt kapsamı; yabancı aile; rol/aktör/çarpıtılmış bütçe reddi; satın alma/inceleme; eşzamanlı onay/sürüm ve tekrar koruması; eski finansal temel; RLS/doğrudan yazma/özel snapshot yasağı; değiştirilemez geçmiş; üyelik kaldırma.
- İki bağımsız tarayıcı oturumuyla 320/375/430 px'te davet → ortak plan → talep → onay → değişen gerçek harcama → erişim kaldırma. Tarayıcı JS hataları ve yatay taşma kontrol edilir.
- Tüm on kişisel finans tablosunun tam sentetik satırları test başı/sonu karşılaştırılır. Kayıtlar, tutarlar, tarihler ve durumlar aynıdır. Finansal veri değişimiyle ilgili test yalnız sentetik maaşı geçici değiştirip geri yükler.
- Ek incelemede davet linkinin zaten açık sayfada yalnız fragment değiştirerek açılması düzeltildi. Ham özel finans hash'i HMAC ile kapatıldı. Kartın paylaşımı kaldırıldığında “nakit” diye gösterilmez; gerçek harcama korunur, belirsiz ana kart yeni onayı durdurur.
- Son koşu sayıları ve kanıt sınırları aşağıda belirtilir. Fiziksel cihaz, gerçek Supabase hesabı ve canlı kabul kapsam dışıdır.

## Üretime geçmeden önce

Yerel kimlik adaptörünün yerine gerçek Supabase Auth kimliği/JWT doğrulaması ve doğrulanmış hedef e-posta konmalı. SMTP sağlayıcısı/davet teslimatı, HTTPS/üretim çerezleri, kalıcı secret ve sunucu DB rolü yapılandırılmalı; gerçek şemada staging migration ve yetki testleri yapılmalı. SHARE tablo kilitleri küçük yerel doğrulamayı güvenli tutar; yoğun kullanım için tüm yazma yollarıyla uyumlu kullanıcı bazlı finans sürümü/kilit planı ayrıca değerlendirilmelidir. Bunlar yapılmış veya canlıda kabul edilmiş sayılmaz. Bu yerel çalışma gerçek kimliğe erişim açmaz.

## Son kontrol kaydı

- `npm run test:family-server`: 7/7 başarılı; son sürümde HMAC ile özel finans temeli gizleme kontrolü dahil.
- `npm run test:family-server:mobile`: 3/3 başarılı (320/375/430 px, iki bağımsız hesap/çerez bağlamı).
- `npm test`: 70/70 başarılı; aile domain testleri 20.
- `npm run test:mobile`: önceki ekranlar ve yerel aile modülü dahil 84/84 başarılı. İki hesaplı üç kontrol ayrı komutta çalıştırıldı.
- ESLint, üretim derlemesi ve diff kontrolü başarılı. Üretim çıktısında `family-api`, sunuculu test metni veya yerel aile deposu yok. Mevcut büyük paket/Browserslist uyarıları sürüyor.
- 375 × 667 görsel kontrolde kayıt kapsamı varsayılan boş, bakiye doğrulanmadı; sentetik kayıtlar açıkça seçildikten sonra sunucudan plan geldi. Taşma yok. Kanıtlar Git dışındaki `docs/private.local/aile-sunuculu-375.png` ve `aile-sunuculu-giris-375.png` içinde. Viewport sıfırlandı; güncel oturumsuz yerel giriş sekmesi açık bırakıldı.
- Çalışan yerel API 127.0.0.1:8784'te, yalnız bu işe ait tek Docker DB konteyneriyle bırakıldı. Önceki deneme konteynerleri kapatılıp durumları doğrulandı. Yerel ortamın yeniden başlatılması test hesaplarını sıfırlar.
- Önceki kişisel finans API/context/domain dosyalarına değişiklik yok; HEAD `93730c9` olarak kaldı. Commit/push/deploy, gerçek davet ve üretim şema/veri işlemi yapılmadı.

Uygulama referansları: [node-postgres — transactions](https://node-postgres.com/features/transactions), [parameterized queries](https://node-postgres.com/features/queries). Bunlar uygulama yönteminin kaynağıdır; test sonucu kanıtı yukarıdaki yerel koşulardır.
