import { test, expect } from '../../../shared/setup.ts';
import { bpmHandlers } from '../../handlers.ts';
import { http, HttpResponse } from 'msw';

/**
 * Characterization E2E Test: Save Flow
 *
 * Verifies the real UI interaction path for saving a BPMN diagram.
 * Uses MSW network.use() for runtime handler override to capture
 * the outgoing save request payload.
 *
 * This locks down the save behavior as observed through the browser:
 * 1. Ctrl+S triggers the save action
 * 2. A POST request is sent to ws/rest/com.axelor.studio.db.WkfModel
 * 3. The payload contains the diagram XML
 */

test.use({ handlerConfig: { list: bpmHandlers } });

test.describe('Characterization: Save Flow E2E', () => {
  test('Ctrl+S triggers save and sends XML payload to WkfModel REST endpoint', async ({ page, network }) => {
    let capturedPayload: Record<string, unknown> | null = null;

    await network.use(
      http.post('*/ws/rest/com.axelor.studio.db.WkfModel', async ({ request }) => {
        capturedPayload = await request.json() as Record<string, unknown>;
        return HttpResponse.json({
          status: 0,
          data: [{
            id: 1,
            version: 1,
            name: 'Test Process',
            code: 'test-process',
            diagramXml: '',
            statusSelect: 1,
          }],
        });
      })
    );

    await page.goto('/?id=1', { waitUntil: 'domcontentloaded' });

    // Wait for the canvas to be ready
    const canvas = page.locator('.djs-container');
    await expect(canvas).toBeVisible({ timeout: 15000 });

    // Wait for BPMN elements to render (confirms diagram is loaded)
    await page.locator('[data-element-id="StartEvent_1"]').waitFor({ state: 'attached', timeout: 10000 });

    // Trigger save via Ctrl+S
    await page.keyboard.press('Control+s');

    // Wait for the app to process the save
    await page.waitForTimeout(2000);

    // Verify the captured payload contains diagram XML
    expect(capturedPayload).toBeTruthy();
    const data = (capturedPayload as { data: { diagramXml: string } }).data;
    expect(data.diagramXml).toContain('bpmn');
    expect(data.diagramXml).toContain('StartEvent_1');
  });

  test('save payload includes WkfModel ID and diagram properties', async ({ page, network }) => {
    let capturedPayload: Record<string, unknown> | null = null;

    await network.use(
      http.post('*/ws/rest/com.axelor.studio.db.WkfModel', async ({ request }) => {
        capturedPayload = await request.json() as Record<string, unknown>;
        return HttpResponse.json({
          status: 0,
          data: [{
            id: 1,
            version: 1,
            name: 'Test Process',
            code: 'test-process',
            diagramXml: '',
            statusSelect: 1,
          }],
        });
      })
    );

    await page.goto('/?id=1', { waitUntil: 'domcontentloaded' });

    const canvas = page.locator('.djs-container');
    await expect(canvas).toBeVisible({ timeout: 15000 });

    await page.locator('[data-element-id="StartEvent_1"]').waitFor({ state: 'attached', timeout: 10000 });

    await page.keyboard.press('Control+s');
    await page.waitForTimeout(2000);

    // Verify the payload includes model identification
    expect(capturedPayload).toBeTruthy();
    const data = (capturedPayload as { data: { id: number; name: string; code: string } }).data;
    expect(data.id).toBe(1);
    // Name and code are extracted from _definitions.$attrs
    expect(data.name).toBeDefined();
    expect(data.code).toBeDefined();
  });
});
