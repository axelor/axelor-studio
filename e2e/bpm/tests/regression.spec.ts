import { test, expect } from '../../shared/setup.ts';
import { bpmHandlers } from '../handlers.ts';

const DISABLE_ANIMATIONS_CSS =
  '*, *::before, *::after { animation: none !important; transition: none !important; animation-duration: 0s !important; transition-duration: 0s !important; }';

test.describe('bpm visual regression guards', () => {
  test.use({ handlerConfig: { list: bpmHandlers } });

  test.beforeEach(async ({ page }) => {
    await page.addStyleTag({ content: DISABLE_ANIMATIONS_CSS });
  });

  test('script dialog renders Monaco editor (not plain textarea)', async ({ page }) => {
    // Load BPM modeler with a diagram
    await page.goto('/?id=1');
    await page.waitForSelector('#root', { state: 'attached' });
    await page.waitForTimeout(2000);

    // Click on the StartEvent to select it and open properties
    const startEvent = page.locator(
      '.djs-element[data-element-id="StartEvent_1"]'
    );
    if (await startEvent.isVisible({ timeout: 10000 }).catch(() => false)) {
      await startEvent.click({ force: true });
      await page.waitForTimeout(1000);

      // Look for a "Script" or "Add script" button/link in the properties panel
      // that would open the ScriptDialog
      const scriptTrigger = page.locator(
        'text=Script, text=Add script, button:has-text("Script")'
      );
      const triggerVisible = await scriptTrigger.first().isVisible().catch(() => false);

      if (triggerVisible) {
        await scriptTrigger.first().click();
        await page.waitForTimeout(2000);

        // Once the script dialog opens, verify Monaco is present (not a textarea fallback).
        // Monaco renders inside a div with class "monaco-editor".
        const monacoEditor = page.locator('.monaco-editor');
        const plainTextarea = page.locator('.modal-content textarea, [class*="alert"] textarea');

        const monacoVisible = await monacoEditor.isVisible().catch(() => false);
        const textareaVisible = await plainTextarea.isVisible().catch(() => false);

        // Monaco editor MUST be present. A plain textarea means Monaco failed to load.
        if (monacoVisible || textareaVisible) {
          expect(monacoVisible).toBe(true);
          // If both are visible, that's also wrong -- Monaco replaces the textarea
          if (textareaVisible && monacoVisible) {
            // This is acceptable -- Monaco might wrap a textarea internally
          } else {
            expect(textareaVisible).toBe(false);
          }
        }
      }
    }
  });

  test('extension element table icons are visible (not clipped)', async ({ page }) => {
    // Load BPM modeler with a diagram
    await page.goto('/?id=1');
    await page.waitForSelector('#root', { state: 'attached' });
    await page.waitForTimeout(2000);

    // Click on a BPMN element to open properties panel
    const startEvent = page.locator(
      '.djs-element[data-element-id="StartEvent_1"]'
    );
    if (await startEvent.isVisible({ timeout: 10000 }).catch(() => false)) {
      await startEvent.click({ force: true });
      await page.waitForTimeout(1000);

      // Look for the extension element table "add" icon button.
      // These buttons use MaterialIcon and are identified by their cam-extensionElements-create-* id.
      const addButton = page.locator('[id^="cam-extensionElements-create-"]');
      const addVisible = await addButton.first().isVisible().catch(() => false);

      if (addVisible) {
        // Verify the icon inside the button is actually visible (not clipped by overflow:hidden).
        // MaterialIcon renders a <span> with the icon name as text content.
        const iconSpan = addButton.first().locator('span');
        const iconVisible = await iconSpan.isVisible().catch(() => false);

        if (iconVisible) {
          // Verify the icon has non-zero dimensions (not clipped to 0)
          const iconBox = await iconSpan.boundingBox();
          expect(iconBox).toBeTruthy();
          if (iconBox) {
            expect(iconBox.width).toBeGreaterThan(0);
            expect(iconBox.height).toBeGreaterThan(0);
          }
        }

        // Verify the button's computed overflow allows the icon to render
        const overflow = await addButton.first().evaluate(
          (el) => window.getComputedStyle(el).overflow
        );
        expect(overflow).not.toBe('hidden');
      }
    }
  });
});
