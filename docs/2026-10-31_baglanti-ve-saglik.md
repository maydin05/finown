# 31 Ekim 2026 — Finown bağlantı ve sağlık kontrolü

## Sonuç

31 Ekim 2026, 14:40 Türkiye saati: Finown CLI bağlantısı ve yönetim erişimi doğrulandı; proje ve altı servis `ACTIVE_HEALTHY`. Önceki “Unhealthy” görüntüsünün kesin kök nedeni DOĞRULANMADI. Proje restart edilmedi; üretim verisi/şeması/ayarları değiştirilmedi.

## Bağlantı kanıtı

- Supabase hesabı Finown hesabı (yerel erişim notuna bak) / `maydin05`; organizasyon `maydin05’s Org`.
- Ref `zowlpzmvwiszwhtvsagj`, bölge `ap-southeast-1`.
- Ayrı `finown` CLI tokenı normal giriş akışıyla oluşturuldu, macOS Keychain'e kaydedildi. Token hiçbir proje dosyasına yazılmadı.
- `supabase link` başarılı; repodaki profil üzerinden `projects list` sonucu `linked: true`, `status: ACTIVE_HEALTHY`.
- `scripts/supabase-health.py` gerçek API çağrısıyla exit 0: db, auth, rest, realtime, storage, pooler servislerinin tamamı `healthy: true`.
- Salt okunur Management API DB sorgusu tamamlandı (`read_only: true`): kontrol 11:37:44 UTC; `pg_postmaster_start_time` = `2026-01-31 06:01:09.220266+00`; teşhis oturumu `transaction_read_only=on`; o anda 19 bağlantı. Bu değer üretim veritabanının genel read-only modda olduğu anlamına gelmez; teşhis oturumu salt okunurdur.
- Varsayılan CLI hesabının korunduğu sonradan doğrulandı: `kidabu-prod`, `Derslig Otomasyon Projesi` listeleniyor. Finown açık profil yoluyla ayrı kullanılıyor.

## Unhealthy incelemesi

İlk panel açılışında “Unhealthy” gözlendi. Sonraki açılışta herhangi bir müdahale olmadan “Healthy” oldu. O anki panel metrikleri CPU %2, disk %4, RAM %50, 8/60 bağlantıydı; bunlar geçmişteki durumu kanıtlamaz.

Yaklaşık son bir saatlik sınırlı log sorguları:

- PostgreSQL loglarında altı kayıt, hepsi `LOG` / SQLSTATE `00000`; bu pencerede kaydedilmiş PostgreSQL hata sinyali görülmedi.
- Auth, Realtime ve Storage mesajlarında taranan hata/timeout desenine eşleşme yoktu. Bu metin filtresi tüm olası arızaları dışlamaz.
- PostgREST loglarında `Warp server error: Thread killed by timeout manager` mesajı bulundu; detay sorgusunda 11:15:00–11:38:30 UTC aralığında 17 log satırı (bazıları birden fazla mesajı birleştiriyor). Ayrı zamanlarda sorgulanan sayımlar doğal olarak değişebilir.
- Gateway durum sayımı: 96 adet 200, dört adet 201, iki adet 401; taranan pencerede kaydedilmiş 5xx yok. İki 401 ilk anon kök REST denemeleriyle uyumlu; bire bir istek kimliğiyle eşleme yapılmadı.
- PostgREST'in kendi [#4799 hata kaydı](https://github.com/PostgREST/postgrest/issues/4799), bu Warp mesajının normal işlem sırasında yanıltıcı biçimde yazılabildiğini açıklıyor. Dolayısıyla mesaj tek başına Finown arızasının kök nedeni sayılmadı.

**Değerlendirme:** Şu an devam eden servis arızası saptanmadı. Kısa süreli health-check başarısızlığı veya panelde geçici durum olasılığı var, ancak nedeni kanıtlayan tarihsel servis sağlık kaydı yok. PostgreSQL restartı tespit edilmedi. Plan yükseltme/restart gibi bir müdahale yapılmadı ve gerekli olduğu sonucu çıkarılmadı.

Tekrarlanırsa, müdahaleden önce Türkiye/UTC saatini ve hangi servisin unhealthy olduğunu kaydet; hazır sağlık kontrolünü çalıştır, aynı dar zaman penceresinde servis loglarını ve kaynak grafiklerini karşılaştır. Süreklilik veya kullanıcı hatası varsa Supabase destek incelemesine bu zaman aralığıyla git.

Advisor Center ayrıca RLS performans önerileri ve “Leaked Password Protection Disabled” uyarısı gösterdi. Bunlar ayrı bulgulardır; Unhealthy'nin nedeni olarak doğrulanmadı, otomatik değiştirilmedi.

## Proje klasörü

- `git fetch origin` başarılı; mevcut `main` ile `origin/main` farkı 0 ileri / 0 geri. Uygulama kodu günceldi.
- Eski Vite şablon README'si proje başlangıç rehberiyle değiştirildi; `AGENTS.md`, erişim envanteri, CLI profili ve kontrol scriptleri eklendi.
- Supabase yerel config/link metadatası oluşturuldu. `config.toml` üretim ayarı kopyası değildir; `config push` yapılmadı.
- `.gitignore` yerel env, Netlify metadatası ve Python cache'i için genişletildi. `.env` zaten Git takibindeydi; bu çalışmada içeriği ve Git geçmişi değiştirilmedi.
- Netlify `getSite` ile repo `maydin05/finown`, dal `main`, build `npm run build`, yayın klasörü `dist` doğrulandı. Deploy yapılmadı.
- Kontrol: shell sözdizimi ve `git diff --check` başarılı; wrapper gerçek CLI çağrısı ve sağlık scripti gerçek API çağrısı başarılı. Uygulama kodu değişmediği için build/UI kabul testi çalıştırılmadı.
- Belgeler ve yardımcı dosyalar yerel değişikliktir; commit/push yapılmadı.

## Kaynaklar

- [Supabase API](https://supabase.com/docs/reference/api/introduction)
- [Resmî log sorgulama rehberi](https://supabase.com/docs/guides/observability/advanced-log-filtering)
- [PostgREST Warp log hatası](https://github.com/PostgREST/postgrest/issues/4799)

## Onaylı kullanıcı kaydı

Kullanıcının istediği banka mevcut yapıya uygun eklendi ve ayrı salt okunur readback ile doğrulandı. Kişisel kayıt ayrıntıları Git dışındaki `docs/private.local/` klasöründedir.
