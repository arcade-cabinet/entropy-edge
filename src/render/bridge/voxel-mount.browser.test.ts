import { test, expect } from 'vitest';
import { page } from 'vitest/browser';
import { bootstrap } from './bootstrap';

test('mounts VoxelRenderer and takes a screenshot', async () => {
  const container = document.createElement('div');
  container.style.width = '800px';
  container.style.height = '600px';
  document.body.appendChild(container);

  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  container.appendChild(canvas);

  const { teardown } = await bootstrap({
    canvas,
    seed: 'test-seed',
  });

  // Let it render
  await new Promise(r => setTimeout(r, 4000));

  if (page && page.screenshot) {
    await page.screenshot({ path: 'docs/screenshots/voxel-mount-screenshot.png' });
  }

  // Ensure something loaded
  expect(canvas.width).toBeGreaterThan(0);
  
  teardown();
  document.body.removeChild(container);
});
