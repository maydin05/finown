import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-31T12:00:00+03:00") });
});

test("mobile summary, 7/30 days, missing statement and local sample entry", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/tests/ui-preview.html");
  const region = page.getByRole("region", {
    name: "Yaklaşan ödeme ve gelir özeti",
  });
  await expect(
    region.getByRole("button", { name: "7 gün", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await region.getByRole("button", { name: "30 gün", exact: true }).click();
  await expect(
    region.getByRole("button", { name: "30 gün", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(region).toContainText("29 Kas");
  await expect(region).toContainText("1 ekstre eksik · Sonuç kesinleşmedi");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await region.getByRole("button", { name: "Ekstre tutarı gir" }).click();
  await expect(
    page.getByRole("heading", { name: "Kredi Kartı Ödemesi" }),
  ).toBeVisible();
  await page.getByRole("spinbutton").fill("5000");
  await page.getByRole("button", { name: "Bilgileri Kaydet" }).click();
  await expect(region.getByText("₺6.000,00", { exact: true })).toBeVisible();
  await expect(region.getByText("+₺9.000,00", { exact: true })).toBeVisible();
  await expect(region).not.toContainText("tutarı eksik");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("monthly expense page keeps its tabs and rows usable on mobile", async ({
  page,
}) => {
  await page.goto("/tests/ui-preview.html?full=1");
  await expect(
    page.getByRole("heading", { name: "Kasım", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ödenmişler", exact: true }).click();
  await expect(
    page.getByText("Kayıt bulunamadı.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ödenecekler", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Örnek taksit", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("approved home layout supports details, status, statement entry and keyboard dialog controls", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/tests/ui-preview.html?app=1");
  await expect(
    page.getByRole("heading", { name: "Özet" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Kasım", exact: true }),
  ).toHaveCount(0);
  const region = page.getByRole("region", {
    name: "Yaklaşan ödeme ve gelir özeti",
  });
  await region.getByRole("button", { name: "30 gün", exact: true }).click();
  await expect(region).toContainText("29 Kas");
  await region.getByRole("button", { name: "7 gün", exact: true }).click();
  const info = region.getByRole("button", {
    name: "Dönem farkı hakkında bilgi",
  });
  await info.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "Anladım", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(info).toBeFocused();
  await region.getByRole("button", { name: "Gelirler", exact: true }).click();
  await region.getByRole("button", { name: "Örnek gelir ayrıntısı" }).click();
  await page.getByRole("button", { name: "Alındı olarak işaretle" }).click();
  await page.getByRole("button", { name: "Alınan tutarı kaydet", exact: true }).click();
  await expect(page.getByTestId("expected-income")).toHaveText("₺0,00");
  await expect(region).toContainText("Bu aralıkta bekleyen gelir yok.");
  await region.getByRole("button", { name: "Ekstre tutarı gir" }).click();
  await page.getByRole("spinbutton").fill("5000");
  await page.getByRole("button", { name: "Bilgileri Kaydet" }).click();
  await expect(page.getByTestId("known-payments")).toHaveText("₺8.500,00");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("all simplified pages retain navigation, record actions, bank details and quick menu", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("https://api.exchangerate-api.com/**", (route) =>
    route.fulfill({ json: { rates: { TRY: 40 } } }),
  );
  await page.goto("/tests/ui-preview.html?app=1");
  const nav = page.getByRole("navigation", { name: "Ana gezinme" });
  const noOverflow = async () =>
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  await nav.getByRole("button", { name: "Ödemeler", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Ödemeler", exact: true }),
  ).toBeVisible();
  await noOverflow();
  await page.getByRole("button", { name: "Örnek taksit ayrıntısı" }).click();
  await expect(
    page.getByRole("button", { name: "Sil", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Düzenle", exact: true }).click();
  await expect(page.getByTestId("last-action")).toHaveText("card_amount");
  await page.getByRole("button", { name: "Bilgileri Kaydet" }).click();
  await nav.getByRole("button", { name: "Gelir", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Gelirler", exact: true }),
  ).toBeVisible();
  await noOverflow();
  await page.getByRole("button", { name: "Örnek gelir ayrıntısı" }).click();
  await page.getByRole("button", { name: "Notlarım", exact: true }).click();
  await expect(page.getByTestId("last-action")).toHaveText("note");
  await nav.getByRole("button", { name: "Abonelik", exact: true }).click();
  await noOverflow();
  await page
    .getByRole("button", { name: "Örnek kart aboneliği ayrıntısı" })
    .click();
  await page
    .getByRole("button", { name: "Aboneliği düzenle", exact: true })
    .click();
  await expect(page.getByTestId("last-action")).toHaveText("subscription");
  await nav.getByRole("button", { name: "Bankalar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Bankalarım", exact: true }),
  ).toBeVisible();
  await noOverflow();
  await page
    .getByRole("button", { name: "Avantajlı kartlar", exact: true })
    .click();
  const cards = page.getByRole("dialog", {
    name: "Avantajlı kartlar",
    exact: true,
  });
  await expect(
    cards.getByRole("region", { name: "En uzun vadeli kart" }),
  ).toContainText("Örnek kart");
  await expect(cards).toContainText("kullanılabilir limit değildir");
  await noOverflow();
  await cards.getByRole("button", { name: "Tamam", exact: true }).click();
  await page.getByRole("button", { name: "Örnek Banka ayrıntısı" }).click();
  await expect(
    page.getByRole("heading", { name: "Örnek Banka", exact: true }),
  ).toBeVisible();
  await noOverflow();
  await page.getByRole("button", { name: "Örnek kart ayrıntısı" }).click();
  await expect(page.getByText("Kart limiti", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Kapat", exact: true }).click();
  await page.getByRole("button", { name: "Tüm bankalar", exact: true }).click();
  await page
    .getByRole("button", { name: "Yeni kayıt ekle", exact: true })
    .click();
  await page.getByRole("button", { name: "Gelir ekle", exact: true }).click();
  await expect(page.getByTestId("last-action")).toHaveText("income");
  await nav.getByRole("button", { name: "Özet", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Özet" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("month reset and due filters show actual next-week payments across a month boundary", async ({
  page,
}) => {
  await page.goto("/tests/ui-preview.html?app=1");
  const nav = page.getByRole("navigation", { name: "Ana gezinme" });
  await nav.getByRole("button", { name: "Ödemeler", exact: true }).click();
  await page.getByRole("button", { name: "Sonraki ay", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Aralık", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Bu aya dön", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Ekim", exact: true }),
  ).toBeVisible();
  const filters = page.getByRole("group", { name: "Vade filtresi" });
  await filters.getByRole("button", { name: "7 gün", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Örnek taksit", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Ekstre tutarı girilmedi", { exact: true }),
  ).toBeVisible();
  await filters.getByRole("button", { name: "Bugün", exact: true }).click();
  await expect(
    page.getByText("Kayıt bulunamadı.", { exact: true }),
  ).toBeVisible();
  await filters.getByRole("button", { name: "Geciken", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Örnek kira", exact: true }),
  ).toBeVisible();
  await nav.getByRole("button", { name: "Gelir", exact: true }).click();
  await page.getByRole("button", { name: "Sonraki ay", exact: true }).click();
  await page.getByRole("button", { name: "Bu aya dön", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Ekim", exact: true }),
  ).toBeVisible();
  await nav.getByRole("button", { name: "Abonelik", exact: true }).click();
  await page.getByRole("button", { name: "Sonraki ay", exact: true }).click();
  await page.getByRole("button", { name: "Bu aya dön", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Ekim", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("one linked TL expense plan updates remaining debt without a second payment source or USD conversion", async ({
  page,
}) => {
  await page.goto("/tests/ui-preview.html?app=1");
  const nav = page.getByRole("navigation", { name: "Ana gezinme" });
  await nav.getByRole("button", { name: "Bankalar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Elden borçlar", exact: true }),
  ).toBeVisible();
  const summary = page.getByRole("region", { name: "Banka özeti" });
  await expect(summary.getByText("₺33.500,00", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Örnek kira ayrıntısı", exact: true }),
  ).toHaveCount(1);
  await expect(page.locator("body")).not.toContainText("USD");
  await nav.getByRole("button", { name: "Ödemeler", exact: true }).click();
  await page
    .getByRole("button", { name: "Örnek kira ayrıntısı", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ödendi olarak işaretle", exact: true })
    .click();
  await nav.getByRole("button", { name: "Bankalar", exact: true }).click();
  await expect(summary.getByText("₺31.000,00", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Örnek kira ayrıntısı", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("₺30.000,00");
  await page.getByRole("button", { name: "Kapat", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("compact home shows two upcoming payments above navigation on a short mobile screen", async ({ page }) => {
  await page.setViewportSize({ width: page.viewportSize().width, height: 667 });
  await page.goto('/tests/ui-preview.html?app=1');
  const summary = page.getByRole('region', { name: 'Yaklaşan ödeme ve gelir özeti' });
  await expect(summary.getByRole('heading', { name: 'Özet', exact: true })).toBeVisible();
  await expect(summary.getByRole('heading', { name: 'Yaklaşan ödemeler', exact: true })).toBeVisible();
  await expect(summary.getByRole('button', { name: 'Ödemeler', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const geometry = await page.evaluate(() => {
    const navTop = document.querySelector('.bottom-nav').getBoundingClientRect().top;
    return {
      noOverflow: document.documentElement.scrollWidth <= innerWidth,
      twoRowsVisible: [...document.querySelectorAll('.movement-row')].slice(0, 2).length === 2 && [...document.querySelectorAll('.movement-row')].slice(0, 2).every(row => row.getBoundingClientRect().bottom <= navTop),
      summaryBottom: document.querySelector('.summary-card').getBoundingClientRect().bottom,
    };
  });
  expect(geometry.noOverflow).toBe(true);
  expect(geometry.twoRowsVisible).toBe(true);
  expect(geometry.summaryBottom).toBeLessThan(365);
  await expect(summary).toContainText('Tahmini · Ekstre eksik');
  const summaryText = await summary.getByTestId('period-difference').textContent();
  await summary.getByRole('button', { name: 'Gelirler', exact: true }).click();
  await expect(summary.getByRole('button', { name: 'Örnek gelir ayrıntısı' })).toBeVisible();
  await expect(summary.getByTestId('period-difference')).toHaveText(summaryText);
  await summary.getByRole('button', { name: 'Ekstre tutarı gir', exact: true }).click();
  await page.getByRole('button', { name: 'Vazgeç', exact: true }).click();
  await expect(summary).toContainText('Sonuç kesinleşmedi');
  await expect(summary.getByTestId('period-difference')).toHaveText(summaryText);
});

test("arrival preparation separates pending dates, unknown statements and same-day payments without saving", async ({ page }) => {
  await page.goto('/tests/ui-preview.html?app=1&bridge=late');
  const summary = page.getByRole('region', { name: 'Yaklaşan ödeme ve gelir özeti' });
  const card = summary.getByRole('button', { name: 'Bakiye ve ödeme açığının ayrıntısı', exact: true });
  await expect(card).toContainText('Önce bakiyeni gir');
  await expect(card).toContainText('En az ₺3.500,00 ödeme');
  const difference = await summary.getByTestId('period-difference').textContent();
  await card.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeFocused();
  await expect(dialog).toContainText('kesin açık göstermiyoruz');
  await expect(dialog).toContainText('boş bakiye sıfır varsayılmadı');
  await expect(dialog).toContainText('1 ödeme tutarı eksik');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(card).toBeFocused();
  await expect(summary.getByTestId('period-difference')).toHaveText(difference);
  await summary.getByRole('button', { name: 'Ekstre tutarı gir', exact: true }).click();
  await page.getByRole('button', { name: 'Vazgeç', exact: true }).click();
  await expect(card).toContainText('Önce bakiyeni gir');
  await summary.getByRole('button', { name: '30 gün', exact: true }).click();
  await expect(card).toContainText('Önce bakiyeni gir');

  await page.goto('/tests/ui-preview.html?app=1&bridge=same-day');
  await expect(card).toContainText('₺3.500,00 ödeme');
  await card.click();
  await expect(dialog).toContainText('saat sırası bilinmediğinden');
  await page.getByRole('button', { name: 'Anladım', exact: true }).click();
  await page.goto('/tests/ui-preview.html?app=1&bridge=none');
  await expect(page.getByRole('region',{name:'Bakiye ve ödeme açığı',exact:true})).toContainText('7 günlük bakiye akışı');
  await expect(card).toContainText('En az ₺3.500,00');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('manual balance calculates gaps, preserves cancel/failed validation and becomes stale after a received-income change', async ({ page }) => {
  await page.goto('/tests/ui-preview.html?app=1');
  const summary=page.getByRole('region',{name:'Yaklaşan ödeme ve gelir özeti'});
  const card=summary.getByRole('button',{name:'Bakiye ve ödeme açığının ayrıntısı',exact:true});
  const edit=summary.getByRole('button',{name:'Kullanılabilir bakiyeyi düzenle',exact:true});
  await expect(card).toContainText('Önce bakiyeni gir');
  const period=await summary.getByTestId('period-difference').textContent();
  await edit.click();
  await page.getByLabel('Kullanılabilir para (₺)',{exact:true}).fill('400');
  await page.getByRole('button',{name:'Bakiyeyi kaydet',exact:true}).click();
  await expect(card).toContainText('₺600,00');
  await expect(summary.getByTestId('period-difference')).toHaveText(period);
  await edit.click();
  await page.getByLabel('Kullanılabilir para (₺)',{exact:true}).fill('5000');
  await page.getByRole('button',{name:'Vazgeç',exact:true}).click();
  await expect(card).toContainText('₺600,00');
  await edit.click();
  await page.getByLabel('Kullanılabilir para (₺)',{exact:true}).fill('');
  await page.getByRole('button',{name:'Bakiyeyi kaydet',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Boş bakiye sıfır sayılmaz');
  await page.getByLabel('Kullanılabilir para (₺)',{exact:true}).fill('0');
  await page.getByRole('button',{name:'Bakiyeyi kaydet',exact:true}).click();
  await expect(card).toContainText('₺1.000,00');
  await edit.click();
  await page.getByLabel('Kullanılabilir para (₺)',{exact:true}).fill('5000');
  await page.getByLabel('Bakiyenin geçerli olduğu gün',{exact:true}).fill('2026-10-30');
  await page.getByRole('button',{name:'Bakiyeyi kaydet',exact:true}).click();
  await expect(card).toContainText('Bakiye güncel değil');
  await edit.click();
  await page.getByRole('button',{name:'Bakiyeyi kaydet',exact:true}).click();
  await expect(card).toContainText('Açık henüz netleşmedi');
  await summary.getByRole('button',{name:'Gelirler',exact:true}).click();
  await summary.getByRole('button',{name:'Örnek gelir ayrıntısı',exact:true}).click();
  await page.getByRole('button',{name:'Alındı olarak işaretle',exact:true}).click();
  await page.getByRole('button',{name:'Alınan tutarı kaydet',exact:true}).click();
  await expect(card).toContainText('Bakiyeni yeniden doğrula');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('failed balance save preserves the previous snapshot and same-day/unknown obligations never get a false guarantee', async ({ page }) => {
  await page.goto('/tests/ui-preview.html?app=1&balanceFail=1');
  const summary=page.getByRole('region',{name:'Yaklaşan ödeme ve gelir özeti'});
  const card=summary.getByRole('button',{name:'Bakiye ve ödeme açığının ayrıntısı',exact:true});
  const edit=summary.getByRole('button',{name:'Kullanılabilir bakiyeyi düzenle',exact:true});
  await edit.click();await page.getByLabel('Kullanılabilir para (₺)',{exact:true}).fill('400');
  await page.getByRole('button',{name:'Bakiyeyi kaydet',exact:true}).click();await expect(card).toContainText('₺600,00');
  await edit.click();await page.getByLabel('Kullanılabilir para (₺)',{exact:true}).fill('5000');
  await page.getByRole('button',{name:'Bakiyeyi kaydet',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Kaydedilemedi');
  await page.getByRole('button',{name:'Vazgeç',exact:true}).click();await expect(card).toContainText('₺600,00');
  await page.goto('/tests/ui-preview.html?app=1&bridge=same-day');
  await edit.click();await page.getByLabel('Kullanılabilir para (₺)',{exact:true}).fill('2000');
  await page.getByRole('button',{name:'Bakiyeyi kaydet',exact:true}).click();
  await expect(card).toContainText('₺1.500,00');await expect(card).toContainText('Ödemeler gelirden önce çekilirse');
  await page.goto('/tests/ui-preview.html?app=1&bridge=none');
  await edit.click();await page.getByLabel('Kullanılabilir para (₺)',{exact:true}).fill('5000');
  await page.getByRole('button',{name:'Bakiyeyi kaydet',exact:true}).click();
  await expect(card).toContainText('Açık henüz netleşmedi');
  await edit.click();await page.getByLabel('Kaydedilmiş bakiyeyi kullanma',{exact:true}).check();
  await page.getByRole('button',{name:'Bakiyeyi kullanma',exact:true}).click();
  await expect(card).toContainText('Önce bakiyeni gir');
});

test('compact monthly pages keep summaries, month controls and first records within a short mobile screen', async ({ page }) => {
  await page.setViewportSize({ width: page.viewportSize().width, height: 667 });
  await page.goto('/tests/ui-preview.html?app=1');
  const nav = page.getByRole('navigation', { name: 'Ana gezinme' });
  for (const name of ['Ödemeler', 'Gelir', 'Abonelik', 'Bankalar']) {
    await nav.getByRole('button', { name, exact: true }).click();
    await expect(page.locator('.compact-list-page')).toBeVisible();
    const layout = await page.evaluate(() => {
      const content = document.querySelector('.compact-list-page');
      const first = content.querySelector('.record-row');
      const bottom = document.querySelector('.bottom-nav').getBoundingClientRect().top;
      return {
        noOverflow: document.documentElement.scrollWidth <= innerWidth,
        summaryHeight: content.querySelector('.monthly-summary').getBoundingClientRect().height,
        firstRecordTop: first.getBoundingClientRect().top,
        firstRecordVisible: first.getBoundingClientRect().bottom <= bottom,
        compactHeader: document.querySelector('.app-header').getBoundingClientRect().height <= 60,
      };
    });
    expect(layout.noOverflow, name).toBe(true);
    expect(layout.summaryHeight, name).toBeLessThan(155);
    expect(layout.firstRecordTop, name).toBeLessThan(410);
    expect(layout.firstRecordVisible, name).toBe(true);
    expect(layout.compactHeader, name).toBe(true);
    if (name !== 'Bankalar') {
      await expect(page.getByRole('heading', { name: 'Kasım', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Sonraki ay', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Aralık', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Önceki ay', exact: true }).click();
    } else {
      await expect(page.getByRole('button', { name: 'Örnek Banka ayrıntısı' })).toBeVisible();
      await page.getByText('Elden borç planı ayrıntısı', { exact: true }).click();
      await expect(page.getByText('Kart borcu bu toplamın kapsamında değil.')).toBeVisible();
    }
  }
});

test('salary actual amounts belong only to the selected month and can be corrected or undone without editing the plan', async ({ page }) => {
  await page.setViewportSize({width:page.viewportSize().width,height:667});
  await page.goto('/tests/ui-preview.html?app=1&salary=1');
  await page.getByRole('navigation',{name:'Ana gezinme'}).getByRole('button',{name:'Gelir',exact:true}).click();
  const summary=page.getByRole('region',{name:'Gelirler aylık özeti'});
  await expect(summary).toContainText('₺120.000,00');
  await page.getByRole('button',{name:'Örnek gelir ayrıntısı'}).click();
  await page.getByRole('button',{name:'Alındı olarak işaretle',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('Kasım 2026');
  await page.getByLabel('Alınan tutar (₺)',{exact:true}).fill('115000');
  await page.getByRole('button',{name:'Vazgeç',exact:true}).click();
  await expect(summary).toContainText('₺120.000,00');
  await page.getByRole('button',{name:'Örnek gelir ayrıntısı'}).click();
  await page.getByRole('button',{name:'Alındı olarak işaretle',exact:true}).click();
  await page.getByLabel('Alınan tutar (₺)',{exact:true}).fill('115000');
  await page.getByLabel('Kesinti / ek mesai notu (isteğe bağlı)',{exact:true}).fill('Kesinti');
  await page.getByRole('button',{name:'Alınan tutarı kaydet',exact:true}).click();
  await expect(summary).toContainText('₺115.000,00');
  await expect(page.getByRole('button',{name:'Alınan',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Sonraki ay',exact:true}).click();
  await expect(summary).toContainText('₺120.000,00');
  await page.getByRole('button',{name:'Önceki ay',exact:true}).click();
  await page.getByRole('button',{name:'Alınan',exact:true}).click();
  await page.getByRole('button',{name:'Örnek gelir ayrıntısı'}).click();
  await expect(page.getByRole('dialog')).toContainText('Planlanan: ₺120.000,00');
  await expect(page.getByRole('dialog')).toContainText('Gerçek alınan: ₺115.000,00');
  await page.getByRole('button',{name:'Bu ay alınan tutarı düzenle',exact:true}).click();
  await page.getByLabel('Alınan tutar (₺)',{exact:true}).fill('140000');
  await page.getByRole('button',{name:'Bu ayın tutarını kaydet',exact:true}).click();
  await expect(summary).toContainText('₺140.000,00');
  await page.getByRole('button',{name:'Örnek gelir ayrıntısı'}).click();
  await page.getByRole('button',{name:'Alındı işaretini geri al',exact:true}).click();
  await page.getByRole('button',{name:'Beklenen',exact:true}).click();
  await expect(summary).toContainText('₺120.000,00');
  await page.getByRole('button',{name:'Örnek gelir ayrıntısı'}).click();
  await page.getByRole('button',{name:'Gelir planını düzenle',exact:true}).click();
  await expect(page.getByTestId('last-action')).toHaveText('income');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('salary receipt validation and failed save keep the expected income unchanged', async ({page}) => {
  await page.goto('/tests/ui-preview.html?app=1&salary=1&incomeFail=1');
  const summary=page.getByRole('region',{name:'Yaklaşan ödeme ve gelir özeti'});
  await summary.getByRole('button',{name:'Gelirler',exact:true}).click();
  await page.getByRole('button',{name:'Örnek gelir ayrıntısı'}).click();
  await page.getByRole('button',{name:'Alındı olarak işaretle',exact:true}).click();
  await page.getByLabel('Alınan tutar (₺)',{exact:true}).fill('');
  await page.getByRole('button',{name:'Alınan tutarı kaydet',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Alınan tutarı');
  await page.getByLabel('Alınan tutar (₺)',{exact:true}).fill('115000');
  await page.getByRole('button',{name:'Alınan tutarı kaydet',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Kaydedilemedi');
  await page.getByRole('button',{name:'Vazgeç',exact:true}).click();
  await expect(page.getByTestId('expected-income')).toHaveText('₺120.000,00');
});

test('date-ordered flow reveals a later gap, toggles recorded arrears without changing period totals or source dates', async ({page}) => {
  await page.clock.setFixedTime(new Date('2026-11-01T12:00:00+03:00'));
  await page.setViewportSize({width:page.viewportSize().width,height:667});
  await page.goto('/tests/ui-preview.html?app=1&flow=timing');
  const summary=page.getByRole('region',{name:'Yaklaşan ödeme ve gelir özeti'});
  const card=page.getByRole('button',{name:'Bakiye ve ödeme açığının ayrıntısı',exact:true});
  await summary.getByRole('button',{name:'30 gün',exact:true}).click();
  await page.getByRole('button',{name:'Kullanılabilir bakiyeyi düzenle',exact:true}).click();
  await page.getByLabel('Kullanılabilir para (₺)',{exact:true}).fill('5000');
  await page.getByRole('button',{name:'Bakiyeyi kaydet',exact:true}).click();
  await expect(card).toContainText('10 Kas');await expect(card).toContainText('₺3.000,00 açık');
  expect(await page.evaluate(()=>[...document.querySelectorAll('.movement-row')].slice(0,2).every(r=>r.getBoundingClientRect().bottom<=document.querySelector('.bottom-nav').getBoundingClientRect().top))).toBe(true);
  const period=await page.getByTestId('period-difference').textContent();
  await card.click();const dialog=page.getByRole('dialog');
  await expect(dialog).toContainText('En yüksek ödeme açığı');await expect(dialog).toContainText('+₺7.000,00');
  await dialog.getByRole('button',{name:/10 Kas Örnek ödeme 9103/}).click();
  await expect(dialog).toContainText('Başlangıç: +₺22.000,00');await expect(dialog).toContainText('Gün sonu: −₺3.000,00');
  await page.getByRole('button',{name:'Kapat',exact:true}).click();
  await page.getByLabel('Geciken ödemeleri açığa kat',{exact:true}).check();
  await expect(card).toContainText('2 Kas');await expect(card).toContainText('₺2.000,00');
  await expect(page.getByTestId('period-difference')).toHaveText(period);
  await card.click();await expect(dialog).toContainText('₺7.000,00');await expect(dialog).toContainText('Asıl vade: 31 Ekim');
  await page.getByRole('button',{name:'Kapat',exact:true}).click();
  await page.getByLabel('Geciken ödemeleri açığa kat',{exact:true}).uncheck();
  await expect(card).toContainText('10 Kas');await expect(card).not.toContainText('Bakiyeni yeniden doğrula');
  await summary.getByRole('button',{name:'7 gün',exact:true}).click();await expect(card).toContainText('7 günde açık görünmüyor');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('recorded overdue inclusion changes coverage and missing statements never become a no-gap guarantee', async ({page})=>{
  await page.clock.setFixedTime(new Date('2026-11-01T12:00:00+03:00'));
  await page.goto('/tests/ui-preview.html?app=1&flow=overdue');
  const card=page.getByRole('button',{name:'Bakiye ve ödeme açığının ayrıntısı',exact:true});
  const save=async amount=>{await page.getByRole('button',{name:'Kullanılabilir bakiyeyi düzenle',exact:true}).click();await page.getByLabel('Kullanılabilir para (₺)',{exact:true}).fill(amount);await page.getByRole('button',{name:'Bakiyeyi kaydet',exact:true}).click();};
  await page.getByRole('button',{name:'30 gün',exact:true}).click();await save('12000');
  await expect(card).toContainText('30 günde açık görünmüyor');await page.getByLabel('Geciken ödemeleri açığa kat',{exact:true}).check();
  await expect(card).toContainText('12 Kas');await expect(card).toContainText('₺2.000,00');
  await page.goto('/tests/ui-preview.html?app=1&flow=missing');await page.getByRole('button',{name:'30 gün',exact:true}).click();await save('50000');
  await expect(card).toContainText('Açık henüz netleşmedi');await card.click();await expect(page.getByRole('dialog')).toContainText('1 ödeme tutarı eksik');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});


test('current month hides reset; other months show it on the title row across monthly pages', async ({page}) => {
  await page.clock.setFixedTime(new Date('2026-11-03T12:00:00+03:00'));
  await page.goto('/tests/ui-preview.html?app=1');
  const nav=page.getByRole('navigation',{name:'Ana gezinme'});
  for(const name of ['Ödemeler','Gelir','Abonelik']) {
    await nav.getByRole('button',{name,exact:true}).click();
    const reset=page.getByRole('button',{name:'Bu aya dön',exact:true});
    await expect(reset).toHaveCount(0);
    await page.getByRole('button',{name:'Sonraki ay',exact:true}).click();
    await expect(reset).toBeVisible();
    const title=await page.locator('.compact-month-heading h1').boundingBox(),button=await reset.boundingBox();
    expect(Math.abs((title.y+title.height/2)-(button.y+button.height/2))).toBeLessThan(5);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await reset.click();await expect(page.getByRole('heading',{name:'Kasım',exact:true})).toBeVisible();await expect(reset).toHaveCount(0);
  }
});
