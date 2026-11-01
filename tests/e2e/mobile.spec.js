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
  const card = summary.getByRole('button', { name: 'Gelirden önceki ödemelerin ayrıntısı', exact: true });
  await expect(card).toContainText('En az ₺3.500,00');
  await expect(card).toContainText('1 ödeme tutarı eksik');
  const difference = await summary.getByTestId('period-difference').textContent();
  await card.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeFocused();
  await expect(dialog).toContainText('Bu kesin nakit açığın değil.');
  await expect(dialog).toContainText('Mevcut bakiyen bilinmiyor.');
  await expect(dialog).toContainText('alt sınırdır');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(card).toBeFocused();
  await expect(summary.getByTestId('period-difference')).toHaveText(difference);
  await summary.getByRole('button', { name: 'Ekstre tutarı gir', exact: true }).click();
  await page.getByRole('button', { name: 'Vazgeç', exact: true }).click();
  await expect(card).toContainText('En az ₺3.500,00');
  await summary.getByRole('button', { name: '30 gün', exact: true }).click();
  await expect(card).toContainText('En az ₺3.500,00');

  await page.goto('/tests/ui-preview.html?app=1&bridge=same-day');
  await expect(card).toContainText('₺1.000,00');
  await expect(card).toContainText('Gelir günü ₺2.500,00 ödeme');
  await card.click();
  await expect(dialog).toContainText('hesaba geçiş saati bilinmediğinden');
  await page.getByRole('button', { name: 'Anladım', exact: true }).click();
  await page.goto('/tests/ui-preview.html?app=1&bridge=none');
  await expect(card).toContainText('Seçili aralıkta gelir görünmüyor');
  await expect(card).toContainText('En az ₺3.500,00');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
