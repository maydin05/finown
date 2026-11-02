import { test, expect } from '@playwright/test';
const path='/tests/family-preview.html';
const role = (page,value)=>page.getByLabel('Deneme görünümü').selectOption(value);
async function create(page,title='Süpürge',amount='2500') {
  await page.getByRole('button',{name:'Talep oluştur',exact:true}).click();
  await page.getByLabel('İhtiyaç adı',{exact:true}).fill(title);
  await page.getByLabel('Tahmini tutar (TL)',{exact:true}).fill(amount);
  await page.getByRole('button',{name:'Yerel olarak kaydet',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Yeni harcama talebi',exact:true})).toHaveCount(0);
}
async function approve(page,title='Süpürge') {
  await role(page,'owner');await page.getByRole('button',{name:new RegExp(title)}).click();
  await page.getByRole('button',{name:'Tutar ve kart seç',exact:true}).click();
  await expect(page.getByRole('dialog').getByText('Mevcut plana göre karşılanabiliyor')).toBeVisible();
  await page.getByRole('button',{name:'Yerel olarak kaydet',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Onaylanan koşullar'})).toBeVisible();
}
test.beforeEach(async({page})=>{
  await page.clock.setFixedTime(new Date('2026-11-01T09:00:00Z'));
  await page.route('**/rest/v1/**',route=>route.abort());
  await page.goto(path);
  await expect(page.getByRole('heading',{name:'Aile bütçesi',exact:true})).toBeVisible();
});
test('talep → onay → değişen gerçek harcama → inceleme → tek bütçe satırı ve kalıcı kayıt',async({page})=>{
  const writes=[];page.on('request',r=>{if(/supabase/.test(r.url())&&!['GET','OPTIONS'].includes(r.method()))writes.push(r.method());});
  await create(page);await approve(page);
  await role(page,'requester');await page.getByRole('button',{name:/Süpürge/}).click();
  await page.getByRole('button',{name:'Satın aldım',exact:true}).click();
  await page.getByLabel('Gerçek tutar (TL)').fill('2200');
  await page.getByRole('button',{name:'Yerel olarak kaydet',exact:true}).click();
  await expect(page.getByText('Gerçek harcama · inceleme gerekli',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Talebi iptal et',exact:true})).toHaveCount(0);
  await role(page,'owner');await page.getByRole('button',{name:/Süpürge/}).click();
  await page.getByRole('button',{name:'Gerçek harcamayı incele',exact:true}).click();
  await page.getByLabel('Gerekçe',{exact:true}).fill('Fiili tutarı kontrol ettim.');
  await page.getByRole('button',{name:'Yerel olarak kaydet',exact:true}).click();
  await expect(page.getByText('Satın alındı',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Ortak plan',exact:true}).click();
  const list=page.getByRole('list',{name:'Ortak bütçe hareketleri'});
  await expect(list.getByText('Süpürge',{exact:true})).toHaveCount(1);
  await expect(list.getByText(/· Gerçek harcama$/)).toHaveCount(1);
  await page.reload();await expect(page.getByRole('button',{name:/Süpürge/})).toBeVisible();
  expect(writes).toEqual([]);
});
test('düşük teklif koşulları, kabul, açıklama düzenleme ve gerekçeli geri çekme',async({page})=>{
  await create(page,'Masa','4000'); await role(page,'owner'); await page.getByRole('button',{name:/Masa/}).click();
  await page.getByRole('button',{name:'Tutar ve kart seç',exact:true}).click();
  await page.getByLabel('Karar',{exact:true}).selectOption('offer');
  await page.getByLabel('Onay / öneri tutarı (TL)').fill('2000');
  await page.getByLabel('Karar açıklaması').fill('Bu tutarla ilerleyelim.');
  await page.getByRole('button',{name:'Tutar önerisini gönder',exact:true}).click();
  await role(page,'requester');await page.getByRole('button',{name:/Masa/}).click();
  await expect(page.getByRole('heading',{name:'Mehmet’in tutar ve ödeme önerisi'})).toBeVisible();
  await expect(page.getByText(/Örnek Kart B/)).toBeVisible();
  await page.getByRole('button',{name:'Teklifi güncel bütçeyle kabul et',exact:true}).click();
  await page.getByRole('button',{name:'Talebi düzenle',exact:true}).click();
  await page.getByLabel('Açıklama',{exact:true}).fill('Sadece açıklamayı güncelledim.');
  await page.getByRole('button',{name:'Yerel olarak kaydet',exact:true}).click();
  await expect(page.getByRole('button',{name:'Satın aldım',exact:true})).toBeVisible();
  await role(page,'owner');await page.getByRole('button',{name:/Masa/}).click();
  await page.getByRole('button',{name:'Kararı geri çek',exact:true}).click();
  await page.getByRole('button',{name:'Yerel olarak kaydet',exact:true}).click();
  await expect(page.getByRole('alert').filter({hasText:'Gerekçe gerekli.'}).last()).toBeVisible();
  await page.getByLabel('Gerekçe',{exact:true}).fill('Plan değişti.');
  await page.getByRole('button',{name:'Yerel olarak kaydet',exact:true}).click();
  await expect(page.getByText('Onay bekliyor',{exact:true})).toBeVisible();
  await role(page,'requester');await page.getByRole('button',{name:/Bildirimler/}).click();
  await expect(page.getByRole('button',{name:/Masa: Karar geri çekildi/})).toBeVisible();
});
test('form gelecekteki gerçek alışverişi reddeder; yorum metni güvenli görüntülenir',async({page})=>{
  await create(page);await approve(page);await role(page,'requester');await page.getByRole('button',{name:/Süpürge/}).click();
  await page.getByRole('button',{name:'Satın aldım',exact:true}).click();
  await page.getByLabel('Gerçek alışveriş tarihi').fill('2026-11-02');
  await page.getByRole('button',{name:'Yerel olarak kaydet',exact:true}).click();
  await expect(page.getByRole('alert').last()).toContainText('Gerçek alışveriş tarihi');
  await page.getByRole('button',{name:'Vazgeç',exact:true}).click();
  await page.getByRole('button',{name:'Yorum ekle',exact:true}).click();
  await page.getByLabel('Yorum',{exact:true}).fill('<img src=x onerror=alert(1)>');
  await page.getByRole('button',{name:'Yerel olarak kaydet',exact:true}).click();
  await expect(page.getByText('<img src=x onerror=alert(1)>',{exact:true})).toBeVisible();
  expect(await page.locator('.family-history img').count()).toBe(0);
});
test('kayıt seçimi başlangıçta boş, mevcut hesap kayıtları yalnız okunur; mobil taşma yok',async({page})=>{
  await page.getByLabel('Veri kaynağı').selectOption('personal');
  await page.getByRole('button',{name:'Ortak plan',exact:true}).click();
  await expect(page.getByRole('list',{name:'Ortak bütçe hareketleri'}).getByRole('listitem')).toHaveCount(0);
  await role(page,'owner');await page.getByRole('button',{name:'Hesaplamaya katılacak kayıtları seç',exact:true}).click();
  await page.getByLabel(/Seçilebilir örnek ödeme/).check();
  await page.getByRole('button',{name:'Yerel olarak kaydet',exact:true}).click();
  await expect(page.getByRole('list',{name:'Ortak bütçe hareketleri'}).getByText('Seçilebilir örnek ödeme',{exact:true})).toBeVisible();
  await expect(page.getByText('Seçilebilir örnek maaş',{exact:true})).toHaveCount(0);
  const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
});
test('iki sekme atomik yerel işlem: eski sürüm rezervi bütçeyi aşamaz, çift gönderim tek olaydır',async({page})=>{
  // Storage boundary test inside the disposable test origin, not a real account.
  const result=await page.evaluate(async()=>{
    const {localFamilyRepository}=await import('/src/family/repository.js');
    const {seededDemo,demoEnvironment}=await import('/src/family/environment.js');
    const e=demoEnvironment('2026-11-01');const id=crypto.randomUUID();
    const a=localFamilyRepository(id,()=>seededDemo(id,e)), b=localFamilyRepository(id,()=>seededDemo(id,e));
    let s=await a.load();s=await a.dispatch('requester',{version:s.version,action:'create',payload:{title:'Eşzamanlı',amount:2500,date:e.today}},e);
    const command={action:'approve',requestId:s.requests[0].id,payload:{amount:2500,cardId:'b'},version:s.version};
    const outcomes=await Promise.allSettled([a.dispatch('owner',command,e),b.dispatch('owner',command,e)]);
    const current=await a.load();a.close();b.close();
    return {success:outcomes.filter(r=>r.status==='fulfilled').length,fail:outcomes.filter(r=>r.status==='rejected').length,approvals:current.events.filter(e=>e.action==='approve').length};
  });
  expect(result).toEqual({success:1,fail:1,approvals:1});
});

test('gerçek kart harcamasının banka limitine yansıması açıkça doğrulanır',async({page})=>{
  await create(page);await approve(page);await role(page,'requester');await page.getByRole('button',{name:/Süpürge/}).click();
  await page.getByRole('button',{name:'Satın aldım',exact:true}).click();
  await page.getByRole('button',{name:'Yerel olarak kaydet',exact:true}).click();
  await role(page,'owner');await page.getByRole('button',{name:'Ortak plan',exact:true}).click();
  await page.getByRole('button',{name:'Kullanılabilir limitleri doğrula',exact:true}).click();
  await page.getByLabel('Kart',{exact:true}).selectOption('b');
  await page.getByLabel('Bankadaki bugünkü kullanılabilir limit (TL)',{exact:true}).fill('27500');
  await page.getByLabel(/Süpürge ·/).selectOption('true');
  await page.getByRole('button',{name:'Yerel olarak kaydet',exact:true}).click();
  await expect(page.getByText(/Örnek Kart B: ₺27.500,00/)).toBeVisible();
  await page.getByRole('button',{name:'Talepler',exact:true}).click();
  await page.getByRole('button',{name:/Süpürge/}).click();
  await expect(page.getByRole('heading',{name:'Gerçek harcama',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
