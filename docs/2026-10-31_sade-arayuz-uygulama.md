# Sade arayüz uygulaması — 31 Ekim 2026

Durum: uygulama GitHub’a gönderildi ve Netlify’da yayımlandı. [Yayın kaydı](2026-10-31_sade-arayuz-yayin.md). Kullanıcı son talimatıyla canlı hesap testini kendisi üstlendi.

## Uygulanan tasarım

Onaylanan mobil önizlemenin açık zemin, koyu yeşil vurgu, daha az kutu ve sade liste yaklaşımı gerçek React bileşenlerine taşındı.

- Ana sayfa `/`: 7/30 günlük beklenen gelir, bilinen ödeme ve dönem farkı; eksik ekstre uyarısı; filtrelenebilir yaklaşan hareketler ve hareket ayrıntısı.
- Aylık ödemeler `/expenses`: ayrı sekme. Ana ekranda ikinci bir aylık özet tekrarlanmıyor.
- Gelir, abonelik ve banka ekranları: ortak aylık başlık, sade satırlar, ayrıntı alanından işlem butonları.
- Avantajlı kartlar: en uzun vadeli kart, tahmini ödeme tarihi ve sade karşılaştırma listesi. Mevcut sıralama hesabı korundu; tanımlı limit ile kullanılabilir limit ayrımı açıklandı.
- Ortak gezinme, hızlı ekleme menüsü ve ayrıntı pencereleri yenilendi. Pencerelerde klavye odağı, Escape ile kapatma ve odağın geri verilmesi destekleniyor.
- Düzenle, sil, not, ödeme durumu ve ekstre işlemlerinin mevcut çağrıları korundu. Giriş/kayıt ekranı ile bakım amaçlı migration ekranı bu görsel paketin dışında.

Finans hesaplama modülü, API ve veri sağlayıcısı değiştirilmedi. Üretim veritabanına bu çalışma kapsamında yazılmadı. Dönem farkının mevcut hesap bakiyesi olmadığı açıklaması korunuyor; karttan çekilen abonelikler ekstreye ikinci kez eklenmiyor.

## Doğrulama

| Kontrol | Sonuç / sınır |
| --- | --- |
| Birim ve bileşen kontrolleri | 22/22 başarılı |
| Mobil tarayıcı kontrolleri | 320, 375 ve 430 px genişlikte 12/12 başarılı |
| Mobil akışlar | 7/30 gün, filtreler, aylık sekmeler, hareket ayrıntısı, durum değişikliği, ekstre girişi, sayfa geçişleri, banka/kart ayrıntısı, avantajlı kartlar ve hızlı ekleme yönlendirmeleri |
| Erişilebilirlik kontrolleri | Ayrıntı penceresi odağı, Tab döngüsü, Escape ve odağın geri verilmesi test edildi; tam WCAG denetimi yapılmadı |
| Kod kontrolü | ESLint ve `git diff --check` başarılı |
| Üretim derlemesi | Başarılı; mevcut büyük JS paketi ve eski Browserslist verisi uyarıları sürüyor |
| Gerçek cihaz ve canlı oturum | Bu paket için çalıştırılmadı; mobil testler Chromium emülasyonu ve örnek verilerle yapıldı |

Test görünümü `/tests/ui-preview.html?app=1` gerçek ekran bileşenlerini yerel örnek veri sağlayıcısıyla çalıştırır. Veritabanı yazmaz. Ekstre formu yerel örnek kaydı günceller; diğer bazı form açma kontrolleri yalnız doğru işlem çağrısına yönlendirmeyi doğrular. Gerçek hesapta form kaydı veya uçtan uca canlı kabul kanıtı sayılmaz.

## Görsel kayıt

Tamamı örnek verilerle alınmıştır:

- [Ana ekran](preview/2026-10-31_sade-ana-ekran.png)
- [Gelir](preview/2026-10-31_sade-gelir.png)
- [Abonelik](preview/2026-10-31_sade-abonelik.png)
- [Bankalar](preview/2026-10-31_sade-bankalar.png)
- [Avantajlı kartlar](preview/2026-10-31_sade-avantajli-kartlar.png)

Yerel inceleme: `npm run dev -- --host 127.0.0.1 --port 5175`, ardından `http://127.0.0.1:5175/tests/ui-preview.html?app=1`.
