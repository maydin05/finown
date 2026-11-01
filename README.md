# Finown

Kişisel finans uygulaması: React + Vite, Supabase ve Netlify.

## Başlangıç

- [Gelirden önce gerekli tutar kartı ve mobil testler (yerel)](docs/2026-11-01_gelir-oncesi-kart-uygulama.md)

- [Kompakt ana ekran: canlı yayın ve mobil kontrol](docs/2026-11-01_kompakt-ana-ekran-yayin.md)

- [Kompakt ana ekran uygulaması ve mobil kontroller (yerel)](docs/2026-11-01_kompakt-ana-ekran-uygulama.md)

- [Kredi, bağlı borç ve vade paketi: canlı yayın ve doğrulama](docs/2026-11-01_kredi-borc-ve-vade-yayin.md)

- [Kredi, bağlı borç ve vade paketi (yerel uygulama + DB doğrulama)](docs/2026-11-01_kredi-borc-ve-vade-paketi.md)

- [Ödeme/silme pencereleri yayın kaydı](docs/2026-11-01_onay-pencereleri-yayin.md)
- [Onay pencereleri ve canlı renkler, uygulama ayrıntıları](docs/2026-10-31_onay-pencereleri-ve-canli-renkler.md)

- [Giriş ve form tasarımı, yerel test kaydı](docs/2026-10-31_giris-ve-form-tasarimi.md)

- [Renk güncellemesi ve canlı yayın doğrulaması](docs/2026-10-31_renk-vurgulari.md)

- [Sade arayüz canlı yayın kaydı](docs/2026-10-31_sade-arayuz-yayin.md)

- [Sade arayüz uygulaması ve mobil test kaydı (yerel)](docs/2026-10-31_sade-arayuz-uygulama.md)

- [Mobil kontrol ve yayın kaydı](docs/2026-10-31_yayin.md)

- [İlk paket uygulaması ve test sonuçları](docs/2026-10-31_ilk-paket-uygulama.md)

- [Ajan talimatları](AGENTS.md)
- [Hesaplar ve bağlantı rehberi](docs/erisim.md)
- [31 Ekim 2026 erişim ve sağlık kaydı](docs/2026-10-31_baglanti-ve-saglik.md)
- [UI/UX, teknik yapı ve finansal takip önerileri](docs/2026-10-31_iyilestirme-onerileri.md)

## Geliştirme

```sh
npm ci
npm run dev
npm run build
npm run lint
npm test
npm run test:mobile
```

`.env.example` uygulamanın gerekli değişkenlerini gösterir. Yönetici anahtarını frontend `VITE_*` değişkenlerine koyma.

## Supabase

```sh
./scripts/supabase.sh projects list --output json
python3 scripts/supabase-health.py
```

Profil `supabase/cli-profile.toml`, token macOS Anahtar Zinciri'ndedir. Kurulum ve yeniden giriş için erişim rehberine bak. `supabase/config.toml` yerel geliştirme ayarıdır; üretim yapılandırmasının kopyası değildir. Kökteki SQL ve bakım scriptleri canlı şemanın güncel kaynağı sayılmaz; otomatik çalıştırılmaz.

Canlı mobil smoke kontrolü (oturumsuz, salt okunur):

```sh
FINOWN_TEST_URL=https://finown.netlify.app npm run test:live
```
