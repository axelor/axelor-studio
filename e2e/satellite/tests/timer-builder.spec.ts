import { test, expect } from '../../shared/setup.ts';
import { timerBuilderHandlers } from '../handlers/timer-builder.ts';

test.use({ handlerConfig: { list: timerBuilderHandlers } });

const DISABLE_ANIMATIONS_CSS =
  '*, *::before, *::after { animation: none !important; transition: none !important; animation-duration: 0s !important; transition-duration: 0s !important; }';

test.describe('timer-builder visual baselines', () => {
  test.beforeEach(async ({ page }) => {
    await page.addStyleTag({ content: DISABLE_ANIMATIONS_CSS });
  });

  test('ISO8601 duration tab', async ({ page }) => {
    // timerDefinitionType=timeDuration shows the ISO8601 duration picker (tab id 1)
    // This displays PT0S with Years/Months/Weeks/Days/Hours/Minutes/Seconds inputs
    await page.goto('/?timerDefinitionType=timeDuration', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#root', { state: 'attached' });
    // Wait for the ISO8601 duration inputs to render
    await page.waitForTimeout(3000);
    await expect(page).toHaveScreenshot('iso8601-duration-tab.png', {
      fullPage: true,
    });
  });

  test('cron expression tab', async ({ page }) => {
    // timerDefinitionType=cron shows the Cron Expression tab (tab id 3)
    await page.goto('/?timerDefinitionType=cron', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#root', { state: 'attached' });
    await page.waitForTimeout(3000);
    await expect(page).toHaveScreenshot('cron-expression-tab.png', {
      fullPage: true,
    });
  });
});
