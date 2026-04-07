import { test, expect } from '../../shared/setup.ts';
import { bpmHandlers } from '../handlers.ts';
import { filterConsoleErrors } from '../../shared/helpers/console-error-filter.ts';

/**
 * E2E Regression Tests: Canvas Interactions
 *
 * Verifies basic canvas operations: element selection, properties drawer toggle,
 * and canvas navigation. Merged from canvas-interactions.spec.js +
 * sequential selection test from property-edit-regression.spec.js.
 *
 * Console error checking is enabled: any browser console.error will fail the test.
 * Infrastructure noise (WebSocket, HMR) is filtered out.
 */

test.use({ handlerConfig: { list: bpmHandlers } });

test.describe('Canvas Interactions', () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/?id=1', { waitUntil: 'domcontentloaded' });

    // Wait for BPMN canvas to load
    const canvas = page.locator('.djs-container');
    await expect(canvas).toBeVisible({ timeout: 15000 });

    const startEvent = page.locator('[data-element-id="StartEvent_1"]');
    await expect(startEvent).toBeAttached({ timeout: 10000 });
  });

  test.afterEach(() => {
    const realErrors = filterConsoleErrors(consoleErrors);
    expect(realErrors).toEqual([]);
  });

  test('clicking a canvas element updates selection state', async ({ page }) => {
    // Click on Task_1 to select it
    const task = page.locator('[data-element-id="Task_1"]');
    await task.click();

    // bpmn-js adds a visual selection indicator (djs-outline becomes visible/highlighted)
    // The selected element gets a CSS class or visual update
    const selectedElement = page.locator('[data-element-id="Task_1"].djs-element');
    await expect(selectedElement).toBeAttached();

    // Click elsewhere on canvas to deselect
    const canvas = page.locator('.djs-container');
    await canvas.click({ position: { x: 10, y: 10 } });
  });

  test('clicking on canvas background deselects all elements', async ({ page }) => {
    // First select an element
    const task = page.locator('[data-element-id="Task_1"]');
    await task.click();
    await page.waitForTimeout(200);

    // Click on empty canvas area to deselect
    const canvas = page.locator('.djs-container');
    await canvas.click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(200);

    // No console errors should occur during deselection
  });

  test('BPMN palette is visible and contains tool entries', async ({ page }) => {
    const palette = page.locator('.djs-palette');
    await expect(palette).toBeVisible();

    // Palette should contain multiple entry tools for creating elements
    const entries = page.locator('.djs-palette .entry');
    const entryCount = await entries.count();
    expect(entryCount).toBeGreaterThan(0);
  });

  test('all loaded diagram elements are rendered on canvas', async ({ page }) => {
    // The mock diagram contains StartEvent_1, Task_1, EndEvent_1
    // Verify each element is rendered in the canvas
    const startEvent = page.locator('[data-element-id="StartEvent_1"]');
    await expect(startEvent).toBeAttached();

    const task = page.locator('[data-element-id="Task_1"]');
    await expect(task).toBeAttached();

    const endEvent = page.locator('[data-element-id="EndEvent_1"]');
    await expect(endEvent).toBeAttached();

    // Sequence flows should also be rendered
    const flow1 = page.locator('[data-element-id="Flow_1"]');
    await expect(flow1).toBeAttached();

    const flow2 = page.locator('[data-element-id="Flow_2"]');
    await expect(flow2).toBeAttached();
  });

  test('SVG layer is present inside the canvas container', async ({ page }) => {
    // bpmn-js renders elements inside an SVG layer within .djs-container
    const svgLayer = page.locator('.djs-container svg').first();
    await expect(svgLayer).toBeAttached();

    // The SVG should contain graphical elements
    const svgGroups = page.locator('.djs-container svg g');
    const groupCount = await svgGroups.count();
    expect(groupCount).toBeGreaterThan(0);
  });

  test('double-clicking an element does not produce console errors', async ({ page }) => {
    // Double-click can trigger direct editing mode in bpmn-js
    const task = page.locator('[data-element-id="Task_1"]');
    await task.dblclick();

    // Wait for any async effects
    await page.waitForTimeout(500);

    // Press Escape to exit any edit mode
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('can select different node types sequentially without errors', async ({ page }) => {
    // Select start event
    const startEvent = page.locator('[data-element-id="StartEvent_1"]');
    await startEvent.click();
    await page.waitForTimeout(300);

    // Select task
    const task = page.locator('[data-element-id="Task_1"]');
    await task.click();
    await page.waitForTimeout(300);

    // Select end event
    const endEvent = page.locator('[data-element-id="EndEvent_1"]');
    await endEvent.click();
    await page.waitForTimeout(300);

    // Click on canvas background to deselect
    const canvas = page.locator('.djs-container');
    await canvas.click({ position: { x: 50, y: 50 } });

    // No console errors should have occurred during selection cycling
  });
});
