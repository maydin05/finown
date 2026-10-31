import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-31T12:00:00+03:00') });
});

test('mobile summary, 7/30 days, missing statement and local sample entry', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/tests/ui-preview.html');
    const region = page.getByRole('region', { name: 'Yaklaşan ödeme ve gelir özeti' });
    await expect(region.getByRole('button', { name: '7 gün', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await region.getByRole('button', { name: '30 gün', exact: true }).click();
    await expect(region.getByRole('button', { name: '30 gün', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(region).toContainText('29 Kasım');
    await expect(region).toContainText('1 kart ekstresinin tutarı eksik');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await region.getByRole('button', { name: 'Ekstre tutarı gir' }).click();
    await expect(page.getByRole('heading', { name: 'Kredi Kartı Ödemesi' })).toBeVisible();
    await page.getByRole('spinbutton').fill('5000');
    await page.getByRole('button', { name: 'Bilgileri Kaydet' }).click();
    await expect(region.getByText('₺6.000,00', { exact: true })).toBeVisible();
    await expect(region.getByText('+₺9.000,00', { exact: true })).toBeVisible();
    await expect(region).not.toContainText('tutarı eksik');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
});

test('complete expense page keeps its summary and monthly rows usable on mobile', async ({ page }) => {
    await page.goto('/tests/ui-preview.html?full=1');
    await expect(page.getByRole('heading', { name: 'Kasım', exact: true })).toBeVisible();
    const region = page.getByRole('region', { name: 'Yaklaşan ödeme ve gelir özeti' });
    await expect(region.getByRole('heading', { name: 'Önümüzdeki günler' })).toBeVisible();
    await region.getByRole('button', { name: '30 gün', exact: true }).click();
    await expect(region).toContainText('29 Kasım');
    await page.getByRole('button', { name: 'Ödenmişler', exact: true }).click();
    await expect(page.getByText('Kayıt bulunamadı.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Ödenecekler', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Örnek taksit', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
