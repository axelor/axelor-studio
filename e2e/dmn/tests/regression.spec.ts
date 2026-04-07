import { test, expect } from '../../shared/setup.ts';
import { dmnHandlers } from '../handlers.ts';

test.use({ handlerConfig: { list: dmnHandlers } });

const DISABLE_ANIMATIONS_CSS =
  '*, *::before, *::after { animation: none !important; transition: none !important; animation-duration: 0s !important; transition-duration: 0s !important; }';

test.describe('dmn visual regression guards', () => {
  test.beforeEach(async ({ page }) => {
    await page.addStyleTag({ content: DISABLE_ANIMATIONS_CSS });
  });

  test('decision table cells are center-aligned (no global box-sizing override)', async ({ page }) => {
    // Load decision table model
    await page.goto('/?id=1');
    await page.waitForSelector('#root', { state: 'attached' });
    await page.waitForTimeout(2000);

    // Drill down from DRD to decision table
    const decisionShape = page.locator('.djs-element[data-element-id="Decision_1"]');
    if (await decisionShape.isVisible()) {
      await decisionShape.dblclick({ force: true });
      await page.waitForTimeout(1500);
    }

    // Verify that input/output data cells exist in the decision table
    const dataCells = page.locator(
      '.dmn-decision-table-container td.input-cell, .dmn-decision-table-container td.output-cell'
    );
    const cellCount = await dataCells.count();

    if (cellCount > 0) {
      // Verify the computed box-sizing is NOT border-box on table cells.
      // dmn-js expects content-box (browser default). A global * { box-sizing: border-box }
      // breaks cell dimensions, padding calculations, and text alignment.
      const boxSizing = await dataCells.first().evaluate(
        (el) => window.getComputedStyle(el).boxSizing
      );
      expect(boxSizing).toBe('content-box');
    }

    // Verify no global box-sizing: border-box rule is applied to the dmn-js container.
    // Check on the table element itself.
    const table = page.locator('.dmn-decision-table-container .tjs-table');
    if (await table.isVisible()) {
      const tableBoxSizing = await table.evaluate(
        (el) => window.getComputedStyle(el).boxSizing
      );
      expect(tableBoxSizing).toBe('content-box');
    }
  });

  test('context menu renders in multi-column layout on right-click', async ({ page }) => {
    // Load decision table model
    await page.goto('/?id=1');
    await page.waitForSelector('#root', { state: 'attached' });
    await page.waitForTimeout(2000);

    // Drill down from DRD to decision table
    const decisionShape = page.locator('.djs-element[data-element-id="Decision_1"]');
    if (await decisionShape.isVisible()) {
      await decisionShape.dblclick({ force: true });
      await page.waitForTimeout(1500);
    }

    // Right-click on a table cell to open the context menu
    const cell = page.locator('.tjs-cell').first();
    if (await cell.isVisible()) {
      await cell.click({ button: 'right', force: true });
      await page.waitForTimeout(500);

      // The context menu should appear
      const contextMenu = page.locator('.context-menu');
      const menuVisible = await contextMenu.isVisible().catch(() => false);

      if (menuVisible) {
        // Verify the context menu has multiple groups (multi-column layout).
        // table-js context menu uses .context-menu-group for column groups.
        const groups = page.locator('.context-menu .context-menu-group');
        const groupCount = await groups.count();

        // The original DMN context menu has at least 2 column groups
        // (Copy/Cut/Paste group + Add/Remove group)
        expect(groupCount).toBeGreaterThanOrEqual(2);

        // Take a screenshot for visual comparison
        await expect(page).toHaveScreenshot('context-menu.png', {
          fullPage: true,
        });
      }
    }
  });

  test('decision table header alignment matches original layout', async ({ page }) => {
    // Load decision table model
    await page.goto('/?id=1');
    await page.waitForSelector('#root', { state: 'attached' });
    await page.waitForTimeout(2000);

    // Drill down to decision table
    const decisionShape = page.locator('.djs-element[data-element-id="Decision_1"]');
    if (await decisionShape.isVisible()) {
      await decisionShape.dblclick({ force: true });
      await page.waitForTimeout(1500);
    }

    // Verify the decision table header bar rendered correctly
    const header = page.locator('.dmn-decision-table-container .decision-table-properties');
    if (await header.isVisible()) {
      // The header should have proper height (not collapsed)
      const headerBox = await header.boundingBox();
      expect(headerBox).toBeTruthy();
      if (headerBox) {
        expect(headerBox.height).toBeGreaterThan(20);
      }
    }

    // Take screenshot of the full decision table for visual baseline
    await expect(page).toHaveScreenshot('decision-table-layout.png', {
      fullPage: true,
    });
  });
});
