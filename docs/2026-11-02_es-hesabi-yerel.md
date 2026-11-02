# Bütçe sahibinden eş hesabı oluşturma — yerel uygulama

> Yerel uygulama kaydıdır. Güncel üretim durumu: [yayın kaydı](2026-11-02_es-hesabi-yayin.md).

2 Kasım 2026. İstek: bütçe sahibi e-posta ve başlangıç şifresini belirlesin; eş doğrulama e-postası almadan giriş yapsın. Genel kayıt ve şifre sıfırlama kapalı kalsın.

## Akış

1. Ortak bütçe oluşturulur, paylaşılacak kayıtlar seçilir.
2. Hesap ve bütçe yönetimi → Üye ve davet yönetimi → Eşim için hesap oluştur.
3. E-posta + en az 10 karakterlik başlangıç şifresi girilir. Hesabı oluştur ve bütçeye ekle, yeni Supabase Auth hesabını oluşturur ve talep sahibi olarak bağlar. Ayrı davet/kabul yoktur.
4. Eş normal giriş ekranında bu bilgilerle girer ve ortak bütçeyi seçer. Yalnız seçilen kapsamı ve ortak talep geçmişini görür.

## Sınırlar

- Admin `createUser(email_confirm:true)` yalnız sunucuda çalışır. Bu yöntem doğrulama e-postası göndermez; genel doğrulama ayarı kapatılmaz. Kaynak: [Supabase createUser](https://supabase.com/docs/reference/javascript/auth-admin-createuser).
- Hem doğrulanmış oturumun sunucudaki izin listesinde bulunması hem hedef bütçenin sahibi olması gerekir. Bütçe oluşturabilmek hesap oluşturma yetkisi sağlamaz.
- Üretimde varsayılan kapalıdır. Etkinleştirmek için yalnız Functions/production kapsamında `FINOWN_SUPABASE_AUTH_ADMIN_KEY` secret ve `FINOWN_FAMILY_ACCOUNT_CREATORS` kullanıcı kimliği izin listesi gerekir. Hiçbiri `VITE_*` alanına veya Git'e yazılmaz. Yerel anahtarlar atılabilir GoTrue ortamına aittir.
- Tek bütçe için yalnız bir yeni üye hesabı oluşturulabilir. Üye kaldırıldıktan sonra mevcut hesabın tekrar katılımı davet bağlantısıyla yapılır; yeni hesap açılmaz veya şifre sıfırlanmaz.
- Başka bir hesabın e-postası girilirse işlem reddedilir; mevcut hesap/şifre değiştirilmez.
- Sabit bütçeye özgü Auth kimliği ve sunucunun yazdığı `app_metadata`, Auth oluşturma sonrası DB kesintisinde aynı hesabı güvenle bağlamayı sağlar. İlk şifre korunur; tekrar yazılan yeni şifre uygulanmaz ve kullanıcıya açıklanır. Yeni hesap veya üyelik çoğalmaz.
- Bütçe satır kilidi aynı anda iki oluşturmayı önler. Üyelik, geçmiş ve bekleyen davetleri geri çekme tek DB transaction içindedir. Auth + PostgreSQL tek atomik transaction değildir; belirsiz sonuçta otomatik yeniden gönderim yoktur. Kurtarma yalnız aynı bütçe/sahip/e-posta ile bu akışta oluşturulmuş hesabı kabul eder.
- Şifre yalnız Auth isteğine gider; finans tablolarına, olay geçmişine, yanıta veya uygulama depolamasına yazılmaz. Form sonuçlandığında alan temizlenir. E-posta/şifre için otomatik mesaj gönderilmez.
- Eski finans tablolarına veya ödeme durumlarına yazılmaz. Yeni migration gerekmiyor; mevcut aile üyeliği ve olay şeması kullanılır.

## Doğrulama ve yayın kapsamı

- Gerçek yerel GoTrue/PostgreSQL üzerinde 13 sunucu testi başarılı: sahip/izin listesi, oturumsuz ve yabancı bütçe reddi, mevcut hesabı koruma, eşzamanlı oluşturma, doğrulama e-postası gönderilmeden giriş, paylaşımın boş başlangıcı, erişim kaldırma, yarım kalan hesabı kurtarma ve üretim handler'ının varsayılan kapalı olması.
- Tüm on kişisel finans tablosu test öncesi/sonrası birebir aynı.
- 70 birim testi, ESLint ve üretim derlemesi başarılı. Büyük JS paketi/Browserslist uyarıları önceki durumdan devam ediyor.
- Mobil: mevcut altı Auth/aile testi başarılı. Yeni hesap oluşturma → belirlenen şifreyle ayrı oturum → ortak bütçe seçimi → yalnız talep sahibi yetkisi akışı 320/375/430 px testlerinin üçünde de başarılı. Formda ve ortak planda yatay taşma yok; başarılı işlemden sonra şifre alanı kaldırılıyor. Bütçe seçicisine açık erişilebilir ad eklendi.
- Bu kayıt ilk yerel uygulama aşamasını anlatır. O aşamada GitHub push, deploy, canlı ortam değişkeni/DB değişikliği, gerçek eş hesabı veya gerçek davet oluşturulmadı. Önceki aile modülü yayını bu yeni hesap oluşturma özelliğinin yayını anlamına gelmez.
