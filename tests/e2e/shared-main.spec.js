import {test,expect} from '@playwright/test';

test('eşin ana sayfaları: gerçek iki yerel hesap, aynı gezinme, salt okunur ayrıntılar ve erişim kaldırma',async({page,browser},info)=>{
 test.setTimeout(90000);
 const width=info.project.use.viewport.width;
 const ctx=await browser.newContext({viewport:{width,height:844},timezoneId:'Europe/Istanbul',isMobile:true,hasTouch:true});
 const owner=await ctx.newPage(),ownerEmail=`owner-${width+3000}@family.test`,memberEmail=`member-${width+3000}@family.test`;
 const errors=[],writes=[],remote=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{const u=new URL(r.url());if(u.hostname.endsWith('.supabase.co'))remote.push(u.hostname);if(u.pathname.startsWith('/family-api/') && r.method()!=='GET')writes.push(u.pathname);});
 async function login(p,email,path){await p.goto(path);await p.getByLabel('E-posta',{exact:true}).fill(email);await p.getByLabel('Şifre',{exact:true}).fill('Local-Test-Password-2026');await p.getByRole('button',{name:'Giriş Yap',exact:true}).click();}
 const forbidden=/Kaydet|Sil$|Düzenle|düzenle|olarak işaretle|işaretini geri al|Ekstre tutarı gir|Ödeme tutarı gir|Arşivle \/ sil|Arşiv işlemleri/;
 async function noOverflow(){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 async function inspect(name){await page.getByRole('button',{name,exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('dialog').getByRole('button',{name:forbidden})).toHaveCount(0);await noOverflow();await page.getByRole('button',{name:'Kapat',exact:true}).click();}
 try {
  await login(owner,ownerEmail,'/tests/family-server-preview.html');
  await owner.getByRole('button',{name:'Ortak bütçe oluştur',exact:true}).click();await owner.getByRole('button',{name:'Ortak plan',exact:true}).click();await owner.getByRole('button',{name:'Hesaplamaya katılacak kayıtları seç',exact:true}).click();
  for(const check of await owner.getByRole('dialog').getByRole('checkbox').all())await check.check();await owner.getByRole('button',{name:'Yerel olarak kaydet',exact:true}).click();
  await owner.getByText('Hesap ve bütçe yönetimi',{exact:true}).click();await owner.getByText('Üye ve davet yönetimi',{exact:true}).click();await owner.getByLabel('Davet edilecek yerel hesabın e-postası',{exact:true}).fill(memberEmail);await owner.getByRole('button',{name:'Yerel davet bağlantısı oluştur',exact:true}).click();const link=await owner.getByLabel('Yerel davet bağlantısı',{exact:true}).inputValue();
  await login(page,memberEmail,'/tests/family-server-preview.html');await page.goto(link);await page.getByText('Davet bağlantısını kabul et',{exact:true}).click();await page.getByRole('button',{name:'Bu hesapla daveti kabul et',exact:true}).click();await expect(page.getByRole('button',{name:'Geçmiş',exact:true})).toBeVisible();
  writes.length=0;
  await page.goto('/tests/shared-main-preview.html');
  const nav=page.getByRole('navigation',{name:'Ana gezinme'});
  await expect(nav).toBeVisible();await expect(page.getByText('Ortak görünüm · Salt okunur',{exact:false})).toBeVisible();
  await expect(page.getByRole('button',{name:'Yeni kayıt ekle',exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'Kullanılabilir bakiyeyi düzenle'})).toHaveCount(0);
  await page.getByRole('button',{name:'30 gün',exact:true}).click();await expect(page.getByTestId('expected-income')).toHaveText('₺25.000,00');await noOverflow();
  await inspect('Yerel zorunlu ödeme ayrıntısı');
  await page.getByRole('checkbox',{name:'Geciken ödemeleri açığa kat'}).check();
  await page.getByRole('button',{name:'Bakiye ve ödeme açığının ayrıntısı'}).click();await noOverflow();await page.getByRole('button',{name:'Kapat',exact:true}).click();
  if(width===375)await page.screenshot({path:'/tmp/finown-shared-main-mobile.png',fullPage:false});
  await nav.getByRole('button',{name:'Ödemeler',exact:true}).click();await expect(page.getByRole('heading',{name:'Ödemeler',exact:true})).toBeVisible();await inspect('Yerel zorunlu ödeme ayrıntısı');await page.getByRole('button',{name:'Geciken',exact:true}).click();await inspect('Yerel geciken ödeme ayrıntısı');await noOverflow();
  await nav.getByRole('button',{name:'Gelir',exact:true}).click();await expect(page.getByRole('heading',{name:'Gelirler',exact:true})).toBeVisible();await inspect('Yerel örnek maaş ayrıntısı');await page.getByRole('button',{name:'Önceki ay',exact:true}).click();await page.getByRole('button',{name:'Bu aya dön',exact:true}).click();await page.getByRole('button',{name:'Alınan',exact:true}).click();await page.getByRole('button',{name:'Beklenen',exact:true}).click();await noOverflow();
  await nav.getByRole('button',{name:'Abonelik',exact:true}).click();await expect(page.getByRole('heading',{name:'Abonelikler',exact:true})).toBeVisible();await inspect('Yerel paylaşılan abonelik ayrıntısı');await noOverflow();
  await nav.getByRole('button',{name:'Bankalar',exact:true}).click();await expect(page.getByRole('button',{name:'Banka ekle',exact:true})).toHaveCount(0);await page.getByRole('button',{name:'Avantajlı kartlar',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Kapat',exact:true}).click();await page.getByRole('button',{name:'Yerel Örnek Banka ayrıntısı',exact:true}).click();await expect(page.getByRole('button',{name:'Bankayı düzenle',exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'Kart / kredi ekle',exact:true})).toHaveCount(0);await inspect('Yerel Kart A ayrıntısı');await noOverflow();
  await page.reload();await expect(nav).toBeVisible();await expect(page.getByText('Ortak görünüm · Salt okunur',{exact:false})).toBeVisible();
  // Scope changes must close stale dialogs, not leave old private values on screen.
  await inspect('Yerel zorunlu ödeme ayrıntısı');
  await page.getByRole('button',{name:'Yerel zorunlu ödeme ayrıntısı',exact:true}).click();
  await owner.getByRole('button',{name:'Hesaplamaya katılacak kayıtları seç',exact:true}).click();for(const check of await owner.getByRole('dialog').getByRole('checkbox').all())await check.uncheck();await owner.getByRole('button',{name:'Yerel olarak kaydet',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0,{timeout:12000});await expect(page.getByText('Yerel zorunlu ödeme',{exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Hesap menüsü',exact:true}).click();await page.getByRole('link',{name:'Aile bütçesi',exact:true}).click();await expect(page.getByRole('button',{name:'Talep oluştur',exact:true})).toBeVisible();await expect(page.getByText('Üye ve davet yönetimi',{exact:true})).toHaveCount(0);
  await nav.getByRole('button',{name:'Özet',exact:true}).click();
  await owner.getByRole('button',{name:'İkinci üyenin yerel erişimini kaldır',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Ortak verilere erişim doğrulanamadı',{timeout:12000});await expect(nav).toHaveCount(0);
  expect(writes).toEqual([]);expect(remote).toEqual([]);expect(errors).toEqual([]);
 }finally{await ctx.close();}
});
