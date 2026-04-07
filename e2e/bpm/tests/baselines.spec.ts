import { test, expect } from '../../shared/setup.ts';
import { bpmHandlers } from '../handlers.ts';

test.use({ handlerConfig: { list: bpmHandlers } });

const DISABLE_ANIMATIONS_CSS =
  '*, *::before, *::after { animation: none !important; transition: none !important; animation-duration: 0s !important; transition-duration: 0s !important; }';

test.describe('bpm visual baselines', () => {
  test.beforeEach(async ({ page }) => {
    await page.addStyleTag({ content: DISABLE_ANIMATIONS_CSS });
  });

  test('empty canvas (new diagram)', async ({ page }) => {
    // BPM modeler cold start is heavy (6 parallel dev servers + bpmn-js init)
    test.setTimeout(120_000);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Wait for bpmn-js canvas SVG to be present (proves modeler initialized)
    await page.waitForSelector('.djs-container svg', { state: 'attached', timeout: 60000 });
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('empty-canvas.png', {
      fullPage: true,
    });
  });

  test('bpm modeler with diagram loaded', async ({ page }) => {
    test.setTimeout(120_000);
    // Navigate with an id param so the app loads the WkfModel with BPMN XML
    await page.goto('/?id=1', { waitUntil: 'domcontentloaded' });
    // Wait for bpmn-js to render the diagram SVG with the start event
    await page.waitForSelector('.djs-container svg', { state: 'attached', timeout: 60000 });
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('modeler-with-diagram.png', {
      fullPage: true,
    });
  });
});
