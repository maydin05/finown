import {test,expect} from '@playwright/test';
test('banka kimliği: yerel logolar, gerçek ilişki, dar mobil satırlar ve görsel yükleme hatası',async({page},info)=>{
 const requests=[],errors=[];
 page.on('request',r=>requests.push({host:new URL(r.url()).hostname,path:new URL(r.url()).pathname,method:r.method()}));page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/tests/bank-logos-preview.html');
 const logos=page.locator('.record-list .bank-logo img');await expect(logos).toHaveCount(9);
 await expect.poll(()=>logos.evaluateAll(images=>images.every(img=>img.complete && img.naturalWidth>0))).toBe(true);
 const ziraat=page.getByRole('button',{name:'Bankkart Gold Troy ayrıntısı',exact:true});await expect(ziraat).toContainText('Ziraat Bankası');await expect(ziraat).toContainText('₺1.550,00');
 const unknown=page.getByRole('button',{name:'Ziraat adı geçen bağlantısız ödeme ayrıntısı',exact:true});await expect(unknown.locator('img')).toHaveCount(0);await expect(unknown).not.toContainText('Ziraat Bankası');
 await ziraat.click();await expect(page.getByRole('dialog')).toContainText('Ziraat Bankası');await expect(page.getByRole('dialog').getByRole('button',{name:/Sil|Düzenle|işaretle|Kaydet/})).toHaveCount(0);await page.getByRole('button',{name:'Kapat',exact:true}).click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(info.project.use.viewport.width===375)await page.screenshot({path:'/tmp/finown-bank-logos-mobile.png',fullPage:false});
 await page.getByRole('button',{name:'Özet',exact:true}).click();await expect(page.locator('.cashflow .bank-logo img')).toHaveCount(3);await expect(page.getByRole('button',{name:'Bankkart Gold Troy ayrıntısı',exact:true})).toHaveCount(0);await page.getByRole('button',{name:'8 hareket daha',exact:true}).click();await expect(page.getByRole('button',{name:'Bankkart Gold Troy ayrıntısı',exact:true})).toContainText('Ziraat Bankası');
 await page.route('**/banks/ziraat.ico',route=>route.fulfill({status:404,body:''}));await page.reload();await expect(ziraat.locator('img')).toHaveCount(0);await expect(ziraat).toContainText('Ziraat Bankası');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(requests.filter(r=>r.method!=='GET' || !['127.0.0.1','localhost'].includes(r.host))).toEqual([]);expect(errors).toEqual([]);
});
