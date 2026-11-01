# Kullanılabilir bakiye ve ödeme açığı — yerel uygulama ve kontroller

Durum: Kullanıcının 1 Kasım 2026 tarihli isteğiyle çalışma duraklatıldı. Yerel değişiklikler commit edilmedi; GitHub gönderimi, Netlify yayını ve üretim migration uygulaması yapılmadı. Üretim verilerine yazılmadı.

Güncelleme — 1 Kasım 2026: Kullanıcı devam istedi; kalan kod incelemesi ve README bağlantısı tamamlandı. Birim/API, mobil, yalıtılmış SQL, lint ve build kontrolleri yeniden çalıştırıldı. Bu çalışma kapsamında commit/push/deploy veya üretim veri/şema değişikliği yapılmadı. Canlı ortamın güncel sürümü bu yerel doğrulama kapsamında incelenmedi.

## Hazırlanan değişiklikler

- Ana ekranda manuel kullanılabilir bakiye ve gelirden önce ödeme açığı kartı; bakiye giriş/düzenleme formu ve hesap ayrıntısı.
- Boş bakiye sıfır kabul edilmez; sıfır geçerli girdidir. Eski tarihli bakiye veya finans kayıtları değişince yeniden doğrulama istenir. Kart limiti ve henüz alınmamış gelir kullanılabilir paraya eklenmez.
- Eksik tutarlar ve gelirin geldiği günün ödeme sırası kesin sonuç gibi sunulmaz. Hesap elle girilen bakiyeye dayanır; banka entegrasyonu değildir. Önceki tarihlerdeki bekleyen ödemeler mevcut dönem hesabına katılmaz ve ayrıntıda ayrıca uyarılır.
- Ayrı kullanıcıya ait bakiye tablosu ve SECURITY INVOKER RPC migration dosyası hazırlandı: `supabase/migrations/202611010002_available_balance.sql`. Kullanıcı sahipliği RLS ve oturum doğrulamasıyla korunur. Ödeme, takip ve kaynak tablolarına yazmaz.
- Bakiye kayıt hatası önceki durumu korur; vazgeçme ve bakiyeyi kullanmama akışları eklendi.

## Tamamlanan yerel doğrulamalar

- ESLint başarılı.
- Birim/API testleri: 41/41 başarılı.
- Mobil testler: 320, 375 ve 430 px genişliklerde toplam 51/51 başarılı.
- Üretim derlemesi başarılı; mevcut büyük paket boyutu uyarısı sürüyor.
- Ayrı, geçici PostgreSQL 18 Docker veritabanında migration ve SQL testleri başarılı: sıfır/boşaltma/doğrulama, sahiplik ve anonim erişim kısıtları, oturum sahibi değişimi, korunan ödeme satırının tüm alanlarının aynı kalması.
- Yerel örnek veri ekranında 375×667 görsel kontrol: 1.000 TL ödeme ve 400 TL bakiye için 600 TL açık; ilk iki yaklaşan ödeme ilk ekranda görünür. Bu tutarlar yalnız sentetik örneklerdir.

## Yayın öncesi kalan adımlar

1. Başlangıç HEAD: `5439c2aaa586332db63726618f8d9a72618ebdd0`. Yerel değişiklikleri koru; yayına hazırlanırken çalışma ağacını yeniden kontrol et.
2. Son diff incelemesi ve README başlangıç bağlantısı tamamlandı. Yeni değişiklik olursa ilgili testleri yenile.
3. Yayın ayrıca yetkilendirilmedikçe commit/push/deploy veya üretim şema değişikliği yapma.
4. Yayın yetkisi gelirse önce yalnız yeni bakiye migration dosyasının hedefini ve canlı şemayı kontrol et. Yeni frontend `getAllData` içinde bakiye tablosunu okuduğundan migration frontend yayınından önce uygulanmalıdır. Eski migration veya kökteki bakım SQL'lerini yeniden çalıştırma.
5. Canlıya geçişte ödeme kayıtlarının, tarihlerinin ve durumlarının korunmasını salt okunur önce/sonra karşılaştırmayla doğrula. Gerçek bakiye girme veya ödeme durumunu değiştirme test yetkisi varsayma.

Yerel örnek ekran: http://127.0.0.1:5175/tests/ui-preview.html?app=1 . Önizlemenin bakiye kaydı bellektedir, üretime bağlı değildir; sayfa yenilenince sıfırlanır. Hesap bazlı kalıcılık için hazırlanan migration bu çalışma kapsamında üretime uygulanmadı.

## Yayın yetkisi ve veritabanı güncellemesi — 1 Kasım 2026

Yukarıdaki yerel/pause durumları tarihsel kayıttır. Kullanıcı GitHub, Netlify ve gerekli veritabanı güncellemesini açıkça yetkilendirdi. `202611010002_available_balance.sql` üretime 15:16 UTC'de uygulandı; tablo ve RPC yeniden okunarak doğrulandı. RLS açık; anonim okuma ve authenticated DELETE izni yok; RPC SECURITY INVOKER. Yeni tablo boş bırakıldı, gerçek bakiye girilmedi. Mevcut sekiz finans tablosunun tüm satırları önce/sonra aynı. Özel yedek ve SHA-256 doğrulama kaydı Git dışındadır. Frontend yayını ve canlı kontroller ayrıca yayın kaydına eklenecek.
