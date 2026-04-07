/**
 * Linting Timing Guard Tests (LINT-01)
 *
 * These tests ensure that bpmnlint starts INACTIVE when the modeler loads,
 * and only activates on explicit user action (e.g. elements.changed or
 * tool panel toggle). This prevents linting noise on empty/initial diagrams.
 *
 * RED phase: All tests fail against the current codebase because:
 *   - BpmnModeler.tsx has active: true (should be false)
 *   - useModelerEvents.ts uses _setActive(true) (should use linting.toggle(true))
 *   - useViewControls.ts uses _setActive (should use linting.toggle)
 */

import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";

const MODELER_PATH = path.resolve(__dirname, "..", "BpmnModeler.tsx");
const USE_MODELER_EVENTS_PATH = path.resolve(__dirname, "..", "hooks", "useModelerEvents.ts");
const USE_VIEW_CONTROLS_PATH = path.resolve(__dirname, "..", "hooks", "useViewControls.ts");

describe("LINT-01: Linting starts inactive and activates on user action", () => {
  it("modelerConfig has linting.active set to false", () => {
    const source = fs.readFileSync(MODELER_PATH, "utf-8");

    // Extract the linting config block
    const lintingMatch = source.match(/linting:\s*\{[^}]*\}/s);
    expect(lintingMatch, "Could not find linting config block in BpmnModeler.tsx").toBeTruthy();

    const lintingBlock = lintingMatch![0];
    // active must be false, not true
    expect(lintingBlock).toContain("active: false");
    expect(lintingBlock).not.toContain("active: true");
  });

  it("elements.changed handler calls linting.toggle(true), not _setActive", () => {
    const source = fs.readFileSync(USE_MODELER_EVENTS_PATH, "utf-8");

    // Find the elements.changed event handler block
    const elemChangedIdx = source.indexOf('"elements.changed"');
    expect(elemChangedIdx, "Could not find elements.changed event handler").toBeGreaterThan(-1);

    // Extract a reasonable chunk after the event name to cover the handler body
    const handlerBlock = source.slice(elemChangedIdx, elemChangedIdx + 500);

    // Should use the typed toggle() API
    expect(handlerBlock).toContain("linting.toggle(true)");
    // Should NOT use the untyped _setActive internal API
    expect(handlerBlock).not.toContain("_setActive");
  });

  it("useViewControls uses linting.toggle(), not _setActive", () => {
    const source = fs.readFileSync(USE_VIEW_CONTROLS_PATH, "utf-8");

    // Should use toggle(false) and toggle(true) for panel open/close
    expect(source).toContain("linting.toggle(false)");
    expect(source).toContain("linting.toggle(true)");
    // Should NOT use _setActive at all
    expect(source).not.toContain("_setActive");
  });
});
