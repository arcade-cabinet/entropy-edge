import { test, expect } from '@playwright/test';

/**
 * Autoplay E2E Visual Diagnostic
 * 
 * Replaces the player with a mirror of the AI Rival's strategy tree.
 * The game plays itself (AI vs AI) and takes screenshots of the ongoing rounds
 * to visually verify the simulation stays intact deep into a session, 
 * blocks balance properly, and correctly transitions to a terminal state.
 */

test.skip('AI vs AI visual diagnostic simulation', async ({ page }) => {
  test.setTimeout(90000); // Allow up to 90 seconds for the AI match to resolve

  // Use a fixed daily-style seed for reproducible balance testing
  await page.goto('/?seed=brittle-tuned-manifold&autoplay=1', { waitUntil: 'load' });
  
  await expect(page.getByRole('heading', { name: /entropy edge/i })).toBeVisible();
  
  // Enter the lattice
  await page.getByRole('button', { name: /enter the lattice/i }).click();

  let isGameOver = false;
  let screenshotsTaken = 0;
  
  // Wait up to 80 seconds for the AI match to resolve
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(2000);
    
    // Log the current visual state of the match
    await page.screenshot({ path: `docs/screenshots/autoplay-diagnostic-round-${i + 1}.png`, fullPage: false });
    screenshotsTaken++;

    // Check if the duel concluded
    const overCount = await page.getByText(/Sector Claimed|Rival Claimed|Sector Held Open/i).count();
    if (overCount > 0) {
      isGameOver = true;
      break;
    }
  }

  // The match must conclude or it implies a game-breaking stall
  expect(isGameOver).toBe(true);
  
  // Ensure we actually took screenshots of the live match
  expect(screenshotsTaken).toBeGreaterThan(0);
});