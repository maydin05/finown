# Ortak bütçede salt okunur geçmiş ve detaylar — yerel uygulama

> Yerel uygulama kaydıdır. Güncel üretim durumu: [yayın kaydı](2026-11-02_ortak-gecmis-yayin.md).

2 Kasım 2026. Kullanıcı eşinin geçmiş gelir ve ödemeleri tüm ayrıntılarıyla görebileceği bir ekranın hazırlanmasını ve mobil testini istedi. Mevcut tutarlar, tarihler ve durumlar korunacak; gerçek eş hesabı oluşturulmayacak.

## Davranış

- Aile bütçesinde yeni “Geçmiş” sekmesi. “Hareketler” ödenmiş/alınmış ve bekleyen kayıtları; “Kaynaklar ve planlar” gelir, gider, abonelik ve banka ürünlerinin plan ayrıntılarını gösterir.
- Arama, tür, durum, ay ve tüm tarihler filtreleri. Uzun listeler 30 kayıtlık sayfalara bölünür. Kayıt açıldığında dönem, tarihler, plan/beklenen/gerçek tutar, notlar, ödeme yöntemi ve paylaşılan ürün bilgileri görüntülenir.
- Maaşın kayıtlı gerçek tutarı kullanılır. Yalnız geçmiş alındı işareti varsa gerçek tutar uydurulmaz. Planı değişmiş veya eksik kaynakların saklanmış dönem kayıtları da korunur; yalnız durum saklandıysa eksik tarih/tutar açıkça belirtilir.
- Arşivli ve toplam dışında kaynaklar etiketli biçimde okunabilir; yeniden etkinleştirilmez. Kart abonelikleri de listelenir; bu liste toplam veya ikinci nakit çıkışı hesabı değildir.
- Süresiz planlar tüm tarihler görünümünde bu aya kadar üretilir; gelecek ay seçilerek o dönem görülebilir. Sabit tarihli ödemeler ve bitişi olan planlar 90 günle sınırlanmaz. Olağandışı 100 yıldan geniş kaynak aralığında sessiz kesme yerine ay seçme uyarısı verilir.
- Salt okunur alanda düzenleme, silme, kaydetme veya durum değiştirme eylemi yoktur. Mevcut ana finans ekranları/hareket hesaplaması değişmedi.

## Erişim

- Yalnız GET `/family-api/budgets/:id/history`, isteğe bağlı `period=YYYY-MM`. Var olan gerçek Supabase oturumu ve güncel bütçe üyeliği her istekte doğrulanır; POST 405, yabancı aile 403.
- Mevcut `family_private_finance` korumalı okuması kullanılır; çıktı sunucuda scope'a göre süzülüp açık alan listesiyle oluşturulur. Seçilmemiş kart/ana kart adı, kullanıcı kimliği, ham tracker veya finans parmak izi aktarılmaz.
- Geçmiş için ayrı okuma uç noktası; düzenli ortak plan yanıtları büyütülmez. Üyelik kaldırıldığında mevcut bütçe kontrolü görünümü temizler. Scope/sürüm değişiminde önceki geçmiş yanıtı gizlenir; filtre değişimlerinde eski istek sonuçları uygulanmaz. Geçmiş açıkken beş saniyede bir güncel yetki/veri okuması yapılır; tarayıcıda kalıcı finans cache'i yoktur.
- Yeni DB migration veya canlı ayar değişikliği gerekmez.

## Doğrulama

- Birim testleri: eski ödenmiş kayıt, gerçek maaş ve beklenen tutar, kart aboneliği, arşiv/toplam dışı kaynak, kapsam gizliliği, çakışan legacy durum ve eksik plan dışındaki kayıt geçmişi.
- Gerçek yerel GoTrue/PostgreSQL testleri: iki hesapla geçmiş erişimi, yabancı bütçe reddi, POST reddi, dönem filtresi ve üyelik kaldırma; tüm on finans tablosu okuma öncesi/sonrası aynı ve okuma olay kaydı yaratmıyor.
- Mobil 320/375/430 px: ayrı iki örnek oturum, geçmiş maaşın gerçek tutarı/notu, eski ödenmiş taksit, filtre/kaynak ayrıntıları, yazma düğmesi bulunmaması, sıfır finans API yazma isteği ve yatay taşma olmaması. Erişim kaldırılınca detay ekranının temizlendiği de doğrulandı.
- Son kontroller: 74 birim testi ve 14 gerçek yerel sunucu testi başarılı. Yeni geçmiş akışı ve erişimin kaldırılması 320/375/430 px testlerinin üçünde başarılı; mevcut dokuz Auth/aile mobil testi de önceki kontrol koşusunda başarılı. ESLint, üretim derlemesi ve diff-check başarılı. Önceki büyük JS paketi/Browserslist uyarıları devam eder.
- Özel yerel finans kopyasıyla da okuma modeli çalıştırıldı: saklanmış tüm ödeme kayıtları korunuyor ve giriş nesnesi değişmiyor. Kişisel sayılar ve ayrıntılar kamuya açık belgeye alınmadı.
- Önizleme: `tests/family-history-preview.html`, yalnız örnek kayıtlar ve DEV. Gerçek Auth/DB bağlantısı veya yazma işlevi yoktur.
- İlk yerel uygulama aşamasında GitHub push, Netlify deploy, canlı veri/ayar yazısı, gerçek eş hesabı ve gerçek davet yoktur. Bu yerel sonuçlar canlı eş oturumu kabulü değildir.
