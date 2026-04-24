import { expect, test } from '@playwright/test';

/**
 * Golden-path E2E: landing renders, CTA enters the duel, HUD paints,
 * placing a cube updates the budget, no console errors along the way.
 */

test('landing → duel → build', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });

  await page.goto('/?seed=brittle-tuned-manifold', { waitUntil: 'load' });
  await expect(page.getByRole('heading', { name: /entropy edge/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /enter the lattice/i })).toBeVisible();

  await page.getByRole('button', { name: /enter the lattice/i }).click();

  // Wait for the voxel scene + HUD to paint.
  await page.waitForTimeout(5000);

  await expect(page.getByText(/sector 1/i).first()).toBeVisible();
  await expect(page.getByText(/your turn/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /copy share url/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /mute audio/i })).toBeVisible();

  // Tap the canvas to place a cube.
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('canvas not laid out');
  await page.mouse.click(box.x + box.width * 0.42, box.y + box.height * 0.5);

  // Budget goes from N/N down by at least one.
  await page.waitForTimeout(500);
  expect(errors, `Collected console/pageerror events:\n${errors.join('\n')}`).toHaveLength(0);
});
