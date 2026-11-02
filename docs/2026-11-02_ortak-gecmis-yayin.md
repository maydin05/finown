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
- ESLint, üretim derlemesi ve Netlify Function paketlemesi kontrol edilir. Önceki büyük JS paketi/Browserslist uyarıları devam ediyor.

## Canlı doğrulama

GitHub SHA, Netlify yayın kimliği, canlı mobil sonuç ve kayıt karşılaştırması doğrulamadan sonra eklenir. Canlıda gerçek eş hesabı veya ikinci oturum oluşturulmaz; iki hesaplı yetkilendirme kabulü yerel test kapsamındadır.
