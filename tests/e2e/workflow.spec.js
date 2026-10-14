import { test, expect } from '@playwright/test';
import { createSampleLeads } from '../../src/data/samples.js';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/health', (route) =>
    route.fulfill({ json: { configured: false, model: 'gemini-2.5-flash' } }),
  );
});
test('sample queue filters, stores drafts across reloads, and completes a planned follow-up', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Every lead.' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Ananya Sharma', exact: true }).last(),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cold', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Arjun Kapoor', exact: true }).last(),
  ).toBeVisible();
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await page.getByRole('button', { name: 'Add a lead' }).click();
  await page.getByRole('button', { name: 'Fill an example lead' }).click();
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Kavya Rao', exact: true }).last()).toBeVisible();
  await expect(page.getByText('This lead is saved.')).toBeVisible();
  await page.reload();
  await page.getByLabel('Search leads').fill('Kavya');
  await expect(page.getByRole('heading', { name: 'Kavya Rao', exact: true }).last()).toBeVisible();
  await page.getByRole('button', { name: 'Contacted', exact: true }).count();
  await page.getByLabel('Lead status').selectOption('Contacted');
  await page.getByRole('button', { name: 'Lead workspace', exact: false }).first().click();
  await page.getByLabel('Search leads').fill('Ananya');
  await page.getByRole('button', { name: 'Plan it', exact: true }).click();
  await page.getByLabel('Next action').fill('Confirm Saturday visit time.');
  await page.getByLabel('Follow-up date & time').fill('2026-01-01T10:00');
  await page.getByRole('button', { name: 'Save follow-up' }).click();
  await page.getByRole('button', { name: 'Follow-ups', exact: false }).first().click();
  await page.getByLabel('Search leads').fill('Ananya');
  await expect(
    page.getByText('Confirm Saturday visit time.', { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A little room to plan ahead.' })).toBeVisible();
});
test('full AI workflow renders API results, keeps chat scoped, and uses call notes', async ({
  page,
}) => {
  // Transport fixtures test UI behavior. They are never used by the application.
  await page.route('**/api/analyze', async (route) => {
    const { intake } = route.request().postDataJSON();
    const analysis = structuredClone(createSampleLeads()[0].analysis);
    analysis.summary = 'Live test result: needs a 2 BHK with covered parking on Sarjapur Road.';
    analysis.evidence = [{ field: 'message', quote: 'I can visit this Sunday afternoon.' }];
    expect(intake.name).toBe('Kavya Rao');
    await route.fulfill({
      json: { ...analysis, model: 'test-model', generatedAt: new Date().toISOString() },
    });
  });
  await page.route('**/api/chat', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.intake.name).toBe('Kavya Rao');
    expect(body.question).toBe('What changed after the call?');
    expect(body.activity.some((item) => item.text.includes('Sunday visit confirmed'))).toBe(true);
    await route.fulfill({
      json: {
        answer:
          'The recent note says the Sunday visit was confirmed. Verify the time before sending details.',
        suggestedResponse: null,
        evidence: [{ field: 'activity', quote: 'Sunday visit confirmed' }],
        model: 'test-model',
        generatedAt: new Date().toISOString(),
      },
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Add a lead' }).click();
  await page.getByRole('button', { name: 'Fill an example lead' }).click();
  await page.getByRole('button', { name: 'Save & analyze', exact: true }).click();
  await expect(page.getByText('Live test result:', { exact: false }).last()).toBeVisible();
  await page.getByRole('tab', { name: 'Activity' }).click();
  await page.getByLabel('Call outcome or note').fill('Sunday visit confirmed after the call.');
  await page.getByRole('button', { name: 'Add note' }).click();
  await page.getByRole('button', { name: 'Ask copilot', exact: true }).first().click();
  await page.getByLabel('Ask about this lead').fill('What changed after the call?');
  await page.getByRole('button', { name: 'Send question' }).click();
  await expect(
    page.getByText('The recent note says the Sunday visit was confirmed.', { exact: false }),
  ).toBeVisible();
  await page.getByText('1 source from this lead').click();
  await expect(page.locator('.chat-evidence blockquote')).toContainText('Sunday visit confirmed');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByLabel('Search leads').fill('Arjun');
  await page.getByRole('button', { name: 'Ask copilot', exact: true }).first().click();
  await expect(
    page.getByText('The recent note says the Sunday visit was confirmed.', { exact: false }),
  ).toHaveCount(0);
});
test('AI failure retains draft and does not fabricate an analysis or chat answer', async ({
  page,
}) => {
  await page.route('**/api/analyze', (route) =>
    route.fulfill({ status: 503, json: { error: { message: 'AI is not connected.' } } }),
  );
  await page.route('**/api/chat', (route) =>
    route.fulfill({ status: 429, json: { error: { message: 'Quota exhausted. Try later.' } } }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Add a lead' }).click();
  await page.getByRole('button', { name: 'Fill an example lead' }).click();
  await page.getByRole('button', { name: 'Save & analyze', exact: true }).click();
  await expect(page.getByText('AI is not connected.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Kavya Rao', exact: true }).last()).toBeVisible();
  await page.getByRole('button', { name: 'Ask copilot', exact: true }).first().click();
  await page.getByLabel('Ask about this lead').fill('What do I say?');
  await page.getByRole('button', { name: 'Send question' }).click();
  await expect(page.locator('.chat-compose').getByRole('alert')).toContainText(
    'Quota exhausted. Try later.',
  );
  await expect(page.locator('.chat-message.assistant')).toHaveCount(0);
  await expect(page.getByLabel('Ask about this lead')).toHaveValue('What do I say?');
});
test('mobile layout fits the viewport and modal is keyboard accessible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Add a lead' })).toBeVisible();
  const widths = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  await page.getByRole('button', { name: 'Add a lead' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('editing intake clears stale analysis; backups merge new records and reject invalid files', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Edit lead', exact: true }).click();
  await page.getByLabel('Customer name').fill('Ananya Updated');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Ananya Updated', exact: true }).last(),
  ).toBeVisible();
  await expect(page.getByText('This lead is saved.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Workspace settings', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^closewise-backup-/);
  const imported = { ...createSampleLeads()[3], id: 'imported-lead' };
  await page.getByLabel('Import Closewise backup').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ version: 1, leads: [imported, createSampleLeads()[0]] })),
  });
  await expect(page.getByRole('status')).toContainText(
    'Imported 1 leads. 1 existing leads skipped.',
  );
  await page.getByLabel('Import Closewise backup').setInputFiles({
    name: 'bad-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ version: 2, leads: [] })),
  });
  await expect(page.getByRole('status')).toContainText('not a valid Closewise backup');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.reload();
  await page.getByLabel('Search leads').fill('Ananya Updated');
  await expect(
    page.getByRole('heading', { name: 'Ananya Updated', exact: true }).last(),
  ).toBeVisible();
});

test('corrupt browser data is preserved until an explicit reset', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('closewise.leads.v1', '{broken-json'));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Saved data could not be read');
  expect(await page.evaluate(() => localStorage.getItem('closewise.leads.v1'))).toBe(
    '{broken-json',
  );
  await page.getByRole('button', { name: 'Workspace settings', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Export original stored data' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear all data', exact: true }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect
    .poll(async () => page.evaluate(() => localStorage.getItem('closewise.leads.v1')))
    .toBe(JSON.stringify({ version: 1, leads: [] }));
});

test('actual local API accepts same-origin requests through the Vite proxy', async ({ page }) => {
  // No endpoint interception here: verify frontend-to-server wiring without calling the model.
  const response = await page.request.post('/api/analyze', {
    headers: { Origin: 'http://127.0.0.1:5173' },
    data: { intake: { name: 'Missing other required fields' } },
  });
  expect(response.status()).toBe(400);
  expect((await response.json()).error.code).toBe('VALIDATION');
});
