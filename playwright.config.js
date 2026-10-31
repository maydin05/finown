import process from 'node:process';
import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    reporter: 'line',
    timeout: 30000,
    use: { baseURL: process.env.FINOWN_TEST_URL || 'http://127.0.0.1:5173', timezoneId: 'Europe/Istanbul', trace: 'retain-on-failure', screenshot: 'off' },
    projects: [320, 375, 430].map(width => ({ name: `mobile-${width}`, use: { viewport: { width, height: 844 }, isMobile: true, hasTouch: true } })),
    webServer: process.env.FINOWN_TEST_URL ? undefined : { command: 'npm run dev -- --host 127.0.0.1', url: 'http://127.0.0.1:5173', reuseExistingServer: false },
});
