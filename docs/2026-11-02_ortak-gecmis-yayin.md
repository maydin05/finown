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
- Son mobil kontrol ve satır karşılaştırması yayın sonrası eklenir. Canlıda gerçek eş hesabı veya ikinci oturum oluşturulmaz; iki hesaplı yetkilendirme kabulü yerel test kapsamındadır.
