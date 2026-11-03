import {test,expect} from '@playwright/test';
test('ilk ekstre ayı: Ekim boş satırı yok, üç kayıt aynen kalır; kısmi seçim, iptal ve temizleme',async({page},info)=>{
 const requests=[],errors=[];page.on('request',r=>requests.push(r));page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/tests/card-statements-preview.html');expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(info.project.use.viewport.width);const initial=await page.getByTestId('original-payments').textContent();
 await expect(page.getByRole('heading',{name:'Ekim',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Bankkart Gold Troy ayrıntısı',exact:true})).toHaveCount(0);
 const open=()=>page.getByRole('button',{name:'İlk ekstre ayını düzenle',exact:true}).click();
 await open();await expect(page.getByLabel('İlk ekstre yılı',{exact:true})).toHaveValue('2026');await expect(page.getByLabel('İlk ekstre ayı',{exact:true})).toHaveValue('11');
 await page.getByRole('button',{name:'Başlangıç ayını kaldır',exact:true}).click();await page.getByRole('button',{name:'Vazgeç',exact:true}).click();await expect(page.getByTestId('card-start')).toHaveText('2026-11-01');
 await open();await page.getByRole('button',{name:'Başlangıç ayını kaldır',exact:true}).click();await page.getByLabel('İlk ekstre yılı',{exact:true}).selectOption('2026');await page.getByRole('button',{name:'Kaydet',exact:true}).click();await expect(page.getByRole('alert')).toContainText('yıl ve ayı birlikte');
 await page.getByLabel('İlk ekstre ayı',{exact:true}).selectOption('12');await page.getByRole('button',{name:'Kaydet',exact:true}).click();await expect(page.getByTestId('card-start')).toHaveText('2026-12-01');
 // Even before a moved start, an already recorded November payment must remain visible.
 await page.getByRole('button',{name:'Sonraki ay',exact:true}).click();await expect(page.getByRole('button',{name:'Bankkart Gold Troy ayrıntısı',exact:true})).toContainText('₺1.250,00');
 await page.getByRole('button',{name:'Sonraki ay',exact:true}).click();await page.getByRole('button',{name:'Ödenmişler',exact:true}).click();await expect(page.getByRole('button',{name:'Bankkart Gold Troy ayrıntısı',exact:true})).toContainText('₺1.350,00');
 await page.getByRole('button',{name:'Sonraki ay',exact:true}).click();await page.getByRole('button',{name:'Ödenecekler',exact:true}).click();await expect(page.getByRole('button',{name:'Bankkart Gold Troy ayrıntısı',exact:true})).toContainText('₺1.450,00');
 await page.getByRole('button',{name:'Sonraki ay',exact:true}).click();await expect(page.getByRole('button',{name:'Bankkart Gold Troy ayrıntısı',exact:true})).toContainText('Ekstre bekleniyor');
 for(let i=0;i<4;i++)await page.getByRole('button',{name:'Önceki ay',exact:true}).click();await expect(page.getByRole('button',{name:'Bankkart Gold Troy ayrıntısı',exact:true})).toHaveCount(0);
 await open();await page.getByLabel('İlk ekstre ayı',{exact:true}).selectOption('11');await page.getByRole('button',{name:'Kaydet',exact:true}).click();
 const nav=page.getByRole('navigation',{name:'Önizleme ekranı'});await nav.getByRole('button',{name:'Ekim özeti',exact:true}).click();await page.getByRole('button',{name:'30 gün',exact:true}).click();await expect(page.getByText('1 ekstre eksik · Sonuç kesinleşmedi',{exact:true})).toHaveCount(0);
 await nav.getByRole('button',{name:'Bankalar',exact:true}).click();await page.getByRole('button',{name:'Ziraat Bankası ayrıntısı',exact:true}).click();await page.getByRole('button',{name:'Bankkart Gold Troy ayrıntısı',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Kasım 2026');await page.getByRole('button',{name:'Kapat',exact:true}).click();
 await nav.getByRole('button',{name:'Ödemeler',exact:true}).click();await open();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(info.project.use.viewport.width===375)await page.screenshot({path:'/tmp/finown-first-statement-form.png',fullPage:false});
 await page.getByRole('button',{name:'Başlangıç ayını kaldır',exact:true}).click();await page.getByRole('button',{name:'Kaydet',exact:true}).click();await expect(page.getByRole('button',{name:'Bankkart Gold Troy ayrıntısı',exact:true})).toContainText('Ekstre bekleniyor');
 await expect(page.getByTestId('original-payments')).toHaveText(initial);expect(requests.filter(r=>r.method()!=='GET' || !['127.0.0.1','localhost'].includes(new URL(r.url()).hostname))).toEqual([]);expect(errors).toEqual([]);
});
test('ilk ekstre ayından önceki gerçek ödeme görünür kalır',async({page})=>{
 await page.goto('/tests/card-statements-preview.html?prior=1');await expect(page.getByRole('button',{name:'Örnek geçmiş ödeme ayrıntısı',exact:true})).toContainText('₺500,00');await expect(page.getByRole('button',{name:'Bankkart Gold Troy ayrıntısı',exact:true})).toHaveCount(0);
});
