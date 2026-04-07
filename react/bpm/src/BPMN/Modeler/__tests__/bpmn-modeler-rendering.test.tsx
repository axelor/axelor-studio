/**
 * Structural Guard Tests for BpmnModeler UI
 *
 * These tests scan the REAL source files and verify that critical DOM elements
 * exist in the JSX. They replaced the original rendering tests because the
 * BpmnModeler component has deep async hook chains that hang in jsdom, and
 * cross-package React duplication (pnpm strict isolation) makes full rendering
 * unreliable in unit tests.
 *
 * The E2E tests (e2e/) cover the actual rendered output. These guards prevent
 * regressions during decomposition by verifying that the JSX template still
 * references all critical IDs, components, and structural elements.
 *
 * History: Phase 4 decomposition was reverted 4 times due to:
 *   - Toolbar empty (no buttons)
 *   - Canvas container missing
 *   - Properties panel missing
 *   - Footer missing
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect } from "vitest";

const MODELER_DIR = resolve(__dirname, "..");
const readModelerFile = (name: string) =>
  readFileSync(resolve(MODELER_DIR, name), "utf-8");

const innerSrc = readModelerFile("BpmnModelerInner.tsx");
const outerSrc = readModelerFile("BpmnModeler.tsx");

describe("BpmnModeler Structural Guards", () => {
  it("BpmnModeler wraps BpmnModelerInner in a ModelerProvider", () => {
    expect(outerSrc).toContain("ModelerProvider");
    expect(outerSrc).toContain("BpmnModelerInner");
  });

  it("renders the #bpmncontainer wrapper", () => {
    expect(innerSrc).toContain('id="bpmncontainer"');
  });

  it("renders BpmnCanvas (which contains the #bpmnview div)", () => {
    expect(innerSrc).toContain("BpmnCanvas");
  });

  it("renders BpmnTopToolbar with toolbar items", () => {
    expect(innerSrc).toContain("BpmnTopToolbar");
    expect(innerSrc).toContain("leftToolbar");
    expect(innerSrc).toContain("rightToolbar");
  });

  it("renders PropertiesDrawer for the properties panel", () => {
    expect(innerSrc).toContain("PropertiesDrawer");
    expect(innerSrc).toContain("drawerOpen");
  });

  it("renders BpmnFooter with issues toggle", () => {
    expect(innerSrc).toContain("BpmnFooter");
    expect(innerSrc).toContain("onToggle");
  });

  it("renders IssuePanel for error/warning display", () => {
    expect(innerSrc).toContain("IssuePanel");
    expect(innerSrc).toContain("issues");
  });

  it("renders SnackbarNotification", () => {
    expect(innerSrc).toContain("SnackbarNotification");
    expect(innerSrc).toContain("useSnackbarStore");
  });

  it("renders DeployDialog conditionally", () => {
    expect(innerSrc).toContain("DeployDialog");
    expect(innerSrc).toContain("openDelopyDialog");
  });

  it("renders ProgressOverlay for deployment progress", () => {
    expect(innerSrc).toContain("ProgressOverlay");
    expect(innerSrc).toContain("allowProgressBarDisplay");
  });

  it("renders BpmnBottomToolbar", () => {
    expect(innerSrc).toContain("BpmnBottomToolbar");
    expect(innerSrc).toContain("bottomToolbar");
  });

  it("renders TimerEvents conditionally (Suspense-wrapped)", () => {
    expect(innerSrc).toContain("Suspense");
    expect(innerSrc).toContain("TimerEvents");
    expect(innerSrc).toContain("isTimerTask");
  });

  it("wraps content in BpmnActionsContext.Provider", () => {
    expect(innerSrc).toContain("BpmnActionsContext.Provider");
    expect(innerSrc).toContain("bpmnActions");
  });
});
