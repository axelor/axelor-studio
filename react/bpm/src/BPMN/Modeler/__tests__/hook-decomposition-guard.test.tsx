/**
 * Hook Decomposition Guard Tests (Phase 24)
 *
 * Structural tests that detect behavioral regressions introduced by
 * decomposing useBpmnDiagram into domain hooks. These are NOT functional
 * tests — they statically analyze the source code to catch:
 *
 * 1. Missing API surface (properties removed from facade return)
 * 2. Broken function chains (return values lost, calls dropped)
 * 3. Cross-hook wiring errors (deps not passed between hooks)
 *
 * These tests would have caught the newVersionOnDeploy regression where
 * addNewVersion stopped returning the WkfModel and deploy stopped
 * chaining startAction for new version deployment.
 */
import fs from "fs";
import path from "path";

import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// File paths
// ---------------------------------------------------------------------------
const HOOKS_DIR = path.resolve(__dirname, "..", "hooks");
const FACADE_PATH = path.join(HOOKS_DIR, "useBpmnDiagram.ts");
const LIFECYCLE_PATH = path.join(HOOKS_DIR, "useDiagramLifecycle.ts");
const PERSISTENCE_PATH = path.join(HOOKS_DIR, "useDiagramPersistence.ts");
const WKF_MGMT_PATH = path.join(HOOKS_DIR, "useWkfManagement.ts");
const VIEW_CONTROLS_PATH = path.join(HOOKS_DIR, "useViewControls.ts");

function readFile(p: string): string {
  return fs.readFileSync(p, "utf-8");
}

// ===========================================================================
// Guard #3 — API Surface: facade must export every property consumers expect
// ===========================================================================
describe("Guard #3 — API Surface completeness", () => {
  /**
   * Canonical list of properties that BpmnModelerInner.tsx and other
   * consumers destructure from useBpmnDiagram(). If a property is removed
   * from ANY hook's return, the facade spread won't include it.
   *
   * Update this list ONLY when an API change is intentional.
   */
  const REQUIRED_API = [
    // State
    "isXmlEditorOpen", "setXmlEditorOpen",
    "issuePanelHeight", "setIssuePanelHeight",
    "isOpen", "setIsOpen",
    "issues", "setIssues",
    "openDelopyDialog", "setDelopyDialog",
    "ids",
    "initialState", "isTimerTask",
    "initialStateRef", "diagramXmlRef",
    // Snackbar
    "handleSnackbarClick", "handleSnackbarClose",
    // Lifecycle
    "openBpmnDiagram", "newBpmnDiagram", "fetchDiagram",
    "initializeDiagram", "uploadFile", "addDiagramProperties",
    "updateTabs", "addNewDiagram",
    // Persistence
    "onSave", "deploy", "deployDiagram", "handleOk",
    "addNewVersion", "checkIfUpdated", "getBase64SVG",
    // WKF management
    "updateWkfModel", "onNew", "onRefresh", "onDelete",
    "reloadView", "getModels",
    // View controls
    "toggleXmlEditor", "toggleMinimap", "zoomIn", "zoomOut",
    "resetViewport", "enterFullscreen",
    "handleToolPanelToggle", "handleToolPanelClose",
    "updateElementpaletteHeight",
    "handleMenuActionTab", "handleChange",
    "updateCommentsCount", "alertUser",
    // Extension elements
    "createParent", "addProperty", "handleAdd",
    "addCallActivityExtensionElement",
    // Toolbars
    "leftToolbar", "rightToolbar", "bottomToolbar",
  ];

  /**
   * Collect all properties from hook returns + facade explicit properties.
   * This scans the actual source to find what the spread operators expose.
   */
  function collectExportedProperties(): Set<string> {
    const props = new Set<string>();

    // From each domain hook's return statement
    for (const hookPath of [LIFECYCLE_PATH, PERSISTENCE_PATH, WKF_MGMT_PATH, VIEW_CONTROLS_PATH]) {
      const src = readFile(hookPath);
      const returnMatch = src.match(/return\s*\{([^}]+)\}\s*;?\s*\n\}/s);
      if (returnMatch) {
        const returnBody = returnMatch[1];
        // Match property names: "propName," or "propName:" at start of line
        const propMatches = returnBody.matchAll(/^\s+(\w+)[,:\s]/gm);
        for (const m of propMatches) {
          if (m[1] !== "return" && m[1] !== "get") {
            props.add(m[1]);
          }
        }
      }
    }

    // From facade's explicit return properties (not spreads)
    const facadeSrc = readFile(FACADE_PATH);
    const facadeReturn = facadeSrc.match(/return\s*\{([\s\S]+)\}\s*;?\s*\n\}/);
    if (facadeReturn) {
      const body = facadeReturn[1];
      const explicitProps = body.matchAll(/^\s+(\w+)[,:]/gm);
      for (const m of explicitProps) {
        if (!m[1].startsWith("//") && m[1] !== "return" && m[1] !== "get") {
          props.add(m[1]);
        }
      }
    }

    return props;
  }

  it("every required API property is exported by at least one hook or the facade", () => {
    const exported = collectExportedProperties();
    const missing = REQUIRED_API.filter((prop) => !exported.has(prop));

    if (missing.length > 0) {
      expect.fail(
        `Missing API properties from useBpmnDiagram facade:\n` +
        `  ${missing.join(", ")}\n\n` +
        `These properties were in the original monolith return statement.\n` +
        `If removal is intentional, update REQUIRED_API in this test.`,
      );
    }
  });
});

// ===========================================================================
// Guard #4 — Deploy chain: critical function chains must be intact
// ===========================================================================
describe("Guard #4 — Deploy chain integrity", () => {
  const persistenceSrc = readFile(PERSISTENCE_PATH);

  it("addNewVersion returns a WkfModel (not void)", () => {
    // The deploy chain requires addNewVersion to return the created WkfModel
    // so deploy() can pass it to startAction for actual deployment.
    // Regression: addNewVersion returning void causes new versions to be
    // created but never deployed (requires two clicks).
    expect(persistenceSrc).toMatch(
      /addNewVersion.*Promise<WkfModel\s*\|\s*undefined>/,
    );
  });

  it("addNewVersion returns fetchDiagram result (not just calling it)", () => {
    // Must be "return await fetchDiagram" not just "await fetchDiagram"
    expect(persistenceSrc).toMatch(/return\s+await\s+fetchDiagram/);
  });

  it("deploy() calls startAction after addNewVersion for willCreateNewVersion path", () => {
    // Extract the deploy function body
    const deployFn = extractFunctionBody(persistenceSrc, "deploy");
    expect(deployFn).toBeTruthy();

    // The willCreateNewVersion branch must call startAction
    expect(deployFn).toContain("willCreateNewVersion");
    expect(deployFn!).toContain("addNewVersion");
    expect(deployFn).toContain("startAction");

    // Verify the chain: addNewVersion → check statusSelect → startAction
    const addNewVersionIdx = deployFn!.indexOf("addNewVersion");
    const startActionIdx = deployFn!.indexOf("startAction", addNewVersionIdx);
    expect(startActionIdx).toBeGreaterThan(addNewVersionIdx);
  });

  it("deploy() initializes WebSocket progress for new version before startAction", () => {
    const deployFn = extractFunctionBody(persistenceSrc, "deploy");
    // After addNewVersion, before startAction, must init wsProgress
    expect(deployFn).toMatch(
      /addNewVersion[\s\S]*?wsProgress\.init[\s\S]*?startAction/,
    );
  });

  it("handleOk calls deploy with saved WKF data (not stale)", () => {
    const handleOkFn = extractFunctionBody(persistenceSrc, "handleOk");
    expect(handleOkFn).toBeTruthy();

    // handleOk must: saveXML → saveCurrentWkf → deploy(migrationMap, migrateOld, savedWkf)
    expect(handleOkFn).toContain("saveXML");
    expect(handleOkFn).toContain("saveCurrentWkf");
    expect(handleOkFn).toMatch(/deploy\(\s*\n?\s*wkfMigrationMap/);
  });

  it("deployDiagram sets both ids and openDeployDialog in store", () => {
    const deployDiagramFn = extractFunctionBody(persistenceSrc, "deployDiagram");
    expect(deployDiagramFn).toBeTruthy();
    expect(deployDiagramFn).toContain("setIds");
    expect(deployDiagramFn).toContain("setOpenDeployDialog(true)");
  });
});

// ===========================================================================
// Guard #5 — Cross-hook wiring: dependencies must flow correctly
// ===========================================================================
describe("Guard #5 — Cross-hook dependency wiring", () => {
  const facadeSrc = readFile(FACADE_PATH);

  it("persistence receives lifecycle.fetchDiagram", () => {
    expect(facadeSrc).toMatch(/useDiagramPersistence\(\{[\s\S]*?fetchDiagram:\s*lifecycle\.fetchDiagram/);
  });

  it("persistence receives lifecycle.newBpmnDiagram", () => {
    expect(facadeSrc).toMatch(/useDiagramPersistence\(\{[\s\S]*?newBpmnDiagram:\s*lifecycle\.newBpmnDiagram/);
  });

  it("persistence receives lifecycle.addDiagramProperties", () => {
    expect(facadeSrc).toMatch(/useDiagramPersistence\(\{[\s\S]*?addDiagramProperties:\s*lifecycle\.addDiagramProperties/);
  });

  it("wkfMgmt receives persistence.checkIfUpdated", () => {
    expect(facadeSrc).toMatch(/useWkfManagement\(\{[\s\S]*?checkIfUpdated:\s*persistence\.checkIfUpdated/);
  });

  it("wkfMgmt no longer receives setDirty (consolidated in useWkfStore)", () => {
    expect(facadeSrc).not.toMatch(/setDirty:\s*viewControls\.setDirty/);
  });

  it("hook composition order: lifecycle → persistence → viewControls → wkfMgmt", () => {
    const lifecycleIdx = facadeSrc.indexOf("useDiagramLifecycle(");
    const persistenceIdx = facadeSrc.indexOf("useDiagramPersistence(");
    const viewControlsIdx = facadeSrc.indexOf("useViewControls(");
    const wkfMgmtIdx = facadeSrc.indexOf("useWkfManagement(");

    expect(lifecycleIdx).toBeGreaterThan(-1);
    expect(persistenceIdx).toBeGreaterThan(lifecycleIdx);
    expect(viewControlsIdx).toBeGreaterThan(persistenceIdx);
    expect(wkfMgmtIdx).toBeGreaterThan(viewControlsIdx);
  });
});

// ===========================================================================
// Guard #6 — Save flow: validation chain must be complete
// ===========================================================================
describe("Guard #6 — Save flow integrity", () => {
  const persistenceSrc = readFile(PERSISTENCE_PATH);

  it("onSave validates name+code before saving", () => {
    const onSaveFn = extractFunctionBody(persistenceSrc, "onSave");
    expect(onSaveFn).toContain("validateNameAndCode");
  });

  it("onSave validates timer events before saving", () => {
    const onSaveFn = extractFunctionBody(persistenceSrc, "onSave");
    expect(onSaveFn).toContain("validateTimerEvents");
  });

  it("onSave validates nodes before saving", () => {
    const onSaveFn = extractFunctionBody(persistenceSrc, "onSave");
    expect(onSaveFn).toContain("validateNodes");
  });

  it("onSave updates diagramXmlRef after successful save", () => {
    const onSaveFn = extractFunctionBody(persistenceSrc, "onSave");
    expect(onSaveFn).toContain("diagramXmlRef.current = xml");
  });

  it("onSave calls setDirty(false) via store after successful save", () => {
    const onSaveFn = extractFunctionBody(persistenceSrc, "onSave");
    expect(onSaveFn).toContain("useWkfStore.getState().setDirty(false)");
  });
});

// ===========================================================================
// Guard #7 — Lifecycle: fetchDiagram returns WkfModel for callers
// ===========================================================================
describe("Guard #7 — Lifecycle return values", () => {
  const lifecycleSrc = readFile(LIFECYCLE_PATH);

  it("fetchDiagram returns WkfModel (not void)", () => {
    expect(lifecycleSrc).toMatch(
      /fetchDiagram[\s\S]*?Promise<WkfModel\s*\|\s*undefined>/,
    );
  });

  it("fetchDiagram has generationRef race condition guard", () => {
    expect(lifecycleSrc).toContain("generationRef");
    expect(lifecycleSrc).toMatch(/generationRef\.current\s*!==\s*generation/);
  });

  it("fetchDiagram returns wkf when id is provided", () => {
    // Must contain "return wkf" inside the id branch
    const fetchFn = extractFunctionBody(lifecycleSrc, "fetchDiagram");
    expect(fetchFn).toMatch(/return\s+wkf/);
  });
});

// ===========================================================================
// Guard #8 — File upload: input reset + memoization
// ===========================================================================
describe("Guard #8 — File upload integrity", () => {
  const lifecycleSrc = readFile(LIFECYCLE_PATH);

  it("uploadFile resets input value after file selection (prevents same-file bug)", () => {
    // Without e.target.value = "" reset, selecting the same file after
    // clicking "New" won't trigger onChange (standard HTML5 behavior).
    const uploadFn = extractFunctionBody(lifecycleSrc, "uploadFile");
    expect(uploadFn).toBeTruthy();
    expect(uploadFn).toContain('e.target.value = ""');
  });

  it("uploadFile is wrapped in useCallback for stable reference", () => {
    // Without useCallback, uploadFile creates a new reference each render,
    // causing unnecessary BpmnTopToolbar re-renders.
    expect(lifecycleSrc).toMatch(/const\s+uploadFile\s*=\s*useCallback/);
  });

  it("uploadFile calls openBpmnDiagram with isDeploy=false", () => {
    const uploadFn = extractFunctionBody(lifecycleSrc, "uploadFile");
    expect(uploadFn).toContain("openBpmnDiagram");
    expect(uploadFn).toMatch(/openBpmnDiagram\(.*false\)/);
  });
});

// ===========================================================================
// Guard #9 — Zero direct Service.add('WkfModel') in hooks (non-deploy)
// ===========================================================================
describe("Guard #9 — No direct Service.add('WkfModel') in hooks (except deploy path)", () => {
  it("no direct Service.add('WkfModel') calls in hook files (deploy path excluded from this check)", () => {
    // All non-deploy Service.add("WkfModel") calls must go through wkf-repository.ts
    // The deploy path (saveBeforeDeploy, handleOk) is migrated in Plan 02
    const hookFiles = [LIFECYCLE_PATH, WKF_MGMT_PATH, VIEW_CONTROLS_PATH];
    for (const hookPath of hookFiles) {
      const src = readFile(hookPath);
      expect(src).not.toContain('Service.add("com.axelor.studio.db.WkfModel"');
      expect(src).not.toContain("Service.add('com.axelor.studio.db.WkfModel'");
    }
  });
});

// ===========================================================================
// Helpers
// ===========================================================================

/**
 * Extract function body from source by name.
 * Handles: const name = useCallback(async (...) => { ... }
 *          const name = useCallback((...) => { ... }
 *          function name(...) { ... }
 *          async function name(...) { ... }
 */
function extractFunctionBody(source: string, fnName: string): string | null {
  // Try useCallback pattern first
  const callbackPattern = new RegExp(
    `const\\s+${fnName}\\s*=\\s*useCallback\\(\\s*(?:async\\s+)?(?:function\\s+\\w+)?\\s*\\([^)]*\\)(?:\\s*:\\s*[^=]*?)?\\s*=>\\s*\\{`,
  );
  let match = callbackPattern.exec(source);

  // Try regular function pattern
  if (!match) {
    const fnPattern = new RegExp(
      `(?:async\\s+)?function\\s+${fnName}\\s*\\([^)]*\\)(?:\\s*:\\s*[^{]*)?\\s*\\{`,
    );
    match = fnPattern.exec(source);
  }

  // Try arrow without useCallback
  if (!match) {
    const arrowPattern = new RegExp(
      `const\\s+${fnName}\\s*=\\s*(?:async\\s+)?\\([^)]*\\)(?:\\s*:\\s*[^=]*?)?\\s*=>\\s*\\{`,
    );
    match = arrowPattern.exec(source);
  }

  if (!match) return null;

  const startIdx = match.index + match[0].length;
  let depth = 1;
  let i = startIdx;
  while (i < source.length && depth > 0) {
    if (source[i] === "{") depth++;
    if (source[i] === "}") depth--;
    i++;
  }
  return source.slice(startIdx, i - 1);
}
