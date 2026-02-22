import { expect, test } from '@playwright/test';

test('smoke: app renders and generates prompt', async ({ page }) => {
  await page.goto('/zh-TW');

  await expect(page.getByRole('heading', { name: '投影片風格提示詞產生器' })).toBeVisible();
  await page.getByRole('button', { name: /深色|淺色/ }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);

  await page.selectOption('select[name="language"]', 'en');
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByRole('heading', { name: 'Slide Style Prompt Generator' })).toBeVisible();

  await page.getByRole('button', { name: 'Templates' }).click();
  await page.getByPlaceholder('New category name').fill('Brand Voice');
  await page.getByRole('button', { name: 'Add Category' }).click();

  const categoryCard = page
    .locator('article')
    .filter({ has: page.locator('input[value="Brand Voice"]') })
    .first();
  await categoryCard.getByPlaceholder('New option label').fill('Playful Persona');
  await categoryCard.getByRole('button', { name: 'Add Option' }).click();

  await page.getByRole('button', { name: 'Generator' }).click();
  await expect(page.getByText('Brand Voice')).toBeVisible();
  await page.getByRole('button', { name: 'Playful Persona' }).click();

  await page.getByPlaceholder('Custom palette name').fill('My Palette');
  await page.getByRole('button', { name: 'Add Palette' }).click();
  await page.getByPlaceholder('Custom style name').fill('My Style');
  await page.getByPlaceholder('Custom style direction').fill('Use bold visual rhythm.');
  await page.getByRole('button', { name: 'Add Style' }).click();

  await expect(page.locator('pre')).toContainText('Output Language: en');
  await expect(page.locator('pre')).not.toContainText('Brand Voice: Playful Persona');
  await expect(page.locator('pre')).toContainText('Style Preset: My Style');

  await page.getByRole('button', { name: 'Copy' }).click();
  await expect(page.locator('pre')).toContainText('Style Preset: My Style');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^slide-prompt-\d+\.txt$/);

  await page.getByRole('button', { name: 'Reset Custom Data' }).click();
  await expect(page.getByText('Brand Voice')).toHaveCount(0);
  await expect(page.getByText('My Palette')).toHaveCount(0);
  await expect(page.getByText('My Style')).toHaveCount(0);
});
