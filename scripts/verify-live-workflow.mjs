import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { localDateInput } from '../src/lib/format.js';

const browserCache = fileURLToPath(new URL('../.playwright-browsers', import.meta.url));
if (!process.env.PLAYWRIGHT_BROWSERS_PATH && existsSync(browserCache))
  process.env.PLAYWRIGHT_BROWSERS_PATH = browserCache;
const { chromium } = await import('@playwright/test');
const browser = await chromium.launch();
try {
  // Fresh browser storage: this never changes the user's own saved workspace.
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:5173');
  await page.getByRole('button', { name: 'Add a lead', exact: true }).click();
  await page.getByRole('button', { name: 'Fill an example lead' }).click();
  const analysisResponse = page.waitForResponse(
    (response) => response.url().endsWith('/api/analyze') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Save & analyze', exact: true }).click();
  const analyzed = await analysisResponse;
  const analysis = await analyzed.json();
  if (!analyzed.ok()) throw new Error(analysis.error?.message || 'Analysis endpoint failed.');
  await page.getByRole('button', { name: 'Plan it', exact: true }).waitFor();
  await page.reload();
  await page.getByLabel('Search leads').fill('Kavya');
  await page.getByRole('button', { name: 'Plan it', exact: true }).click();
  await page.getByLabel('Next action').fill('Confirm Sunday visit and verify maintenance charges.');
  await page.getByLabel('Follow-up date & time').fill(localDateInput(new Date(Date.now() - 60000)));
  await page.getByRole('button', { name: 'Save follow-up', exact: true }).click();
  await page.getByRole('tab', { name: 'Activity' }).click();
  await page
    .getByLabel('Call outcome or note')
    .fill('Called customer. Sunday afternoon visit confirmed; wants maintenance charges verified.');
  await page.getByRole('button', { name: 'Add note', exact: true }).click();
  await page.getByRole('button', { name: 'Ask copilot', exact: true }).first().click();
  await page
    .getByLabel('Ask about this lead')
    .fill(
      'What changed after the call? Draft a more assertive reply using my latest note, without inventing available properties.',
    );
  const chatResponse = page.waitForResponse(
    (response) => response.url().endsWith('/api/chat') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Send question', exact: true }).click();
  const chatted = await chatResponse;
  const chat = await chatted.json();
  if (!chatted.ok()) throw new Error(chat.error?.message || 'Chat endpoint failed.');
  await page.locator('.chat-message.assistant').waitFor();
  if (!chat.suggestedResponse || !chat.evidence.some((item) => item.field === 'activity'))
    throw new Error('Chat did not produce the requested draft grounded in the call note.');
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await page.getByRole('button', { name: 'Follow-ups', exact: false }).first().click();
  await page.getByLabel('Search leads').fill('Kavya');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('closewise.leads.v1')).leads.find(
      (lead) => lead.intake.name === 'Kavya Rao',
    ),
  );
  if (!saved || saved.source !== 'live' || !saved.followup.done || saved.chat.length !== 2)
    throw new Error('Live workflow did not persist the expected state.');
  console.log(
    JSON.stringify(
      {
        analysisStatus: analyzed.status(),
        chatStatus: chatted.status(),
        model: saved.model,
        leadPersistedAfterReload: true,
        chatUsesCallNote: true,
        replyDraftGenerated: true,
        followupCompleted: saved.followup.done,
        browserErrors: errors,
      },
      null,
      2,
    ),
  );
  if (errors.length) throw new Error('Browser runtime errors occurred.');
} catch (error) {
  console.error(`Live browser check failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
