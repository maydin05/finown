# Finown çalışma talimatları

1. Önce `/Users/mehmetaydin/Documents/claude-global/CLAUDE.md` dosyasını oku.
2. `README.md` ve `docs/erisim.md` başlangıç kaynaklarıdır. Güncel ödeme/silme pencereleri yayını `docs/2026-11-01_onay-pencereleri-yayin.md`, uygulama ayrıntıları `docs/2026-10-31_onay-pencereleri-ve-canli-renkler.md` içindedir. Giriş/form kaydı `docs/2026-10-31_giris-ve-form-tasarimi.md`, renk yayını `docs/2026-10-31_renk-vurgulari.md`, önceki arayüz yayını `docs/2026-10-31_sade-arayuz-yayin.md`, hesaplama düzeltmeleri `docs/2026-10-31_ilk-paket-uygulama.md`, ilk bağlantı kontrolü `docs/2026-10-31_baglanti-ve-saglik.md` içindedir; değişken durumu canlı doğrula.
3. Repo `maydin05/finown`, Supabase ref `zowlpzmvwiszwhtvsagj`, Netlify site ID `2bed4a00-a1b4-4f59-9989-5ad9b580baf0`. Benzer isimli Derslig/Kidabu projelerini hedefleme.
4. CLI için `./scripts/supabase.sh` kullan. Makinenin varsayılan hesabı farklıdır. `--profile finown` kullanma; bu CLI profil dosyasının tam yolunu bekler.
5. İnceleme varsayılan olarak salt okunur. Üretim veri/şema/ayar değişikliği, restart, migration, deploy ve erişim genişletme göreve özel açık yetki ister. Bağlantı kurma onayı bunları kapsamaz.
6. Kökteki SQL, `fix_sequences.cjs`, `insert_subscriptions.cjs` ve `reproduce_*.cjs` dosyalarını incelemeden çalıştırma; bazıları veri değiştirir. Eski şemayı üretime yeniden uygulama.
7. Token/DB parolasını çıktı, belge veya Git'e koyma. Yönetici anahtarı `VITE_*` içine konmaz. `.env` bu çalışmadan önce Git takibindeydi ve uygulamanın anon anahtarını içeriyor; yeni secret ekleme.
8. Kullanıcının değişikliklerini koru. Kullanıcı istemedikçe commit/push/deploy yapma. Merge, yayın ve kabul durumlarını ayrı doğrula.
9. Onaylı değişiklikleri ve doğrulama sınırlarını tarihli `docs/` kaydına ekle. Erişememek arıza kanıtı, boş anon sorgusu boş tablo kanıtı değildir.

10. Bu depo herkese açıktır. Hesap e-postası ve kişisel finansal inceleme ayrıntıları `docs/private.local/` içinde Git dışında korunur. Yayına yalnız teknik kayıtları gönder; hesap erişimi için gerektiğinde bu yerel kaynağı oku.
