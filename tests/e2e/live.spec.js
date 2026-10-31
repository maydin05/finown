import process from 'node:process';
import { test, expect } from '@playwright/test';

test.skip(!process.env.FINOWN_TEST_URL, 'Requires an explicit live target');

test('live mobile application loads its login screen and SPA routes without JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const path of ['/', '/incomes', '/subscriptions', '/banks']) {
        const response = await page.goto(path);
        expect(response.status()).toBe(200);
        await expect(page.getByRole('heading', { name: 'FinOwn', exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Giriş Yap', exact: true })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    expect(errors).toEqual([]);
});
