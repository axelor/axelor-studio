import { test, expect } from '../../shared/setup.ts';
import { mapperHandlers } from '../handlers/mapper.ts';

test.use({ handlerConfig: { list: mapperHandlers } });

const DISABLE_ANIMATIONS_CSS =
  '*, *::before, *::after { animation: none !important; transition: none !important; animation-duration: 0s !important; transition-duration: 0s !important; }';

test.describe('mapper visual baselines', () => {
  test.beforeEach(async ({ page }) => {
    await page.addStyleTag({ content: DISABLE_ANIMATIONS_CSS });
  });

  test('empty mapper', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#root', { state: 'attached' });
    // Wait for mapper to render with default params
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('empty-mapper.png', {
      fullPage: true,
    });
  });

  test('mapper with model params', async ({ page }) => {
    await page.goto(
      '/?model=com.axelor.studio.db.ValueMapper&resultField=script&resultMetaField=scriptMeta',
      { waitUntil: 'domcontentloaded' }
    );
    await page.waitForSelector('#root', { state: 'attached' });
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('mapper-with-model-params.png', {
      fullPage: true,
    });
  });
});
