import { test, expect } from '../../shared/setup.ts';
import { bpmMergeSplitHandlers } from '../handlers/bpm-merge-split.ts';

test.use({ handlerConfig: { list: bpmMergeSplitHandlers } });

const DISABLE_ANIMATIONS_CSS =
  '*, *::before, *::after { animation: none !important; transition: none !important; animation-duration: 0s !important; transition-duration: 0s !important; }';

test.describe('bpm-merge-split visual baselines', () => {
  test.beforeEach(async ({ page }) => {
    await page.addStyleTag({ content: DISABLE_ANIMATIONS_CSS });
  });

  test('split mode', async ({ page }) => {
    await page.goto('/?type=split', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#app', { state: 'attached' });
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('split-mode.png', {
      fullPage: true,
    });
  });

  test('merge mode', async ({ page }) => {
    await page.goto('/?type=merge', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#app', { state: 'attached' });
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('merge-mode.png', {
      fullPage: true,
    });
  });
});
