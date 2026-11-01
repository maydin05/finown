import { test, expect } from "@playwright/test";
const noOverflow = async (page) =>
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
test("login and signup retain usable fields and password visibility without auth requests", async ({
  page,
}) => {
  const authRequests = [];
  await page.route("**/auth/v1/**", (route) => {
    authRequests.push(route.request().url());
    return route.abort();
  });
  await page.goto("/tests/forms-preview.html?screen=login");
  await expect(
    page.getByRole("heading", { name: "FinOwn", exact: true }),
  ).toBeVisible();
  await page.getByLabel("E-posta", { exact: true }).fill("example@example.com");
  await page.getByLabel("Şifre", { exact: true }).fill("example-password");
  await page
    .getByRole("button", { name: "Şifreyi göster", exact: true })
    .click();
  await expect(page.getByLabel("Şifre", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page
    .getByRole("button", { name: "Hesap oluştur", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Kayıt Ol", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Şifre", { exact: true })).toHaveAttribute(
    "autocomplete",
    "new-password",
  );
  await noOverflow(page);
  expect(authRequests).toEqual([]);
});
test("source forms keep typing focus, edit scope, subscription fields and accessible save actions", async ({
  page,
}) => {
  await page.goto("/tests/forms-preview.html");
  await page
    .getByRole("button", { name: "Gider düzenle", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Gider Düzenle",
    exact: true,
  });
  await dialog.getByLabel("Başlık", { exact: true }).fill("");
  await dialog
    .getByLabel("Başlık", { exact: true })
    .pressSequentially("Yeni örnek gider");
  await expect(dialog.getByLabel("Başlık", { exact: true })).toBeFocused();
  await dialog.getByRole("button", { name: "Gelecek", exact: true }).click();
  await dialog.getByLabel("Değişikliğin Başlangıç Tarihi").fill("2027-01-06");
  await expect(
    dialog.getByRole("button", { name: "Kaydet", exact: true }),
  ).toBeInViewport();
  await noOverflow(page);
  await dialog.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByTestId("saved-data")).toContainText(
    "Yeni örnek gider",
  );
  await expect(page.getByTestId("saved-data")).toContainText("2027-01-06");
  await page
    .getByRole("button", { name: "Abonelik ekle", exact: true })
    .click();
  const sub = page.getByRole("dialog");
  await sub
    .getByRole("button", { name: "Değişken Fatura", exact: true })
    .click();
  await sub.getByRole("button", { name: "Yıllık", exact: true }).click();
  await sub.getByLabel("Ödeme Değeri", { exact: true }).selectOption("1");
  await sub
    .getByLabel("Bağlı Kart (Opsiyonel)", { exact: true })
    .selectOption("1");
  await noOverflow(page);
  await sub.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(page.getByTestId("saved-data")).toContainText(
    '"billingCycle":"annual"',
  );
  await expect(page.getByTestId("saved-data")).toContainText(
    '"relatedCardId":"1"',
  );
});
test("bank colors, product variants, amount zero and failed save remain usable", async ({
  page,
}) => {
  await page.goto("/tests/forms-preview.html");
  await page.getByRole("button", { name: "Banka ekle", exact: true }).click();
  await page.getByLabel("Banka Adı", { exact: true }).fill("Örnek banka");
  await page.getByRole("button", { name: "Mor", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Mor", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(page.getByTestId("saved-data")).toContainText("from-purple-600");
  await page
    .getByRole("button", { name: "Kart/Kredi ekle", exact: true })
    .click();
  await page.getByRole("button", { name: "Sanal", exact: true }).click();
  await page
    .getByLabel("Bağlı Olduğu Fiziki Kart", { exact: true })
    .selectOption("1");
  await page.getByRole("button", { name: "Kredi", exact: true }).click();
  await expect(
    page.getByLabel("Aylık Taksit (₺)", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Kaydet", exact: true }),
  ).toBeInViewport();
  await noOverflow(page);
  await page.getByRole("button", { name: "Vazgeç", exact: true }).click();
  await page
    .getByRole("button", { name: "Ekstre düzenle", exact: true })
    .click();
  await expect(page.getByLabel("Tutar (₺)", { exact: true })).toHaveValue("0");
  await page.getByRole("button", { name: "Vazgeç", exact: true }).click();
  await page.getByLabel("Kaydetme hatası göster (örnek)").check();
  await page.getByRole("button", { name: "Not düzenle", exact: true }).click();
  await page.getByLabel("Kayıt Notu").fill("Kaybolmayan örnek not");
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Kaydedilemedi");
  await expect(page.getByLabel("Kayıt Notu")).toHaveValue(
    "Kaybolmayan örnek not",
  );
  await noOverflow(page);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("income and subscription payment keep their entered amounts, dates and notes", async ({
  page,
}) => {
  await page.goto("/tests/forms-preview.html");
  await page.getByRole("button", { name: "Gelir ekle", exact: true }).click();
  await page.getByLabel("Başlık", { exact: true }).fill("Örnek gelir");
  await page.getByLabel("Tutar (₺)", { exact: true }).fill("1234.5");
  await page.getByRole("button", { name: "Tek Seferlik", exact: true }).click();
  await page.getByLabel("Tarih", { exact: true }).fill("2026-12-04");
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(page.getByTestId("saved-data")).toContainText(
    '"amount":"1234.5"',
  );
  await expect(page.getByTestId("saved-data")).toContainText(
    '"type":"one-time"',
  );
  await expect(page.getByTestId("saved-data")).toContainText("2026-12-04");
  await page
    .getByRole("button", { name: "Abonelik ödemesi", exact: true })
    .click();
  await page
    .getByLabel("Ödenen Gerçek Tutar (₺)", { exact: true })
    .fill("550.25");
  await page.getByLabel("Ödeme Tarihi", { exact: true }).fill("2026-11-03");
  await page
    .getByLabel("Dönem Notu (Opsiyonel)", { exact: true })
    .fill("Örnek dönem notu");
  await expect(page.getByRole("dialog")).toContainText("daha fazla");
  await noOverflow(page);
  await page
    .getByRole("button", { name: "Ödendi Olarak Kaydet", exact: true })
    .click();
  await expect(page.getByTestId("saved-data")).toContainText('"amount":550.25');
  await expect(page.getByTestId("saved-data")).toContainText("2026-11-03");
  await expect(page.getByTestId("saved-data")).toContainText(
    "Örnek dönem notu",
  );
});

test("payment and bank deletion confirmations preserve cancel, failure and exact action callbacks", async ({
  page,
}) => {
  await page.goto("/tests/forms-preview.html");
  await page
    .getByRole("button", { name: "Ödeme onayını gör", exact: true })
    .click();
  let dialog = page.getByRole("dialog", { name: "Ödeme Onayı", exact: true });
  await expect(dialog).toContainText("₺3.250,00");
  await expect(dialog).toContainText("bankadan ödeme yapmaz");
  await expect(
    dialog.getByRole("button", { name: "Ödendi olarak kaydet", exact: true }),
  ).toBeInViewport();
  await dialog.getByRole("button", { name: "Vazgeç", exact: true }).click();
  await expect(page.getByTestId("saved-data")).toHaveText("null");
  await page.getByLabel("Kaydetme hatası göster (örnek)").check();
  await page
    .getByRole("button", { name: "Ödeme onayını gör", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ödendi olarak kaydet", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("İşlem tamamlanamadı");
  await expect(page.getByRole("dialog")).toContainText("Örnek kart ödemesi");
  await page.keyboard.press("Escape");
  await page.getByLabel("Kaydetme hatası göster (örnek)").uncheck();
  await page
    .getByRole("button", { name: "Ödeme onayını gör", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ödendi olarak kaydet", exact: true })
    .click();
  await expect(page.getByTestId("saved-data")).toHaveText(
    '{"action":"paid","id":42}',
  );
  await page
    .getByRole("button", { name: "Banka silmeyi gör", exact: true })
    .click();
  dialog = page.getByRole("dialog", { name: "Silme Onayı", exact: true });
  await expect(dialog).toContainText("2 bağlı kart/kredi");
  await expect(dialog).toContainText("4 ödeme satırı");
  await expect(dialog).toContainText("3 aboneliğin");
  await noOverflow(page);
  await dialog.getByRole("button", { name: "Vazgeç", exact: true }).click();
  await expect(page.getByTestId("saved-data")).toHaveText("null");
  await page
    .getByRole("button", { name: "Silme onayını gör", exact: true })
    .click();
  await page.getByRole("button", { name: "Sil", exact: true }).click();
  await expect(page.getByTestId("saved-data")).toHaveText(
    '{"action":"delete"}',
  );
});

test("subscription confirmation keeps archive, permanent delete and reactivation separate", async ({
  page,
}) => {
  await page.goto("/tests/forms-preview.html");
  await page
    .getByRole("button", { name: "Abonelik silmeyi gör", exact: true })
    .click();
  await page.getByRole("button", { name: /^Arşivle Önerilen/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Arşivleme Onayı", exact: true }),
  ).toContainText("Geçmiş ödeme kayıtları korunur");
  await page.getByRole("button", { name: "Geri", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Abonelik Silme", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Kalıcı Olarak Sil/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Kalıcı Silme Onayı", exact: true }),
  ).toContainText("tüm geçmiş ödeme kayıtları");
  await expect(page.getByTestId("saved-data")).toHaveText("null");
  await noOverflow(page);
  await page.getByRole("button", { name: "Geri", exact: true }).click();
  await page.getByRole("button", { name: /^Arşivle Önerilen/ }).click();
  await page.getByRole("button", { name: "Arşivle", exact: true }).click();
  await expect(page.getByTestId("saved-data")).toHaveText(
    '{"action":"archive"}',
  );
  await page
    .getByRole("button", { name: "Abonelik silmeyi gör", exact: true })
    .click();
  await page.getByRole("button", { name: /^Kalıcı Olarak Sil/ }).click();
  await page.getByRole("button", { name: "Kalıcı Sil", exact: true }).click();
  await expect(page.getByTestId("saved-data")).toHaveText(
    '{"action":"delete"}',
  );
  await page
    .getByRole("button", { name: "Arşivlenmiş aboneliği gör", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Tekrar Aktif Et", exact: true })
    .click();
  await expect(page.getByTestId("saved-data")).toHaveText(
    '{"action":"reactivate"}',
  );
  await page
    .getByRole("button", { name: "Arşivlenmiş aboneliği gör", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Kalıcı Olarak Sil", exact: true })
    .click();
  await expect(page.getByTestId("saved-data")).toHaveText(
    '{"action":"delete"}',
  );
});
