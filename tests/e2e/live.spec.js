import process from 'node:process';
import { test, expect } from '@playwright/test';

test.skip(!process.env.FINOWN_TEST_URL, 'Requires an explicit live target');

test('live mobile application loads its login screen and SPA routes without JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const path of ['/', '/expenses', '/incomes', '/subscriptions', '/banks']) {
        const response = await page.goto(path);
        expect(response.status()).toBe(200);
        await expect(page.getByRole('heading', { name: 'FinOwn', exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Giriş Yap', exact: true })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    expect(errors).toEqual([]);
});


test('live login supports signup switching, password visibility and native validation without auth writes', async ({ page }) => {
    const authCalls = [];
    page.on('request', request => {
        if (request.url().includes('/auth/v1/') && request.method() !== 'GET') authCalls.push(request.method());
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Yeniden merhaba.', exact: true })).toBeVisible();
    const email = page.getByLabel('E-posta', { exact: true });
    const password = page.getByLabel('Şifre', { exact: true });
    await expect(email).toHaveAttribute('autocomplete', 'email');
    await page.getByRole('button', { name: 'Giriş Yap', exact: true }).click();
    expect(await email.evaluate(input => input.validity.valueMissing)).toBe(true);
    await page.getByRole('button', { name: 'Şifreyi göster', exact: true }).click();
    await expect(password).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Şifreyi gizle', exact: true }).click();
    await expect(password).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Hesap oluştur', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Kayıt Ol', exact: true })).toBeVisible();
    await expect(password).toHaveAttribute('autocomplete', 'new-password');
    await expect(page.getByText('En az 6 karakter kullan.', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Giriş yap', exact: true }).click();
    await expect(password).toHaveAttribute('autocomplete', 'current-password');
    expect(authCalls).toEqual([]);
});
