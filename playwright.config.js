import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const localBrowsers = fileURLToPath(new URL('./.playwright-browsers', import.meta.url));
if (!process.env.PLAYWRIGHT_BROWSERS_PATH && existsSync(localBrowsers))
  process.env.PLAYWRIGHT_BROWSERS_PATH = localBrowsers;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:5173', headless: true, trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
  reporter: [['list'], ['html', { open: 'never' }]],
});
