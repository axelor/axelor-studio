/**
 * Viewer Diagram Loading Guard
 *
 * Protects against the timing regression introduced during decomposition
 * (commit 69310af0): the diagram-loading useEffect in BpmnViewerInner must
 * depend on the `viewer` instance so it only fires AFTER the parent
 * BpmnViewerComponent has created the bpmn-js Modeler.
 *
 * Without `viewer` in the dependency array, React's bottom-up effect
 * execution order means the child effect runs before the parent sets
 * viewerRef.current, causing fetchInstanceDiagram to silently skip
 * (viewerRef.current === null) and leaving the canvas empty.
 */
import { readFileSync } from "fs";
import { resolve } from "path";

import { describe, it, expect } from "vitest";

const ROOT = resolve(__dirname, "../../..");

describe("BpmnViewerInner — diagram loading timing guard", () => {
  const code = readFileSync(resolve(ROOT, "BPMN/Viewer/BpmnViewerInner.tsx"), "utf-8");

  it("diagram-loading useEffect must depend on `viewer`", () => {
    // Strategy: find the dependency array line that follows the fetch calls.
    // The useEffect containing fetchInstanceDiagram must have `viewer` in its deps.
    const lines = code.split("\n");
    let foundFetch = false;
    let depsLine = "";

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("fetchInstanceDiagram(")) {
        foundFetch = true;
      }
      // After finding the fetch call, look for the closing `}, [...])`
      if (foundFetch && /^\s*\},\s*\[/.test(lines[i])) {
        depsLine = lines[i];
        break;
      }
    }

    expect(foundFetch).toBe(true);
    expect(depsLine).toContain("viewer");
  });

  it("diagram-loading useEffect must early-return when viewer is null", () => {
    // The effect body must contain an early return guard on viewer
    // Find lines between the useEffect opening and its dependency array
    const lines = code.split("\n");
    let inDiagramEffect = false;
    let foundGuard = false;

    for (const line of lines) {
      if (line.includes("fetchInstanceDiagram") || line.includes("fetchDiagram")) {
        inDiagramEffect = true;
      }
      if (inDiagramEffect && /if\s*\(\s*!viewer\s*\)\s*return/.test(line)) {
        foundGuard = true;
        break;
      }
    }

    expect(foundGuard).toBe(true);
  });
});

describe("BpmnViewerComponent — viewer creation timing", () => {
  const code = readFileSync(resolve(ROOT, "BPMN/Viewer/BpmnViewer.tsx"), "utf-8");

  it("must create BpmnModeler in a useEffect (not during render)", () => {
    // new BpmnModeler must appear inside a useEffect, not at top level
    const hasModelerInEffect = /useEffect\(\s*\(\)\s*=>\s*\{[^}]*new BpmnModeler\b/.test(code);
    expect(hasModelerInEffect).toBe(true);
  });

  it("must call setViewer after creating the instance", () => {
    // Ensures the state update triggers child re-render with non-null viewer
    const hasSetViewer = /setViewer\(\s*instance\s*\)/.test(code);
    expect(hasSetViewer).toBe(true);
  });
});
