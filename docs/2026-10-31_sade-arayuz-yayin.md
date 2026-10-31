# Sade arayüz yayın kaydı — 31 Ekim 2026

Kullanıcı GitHub gönderimi ve Netlify üretim yayınına açık yetki verdi. Sonraki talimatıyla canlı hesap testini kendisi yapacağını belirtti; hesap içi kabul testi kullanıcıya bırakıldı.

## Yayın

- Uygulama commit’i: `0509912955f75ed1c61dde452a210481af6f7b87`. GitHub `main` ucu `git ls-remote` ile eşleşti.
- Netlify üretim deploy’u: `6ae5f2036f975cfc962716f4`, durum `ready`; yayın zamanı `2026-10-31T13:50:09.431Z` (Türkiye saati 16:50).
- Site: https://finown.netlify.app — repo `maydin05/finown`, dal `main` ve site ID `2bed4a00-a1b4-4f59-9989-5ad9b580baf0` doğrulandı.
- Ana ekran, aylık ödemeler, gelir, abonelik ve bankalar sade tasarıma taşındı. Avantajlı kartlar paneli de yenilendi; vade hesaplama ve sıralama korunuyor.
- Finans hesaplama modülü, API ve veri sağlayıcısı değişmedi. Üretim verisine test yazımı yapılmadı.

## Kanıt ve sınırlar

| Kontrol | Sonuç |
| --- | --- |
| Yerel birim/bileşen | 22/22 başarılı |
| Yerel mobil akışlar | 320/375/430 px’de 12/12 başarılı; avantajlı kartlar dahil |
| Kod/derleme | ESLint, diff kontrolü ve build başarılı; mevcut paket boyutu/Browserslist uyarıları sürüyor |
| Canlı mobil smoke | 320/375/430 px’de 3/3 başarılı; oturumsuz giriş ekranı, SPA rotaları, JS hatası ve yatay taşma kontrolü |
| Canlı JS/CSS | Yerel derleme ile byte düzeyinde aynı |
| Supabase | Proje ve altı servis `ACTIVE_HEALTHY` |
| Canlı hesap ve gerçek cihaz | Kullanıcının son talimatıyla kullanıcı testine bırakıldı; ajan kabulü olarak raporlanmıyor |

Canlı JS: `index-CiepbbP5.js`, SHA-256 `744bd76bdf8ba4aafbca0fda2d921f37a7189699125598388f35fd7f8b4f1fee`.

Canlı CSS: `index-CF8Kjy4x.css`, SHA-256 `4349c7bbb4b866447dfe7ddf8e0a0ff508efc25ee5f58c508709026e6384e754`.

Tarayıcı bağlantısı zaman aşımı ve Chrome Apple Events JavaScript ayarı nedeniyle canlı hesap kontrolü başlatılamadı. Ayar açılması istendiğinde kullanıcı canlı testi kendisinin yapacağını belirtti; ayar değiştirilmedi ve hesapta test işlemi yapılmadı.

Bu kayıt ve başlangıç bağlantılarını güncelleyen sonraki belge commit’i uygulama dosyalarını değiştirmez. Teknik smoke, örnek verili testler ve kullanıcı kabulü ayrı tutulur.

Uygulama ayrıntıları: [Sade arayüz uygulaması](2026-10-31_sade-arayuz-uygulama.md).
