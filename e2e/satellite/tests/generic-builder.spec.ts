import { test, expect } from '../../shared/setup.ts';
import { genericBuilderHandlers } from '../handlers/generic-builder.ts';

test.use({ handlerConfig: { list: genericBuilderHandlers } });

const DISABLE_ANIMATIONS_CSS =
  '*, *::before, *::after { animation: none !important; transition: none !important; animation-duration: 0s !important; transition-duration: 0s !important; }';

/**
 * Wait for the expression builder Dialog to render visible content.
 * App.jsx passes open={true} so the @axelor/ui Dialog mounts its children.
 * We wait for the modal-content class (from @axelor/ui Dialog) to appear.
 */
async function waitForBuilderReady(page: import('@playwright/test').Page): Promise<void> {
  // Wait for Dialog content to be visible (modal-content is the @axelor/ui class)
  await page.waitForSelector('.modal-content, [class*="modal-content"]', {
    state: 'visible',
    timeout: 15000,
  });
  // Small settle time for React state updates
  await page.waitForTimeout(500);
}

test.describe('generic-builder visual baselines', () => {
  test.beforeEach(async ({ page }) => {
    await page.addStyleTag({ content: DISABLE_ANIMATIONS_CSS });
  });

  test('empty expression builder', async ({ page }) => {
    await page.goto('/?type=expressionBuilder');
    await waitForBuilderReady(page);
    await expect(page).toHaveScreenshot('empty-expression-builder.png', {
      fullPage: true,
    });
  });

  test('expression builder with model', async ({ page }) => {
    await page.goto(
      '/?type=expressionBuilder&model=com.axelor.apps.base.db.Partner'
    );
    await waitForBuilderReady(page);
    await expect(page).toHaveScreenshot('expression-builder-with-model.png', {
      fullPage: true,
    });
  });

  test('query builder mode', async ({ page }) => {
    await page.goto(
      '/?type=query&model=com.axelor.apps.base.db.Partner'
    );
    await waitForBuilderReady(page);
    await expect(page).toHaveScreenshot('query-builder-mode.png', {
      fullPage: true,
    });
  });

  test('condition mode', async ({ page }) => {
    await page.goto('/?type=expressionBuilder&isCondition=true');
    await waitForBuilderReady(page);
    await expect(page).toHaveScreenshot('condition-mode.png', {
      fullPage: true,
    });
  });
});
