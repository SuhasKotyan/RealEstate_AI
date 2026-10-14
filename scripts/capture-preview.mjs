import { mkdir, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const browserCache = fileURLToPath(new URL('../.playwright-browsers', import.meta.url));
if (!process.env.PLAYWRIGHT_BROWSERS_PATH && existsSync(browserCache))
  process.env.PLAYWRIGHT_BROWSERS_PATH = browserCache;
const { chromium } = await import('@playwright/test');
const output = fileURLToPath(new URL('../docs/screenshots', import.meta.url));
await promisify(mkdir)(output, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:5173');
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole('heading', { name: 'Ananya Sharma', exact: true }).last().waitFor();
  await page.screenshot({ path: `${output}/desktop.png` });
  await page.getByRole('button', { name: 'Ask copilot', exact: true }).first().click();
  await page.getByRole('dialog').waitFor();
  await page.screenshot({ path: `${output}/copilot.png` });
  await page.getByRole('button', { name: 'Close dialog' }).click();
  const measurements = [];
  for (const width of [1920, 1440, 1366, 1024, 768, 650, 390, 360]) {
    await page.setViewportSize({ width, height: 1000 });
    measurements.push(
      await page.evaluate(() => ({
        width: innerWidth,
        pageWidth: document.documentElement.scrollWidth,
        summaryFont: getComputedStyle(document.querySelector('.summary-card > p')).fontSize,
      })),
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${output}/mobile.png` });
  console.log(JSON.stringify({ errors, measurements }, null, 2));
} finally {
  await browser.close();
}
