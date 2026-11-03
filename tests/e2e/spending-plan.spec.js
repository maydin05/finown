import {test,expect} from '@playwright/test';
const url='/tests/spending-plan-preview.html';
const region=page=>page.getByRole('region',{name:'Harcanabilir tutar ve maaş senaryosu'});
const amount=page=>region(page).getByTestId('spendable-amount');
async function ready(page,path=url){await page.goto(path);await expect(amount(page)).toHaveText('₺2.000,00');}
async function scenario(page){await region(page).getByRole('button',{name:'Maaşı dene'}).click();return page.getByRole('dialog',{name:'Maaş ve harcama senaryosu'});}
test('minimum, safety buffer, scenarios and cancellation never write records',async({page})=>{
 const writes=[],errors=[];page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.url())});page.on('pageerror',e=>errors.push(e.message));await ready(page);
 await region(page).getByRole('button',{name:'Hesabı gör',exact:true}).click();let dialog=page.getByRole('dialog',{name:'Harcanabilir tutarın hesabı'});await expect(dialog).toContainText('₺7.000,00');await dialog.getByLabel('Ek güvenlik payı').fill('1000');await dialog.getByRole('button',{name:'Vazgeç'}).click();await expect(amount(page)).toHaveText('₺2.000,00');
 dialog=await scenario(page);await dialog.getByRole('button',{name:'₺115 bin',exact:true}).click();await expect(dialog).toContainText('₺1.000,00 eksik');await dialog.getByRole('button',{name:'Senaryoyu göster',exact:true}).click();await expect(amount(page)).toHaveText('₺0,00');await expect(region(page)).toContainText('Ana plan: ₺2.000,00');
 dialog=await scenario(page);await dialog.getByLabel('Deneme maaşı').fill('');await expect(dialog.getByRole('button',{name:'Senaryoyu göster'})).toBeDisabled();await dialog.getByRole('button',{name:'Vazgeç'}).click();await expect(region(page)).toContainText('₺1.000,00 eksik');
 await region(page).getByRole('button',{name:'Ana plana dön'}).click();dialog=await scenario(page);await dialog.getByRole('button',{name:'3 gün gecikme',exact:true}).click();await dialog.getByRole('button',{name:'Senaryoyu göster'}).click();await expect(region(page)).toContainText('En yüksek açık ₺5.000,00');
 await page.getByRole('button',{name:'Senaryonun gün gün akışını gör'}).click();await expect(page.getByRole('dialog',{name:'Senaryo bakiye akışı'})).toContainText('₺5.000,00');await page.getByRole('button',{name:'Anladım',exact:true}).click();
 await region(page).getByRole('button',{name:'Ana plana dön'}).click();dialog=await scenario(page);await dialog.getByRole('button',{name:'₺140 bin',exact:true}).click();await dialog.getByRole('button',{name:'Senaryoyu göster'}).click();await expect(amount(page)).toHaveText('₺2.000,00');
 await region(page).getByRole('button',{name:'Ana plana dön'}).click();await page.getByLabel('Geciken ödemeleri açığa kat').check();await expect(region(page)).toContainText('₺2.000,00 eksik');await page.getByLabel('Geciken ödemeleri açığa kat').uncheck();await expect(amount(page)).toHaveText('₺2.000,00');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(writes).toEqual([]);expect(errors).toEqual([]);
});
test('missing statement, stale balance, failed family read, and shared read-only view',async({page})=>{
 for(const query of ['missing','stale','familyError']){await page.goto(`${url}?${query}`);await expect(amount(page)).toHaveText('Henüz net değil');}
 await ready(page,`${url}?shared`);const dialog=await scenario(page);await dialog.getByLabel('Bugün ek harcama').fill('10000');await dialog.getByRole('button',{name:'Senaryoyu göster'}).click();await expect(region(page)).toContainText('En yüksek açık ₺3.000,00');await page.reload();await expect(amount(page)).toHaveText('₺2.000,00');expect(await page.getByRole('button',{name:'Kullanılabilir bakiyeyi düzenle'}).count()).toBe(0);
});
test('applied local buffer is ephemeral, valid and responsive',async({page})=>{
 await ready(page);await region(page).getByRole('button',{name:'Hesabı gör'}).click();const dialog=page.getByRole('dialog',{name:'Harcanabilir tutarın hesabı'});await dialog.getByLabel('Ek güvenlik payı').fill('-1');await dialog.getByRole('button',{name:'Bu ekranda uygula'}).click();await expect(dialog.getByRole('alert')).toBeVisible();await dialog.getByLabel('Ek güvenlik payı').fill('1000');await dialog.getByRole('button',{name:'Bu ekranda uygula'}).click();await expect(amount(page)).toHaveText('₺1.000,00');
 await page.reload();await expect(amount(page)).toHaveText('₺2.000,00');await region(page).getByRole('button',{name:'Maaşı dene'}).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('real read adapter polls membership, applies family buffer and clears conclusions on failure',async({page})=>{
 const {personalEnvironment,selectableRecords}=await import('../../src/family/environment.js');
 const {newFamily,familyBasis}=await import('../../src/family/model.js');
 const {balanceBasis,hashBalanceBasis}=await import('../../src/domain/availableBalance.js');
 const data={payments:[[1,'2026-11-05',10000],[2,'2026-11-09',8000],[3,'2026-11-21',12000],[4,'2026-11-24',106000],[5,'2026-10-31',4000]].map(([id,dueDate,amount])=>({id,dueDate,amount,title:'Örnek ödeme '+id,type:'loan',isPaid:false})),incomeSources:[{id:10,title:'Örnek maaş',type:'one-time',date:'2026-11-20',amount:120000}],expenseSources:[],products:[],subscriptionSources:[],statusTracker:{},incomeReceipts:[],subscriptionPayments:[]};
 const fingerprint=await hashBalanceBasis(balanceBasis(data));data.availableBalance={amount:25000,asOfDate:'2026-11-03',capturedAt:'fixture',basisFingerprint:fingerprint};
 const state=newFamily('read-test');state.scope=[...selectableRecords(data).map(r=>r.key),'balance'];state.policy.buffer=5000;const env=personalEnvironment(data,state.scope,fingerprint,'2026-11-03');state.policy.coverage=familyBasis(env);state._server={environment:env};let forbidden=false;const writes=[];
 await page.route('**/family-api/**',route=>{const req=route.request();if(req.method()!=='GET')writes.push(req.method());if(req.url().endsWith('/auth-config'))return route.fulfill({json:{local:true,anonKey:'synthetic-local-key'}});if(req.url().endsWith('/budgets'))return route.fulfill({json:[{id:'read-test'}]});return route.fulfill(forbidden?{status:403,json:{error:'Membership revoked'}}:{json:state});});
 await page.clock.install();await ready(page,`${url}?familyRemote`);forbidden=true;await page.clock.fastForward(5100);await expect(amount(page)).toHaveText('Henüz net değil');expect(writes).toEqual([]);
});
