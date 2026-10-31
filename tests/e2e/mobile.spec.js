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
  await expect(region).toContainText("29 Kasım");
  await expect(region).toContainText("1 kart ekstresinin tutarı eksik");
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
    page.getByRole("heading", { name: "Finansal özetin" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Kasım", exact: true }),
  ).toHaveCount(0);
  const region = page.getByRole("region", {
    name: "Yaklaşan ödeme ve gelir özeti",
  });
  await region.getByRole("button", { name: "30 gün", exact: true }).click();
  await expect(region).toContainText("29 Kasım");
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
    page.getByRole("heading", { name: "Finansal özetin" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
