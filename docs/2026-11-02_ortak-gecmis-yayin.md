# Salt okunur ortak geçmiş — üretim yayını

2 Kasım 2026. Kullanıcı geçmiş ekranının GitHub/Netlify yayınını ve canlı hesabında mobil kontrolünü yetkilendirdi. Mevcut tutarlar, tarihler ve ödeme durumları değişmeyecek; gerçek eş hesabı oluşturulmayacak.

## Yayına hazırlanan davranış

- Aile bütçesi → Geçmiş: ödenmiş/alınmış ve bekleyen hareketler, kaynak/plan ayrıntıları, arama/tür/durum/ay filtreleri ve tüm tarihler görünümü.
- Kayıtlı plan, beklenen ve gerçek tutar ayrılır; geçmiş durumda gerçek tutar/tarih saklanmamışsa değer üretilmez. Kart abonelikleri ile arşiv/toplam dışı kayıtlar açık etiketle okunabilir.
- Yalnız GET geçmiş uç noktası. Mevcut doğrulanmış oturum ve güncel üyelik zorunlu; veriler sunucuda paylaşım kapsamına göre süzülür. Geçmiş alanında düzenleme/silme/kaydetme veya ödeme işaretleme yoktur.
- RLS, Auth/Netlify ortam ayarları ve mevcut paylaşım kapsamı değişmez. Yeni migration gerekmez. Okuma sırasında finans kayıtlarına veya aile işlem geçmişine yazılmaz.
- Sabit ödemelerde 90 gün sınırı yoktur. Süresiz planlar tüm tarihler görünümünde bu aya kadar listelenir; ileri ay seçilebilir. Olağandışı geniş aralıkta ay seçme uyarısı verilir.

## Yayın öncesi kontrol

- On finans tablosu, beş aile tablosu ve Auth hesap/şifre durumunun tam karşılaştırma kopyası Git dışındaki özel yerel alana alındı.
- 74 birim testi, 14 gerçek yerel GoTrue/PostgreSQL sunucu testi ve 12 mobil Auth/aile testi başarılı. Üretim handler'ı kısıtlı DB rolüyle geçmiş GET/query yolunda da test edildi.
- 320/375/430 px: eski maaşın gerçek tutarı ve notu, ödenmiş taksit, filtreler/kaynak ayrıntıları, sıfır finans yazma isteği ve erişim kaldırılınca görünümün temizlenmesi doğrulandı.
- ESLint, üretim derlemesi ve Netlify Function paketlemesi başarılı. Önceki büyük JS paketi/Browserslist uyarıları devam ediyor.

## Canlı doğrulama

- İlk özellik SHA’sı `71ceb9ada4d41a454a0c8e400a94db9ad47eb4c9`, GitHub `main` üzerinde doğrulandı. Netlify `6ae840076c9782948349c896` aynı SHA ile `ready`; 2 Kasım 2026 10:47 TRT.
- Canlı health 200/ready, oturumsuz geçmiş isteği 401. Mevcut bütçe sahibi oturumunda Geçmiş sekmesi, eski ödenmiş taksitler ve arama/tür/durum filtreleri açıldı.
- Bu tarayıcının yerleşik month alanında ay seçimi güvenilir biçimde doğrulanamadığı için dönem kontrolü açık Yıl/Ay seçimlerine taşındı. İki seçim de tarayıcının yerel açılır listelerini kullanır; yalnız yıl da filtrelenebilir. DTO yıl seçeneklerini sadece paylaşılan kaynaklardan üretir.
- Yıl/Ay düzeltmesi `35b9fd0c6c79c15c5c5512947f917e5f1f25db2a` GitHub `main` üzerinde doğrulandı. Netlify `6ae842c6c95d415d62732040` aynı SHA ile `ready`; 2 Kasım 2026 10:59 TRT. Ardından 74 birim, 14 sunucu ve 12 mobil test, ESLint ve üretim derlemesi tekrar başarılı.
- Canlıda eski bir ödenmiş kredi taksiti yıl+ay+tür+durum+arama filtresiyle tek kayda indirildi. Açılan ayrıntının tarihi, tutarı, taksit açıklaması ve ürün adı mevcut kayda uyuyor. Gelir kaynağının plan tutarı, başlangıç/bitiş ve ödeme günü de açıldı. Kişisel tutarlar veya ekran görüntüsü kamuya açık belgeye alınmadı.
- 320/375/430 × 667 px ölçümlerde yatay taşma yok. Detay bölgesinde kaydet/sil/düzenle/ödeme işaretleme düğmesi sayısı sıfır. 375 × 812 px ekran görüntüsü özel yerel kayda alındı; viewport kontrol sonunda sıfırlandı. Fiziksel cihaz kabulü yapılmadı.
- Yayın sonrası on finans tablosu, beş aile tablosu ve Auth hesap/şifre durumunun tüm satırları yayın öncesi kopyayla birebir aynı. Tutarlar, tarihler, ödeme/alınma durumları, paylaşım kapsamı ve mevcut bütçe ayarları değişmedi. Gerçek eş hesabı veya davet oluşturulmadı; mail gönderilmedi.
- Karşılaştırmanın ilk okuma isteğinde bağlantı yanıt alınmadan kapandı. Aktif snapshot sorgusu kalmadığı salt okunur kontrolle doğrulandı; yeniden okuma ve tam karşılaştırma başarılı.
- Canlı kontrol mevcut bütçe sahibi hesabında yapıldı. Eş hesabı henüz oluşturulmadığından ikinci canlı oturum kabulü yapılmadı; iki hesaplı yetkilendirme ve erişim kaldırma yerel testlerde doğrulandı.
