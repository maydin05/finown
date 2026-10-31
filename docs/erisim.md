# Finown erişim rehberi

Son doğrulama: 31 Ekim 2026. Değişken durumları yeniden kontrol et.

| Servis | Hesap / hedef | Doğrulama |
| --- | --- | --- |
| GitHub | `maydin05/finown`, dal `main` | Bağlı araç admin/pull/push yetkisi gösterdi |
| Supabase | Finown hesabı (yerel erişim notuna bak), `maydin05`, `maydin05’s Org` | Tarayıcı, CLI, Management API ve salt okunur DB sorgusu |
| Netlify | `finown`, site ID `2bed4a00-a1b4-4f59-9989-5ad9b580baf0` | CLI siteyi listeledi; deploy yapılmadı |

## Bağlantılar

- Repo: https://github.com/maydin05/finown
- Supabase panel: https://supabase.com/dashboard/project/zowlpzmvwiszwhtvsagj
- Organizasyon: https://supabase.com/dashboard/org/ffixavmxcnlztnjjmlpi
- Şema: https://supabase.com/dashboard/project/zowlpzmvwiszwhtvsagj/database/schemas
- Loglar: https://supabase.com/dashboard/project/zowlpzmvwiszwhtvsagj/logs
- Uygulama: https://finown.netlify.app
- Netlify: https://app.netlify.com/projects/finown

Supabase ref: `zowlpzmvwiszwhtvsagj`; org ID: `ffixavmxcnlztnjjmlpi`; bölge `ap-southeast-1` (Singapore); DB host `db.zowlpzmvwiszwhtvsagj.supabase.co`.

## Günlük kullanım

Repo kökünden:

```sh
./scripts/supabase.sh projects list --output json
python3 scripts/supabase-health.py
```

CLI profili `supabase/cli-profile.toml`; token macOS Keychain'de `Supabase CLI` servisi, `finown` hesabında. Token dosyalara kopyalanmaz. `supabase/.temp/` yerel link metadatası Git dışındadır. Başka projelerin varsayılan CLI hesabını kullanma.

## Yeni makine / yeniden giriş

Supabase CLI kurulmalı. Chrome'da Supabase hesabının Finown hesabı (yerel erişim notuna bak) olduğunu doğrula.

```sh
./scripts/supabase.sh login --name finown --no-browser
./scripts/supabase.sh link --project-ref zowlpzmvwiszwhtvsagj
./scripts/supabase.sh projects list --output json
```

Resmî giriş bağlantısını açıp kodu terminale gir. Bu CLI sürümü login sırasında `~/.supabase/profile` dosyasını da değiştirir: girişten önceki dosya durumunu kaydet, sonra aynen geri getir. Bu kurulumda dosya önceden yoktu; login'in oluşturduğu dosya kaldırılıp eski varsayılan hesap korundu. Finown açık profil yolu ile çalışır. `--profile` profil adı değil `.toml` yolu bekler.

Sağlık scripti macOS Keychain kullanır. Windows/Linux credential okuma yöntemi ayrıca uyarlanmalıdır. CLI tokenı frontend anahtarından ayrıdır; yönetici anahtarı `VITE_*` değişkenlerine yazılmaz.

## Uygulama bağlantısı

`.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Anon oturumla boş sorgu sonucu gerçek verinin boş olduğunu göstermez. `/rest/v1/` kök adresi anon anahtarla 401 dönerken doğrudan tablo sorguları 200 ile doğrulandı. `.env` zaten Git takibindeydi; mevcut anon anahtarı yönetim tokenı değildir. Bu çalışma geçmişi değiştirmedi.

`supabase/config.toml` yerel ayardır, üretim ayarlarını temsil etmez; `config push`, `db push`, eski SQL veya bakım scriptlerini onaysız çalıştırma.

## Sağlık ve log araştırması

Hazır sağlık scripti yalnız proje ve servis sağlık GET isteklerini yapar. Teşhis SQL'i yalnız SELECT ve `read_only: true` ile çalıştırılır. Log sorguları dar zaman aralığı ve LIMIT kullanır; HTTP durumuyla birlikte yanıtın `error` alanı da kontrol edilir.

- API: https://supabase.com/docs/reference/api/introduction
- Log sorguları: https://supabase.com/docs/guides/observability/advanced-log-filtering

## Netlify

Klasör Netlify CLI'a linkli değildi; salt okuma için açık site ID'si kullan:

```sh
netlify api getSite --data '{"site_id":"2bed4a00-a1b4-4f59-9989-5ad9b580baf0"}'
```

Canlı `getSite` yanıtında repo `maydin05/finown`, dal `main`, build `npm run build`, yayın dizini `dist` doğrulandı. Deploy ayarları bu işte değiştirilmedi. Supabase panelindeki “No repository connected”, Netlify'ın GitHub bağlantısı hakkında kanıt değildir.

## Yerel hesap ayrıntıları

Bu depo herkese açıktır. Hesap e-postası ve önceki kişisel inceleme ayrıntıları bu makinede `docs/private.local/erisim.md` içinde korunur; klasör Git dışında tutulur.
