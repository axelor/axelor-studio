/**
 * Stale Closure Guard Tests
 *
 * These tests prevent regression of the stale-closure bug introduced when
 * migrating from module-level `let bpmnModeler = null` to React Context
 * via `useModeler()`.
 *
 * Problem:  useModeler() returns null on the first render (before the
 *           Provider's useEffect creates the instance). Any useCallback
 *           with deps=[] that captures `bpmnModeler` directly freezes null.
 *
 * Solution: Store `bpmnModeler` in a ref (`bpmnModelerRef`) and read
 *           `bpmnModelerRef.current` inside callbacks.
 *
 * Guard #1 — Runtime: proves the ref pattern survives the null→instance
 *            transition while direct capture does not.
 * Guard #2 — Static: scans BpmnModeler.jsx source code and fails if any
 *            useCallback body references `bpmnModeler` (without `.current`).
 */

import fs from "fs";
import path from "path";

import React, { useCallback, useRef } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mock bpmn-js so ModelerProvider can instantiate without real canvas
// ---------------------------------------------------------------------------
const { MockBpmnModeler } = vi.hoisted(() => {
  const MockBpmnModeler = vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    get: vi.fn((svc: string) => {
      if (svc === "canvas") return { zoom: vi.fn(), getContainer: vi.fn() };
      if (svc === "elementRegistry") return { get: vi.fn(), getAll: vi.fn().mockReturnValue([]) };
      if (svc === "eventBus") return { on: vi.fn(), off: vi.fn() };
      if (svc === "linting") return { toggle: vi.fn().mockReturnValue(true), isActive: vi.fn().mockReturnValue(false) };
      return {};
    }),
    getDefinitions: vi.fn().mockReturnValue({ $attrs: {}, rootElements: [] }),
    importXML: vi.fn().mockResolvedValue({}),
    saveXML: vi.fn().mockResolvedValue({ xml: "<xml/>" }),
    saveSVG: vi.fn().mockResolvedValue({ svg: "<svg/>" }),
  }));
  return { MockBpmnModeler };
});

vi.mock("bpmn-js/lib/Modeler", () => ({ default: MockBpmnModeler }));

import { ModelerProvider } from "../context/ModelerContext";
import { useModeler } from "../hooks/useModeler";

// ===========================================================================
// Guard #1 — Runtime: ref vs direct capture after null→instance transition
// ===========================================================================

/**
 * Minimal component that mirrors BpmnModelerInner's two patterns:
 *   - BAD:  useCallback(() => use(bpmnModeler), [])   → stale null
 *   - GOOD: useCallback(() => use(ref.current), [])   → always fresh
 */
function CallbackConsumer({ onResult }: { onResult: (type: string, value: unknown) => void }) {
  const modeler = useModeler();
  const modelerRef = useRef<unknown>(null);
  modelerRef.current = modeler;

  // Pattern A — captures value at callback-creation time (stale after transition)
  const directCapture = useCallback(() => {
    return modeler;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pattern B — reads ref at call time (always latest)
  const refCapture = useCallback(() => {
    return modelerRef.current;
  }, []);

  return (
    <div>
      <button data-testid="trigger-direct" onClick={() => onResult("direct", directCapture())} />
      <button data-testid="trigger-ref" onClick={() => onResult("ref", refCapture())} />
      <span data-testid="modeler-status">{modeler ? "ready" : "null"}</span>
    </div>
  );
}

describe("Guard #1 — Runtime: stale closure detection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("modeler transitions from null to instance after Provider mount", async () => {
    await act(async () => {
      render(
        <ModelerProvider config={{}}>
          <CallbackConsumer onResult={() => {}} />
        </ModelerProvider>,
      );
    });

    expect(screen.getByTestId("modeler-status").textContent).toBe("ready");
    expect(MockBpmnModeler).toHaveBeenCalledTimes(1);
  });

  it("direct capture useCallback returns NULL after transition (demonstrates bug)", async () => {
    const results: Record<string, unknown> = {};
    const onResult = (type: string, value: unknown) => {
      results[type] = value;
    };

    await act(async () => {
      render(
        <ModelerProvider config={{}}>
          <CallbackConsumer onResult={onResult} />
        </ModelerProvider>,
      );
    });

    // Modeler is available — status confirms it
    expect(screen.getByTestId("modeler-status").textContent).toBe("ready");

    // But the direct-capture callback still returns null (stale closure)
    act(() => fireEvent.click(screen.getByTestId("trigger-direct")));
     
    expect(results.direct).toBeNull();
  });

  it("ref-based useCallback returns the REAL instance after transition (the fix)", async () => {
    const results: Record<string, unknown> = {};
    const onResult = (type: string, value: unknown) => {
      results[type] = value;
    };

    await act(async () => {
      render(
        <ModelerProvider config={{}}>
          <CallbackConsumer onResult={onResult} />
        </ModelerProvider>,
      );
    });

    act(() => fireEvent.click(screen.getByTestId("trigger-ref")));
    expect(results.ref).not.toBeNull();
    expect((results.ref as Record<string, unknown>).importXML).toBeDefined();
    expect((results.ref as Record<string, unknown>).get).toBeDefined();
  });

  it("ref always returns a non-null modeler instance on every click", async () => {
    const capturedValues: unknown[] = [];
    const onResult = (_type: string, value: unknown) => capturedValues.push(value);

    await act(async () =>
      render(
        <ModelerProvider config={{}}>
          <CallbackConsumer onResult={onResult} />
        </ModelerProvider>,
      ),
    );

    // Click multiple times — ref must return a real instance every time
    act(() => fireEvent.click(screen.getByTestId("trigger-ref")));
    act(() => fireEvent.click(screen.getByTestId("trigger-ref")));
    act(() => fireEvent.click(screen.getByTestId("trigger-ref")));

    expect(capturedValues).toHaveLength(3);
    capturedValues.forEach((val: unknown, idx: number) => {
      expect(val, `click ${idx + 1} returned null`).not.toBeNull();
      expect((val as Record<string, unknown>).importXML, `click ${idx + 1} missing importXML`).toBeDefined();
    });
  });
});

// ===========================================================================
// Guard #2 — Static: scan source for unsafe direct bpmnModeler usage
// ===========================================================================

describe("Guard #2 — Static: useCallback must not capture bpmnModeler directly", () => {
  const BPMN_MODELER_PATH = path.resolve(__dirname, "..", "BpmnModeler.tsx");

  const HOOK_FILES = [
    path.resolve(__dirname, "..", "hooks", "useBpmnDiagram.ts"),
    path.resolve(__dirname, "..", "hooks", "useDiagramLifecycle.ts"),
    path.resolve(__dirname, "..", "hooks", "useDiagramPersistence.ts"),
    path.resolve(__dirname, "..", "hooks", "useWkfManagement.ts"),
    path.resolve(__dirname, "..", "hooks", "useViewControls.ts"),
  ];

  /**
   * Extracts all useCallback bodies and checks that none reference
   * the bare `bpmnModeler` identifier (only `bpmnModelerRef.current`
   * or passing it as an argument is safe).
   *
   * Strategy: find `useCallback(` blocks, extract until matching `, [`,
   * then check for `bpmnModeler` that is NOT `bpmnModelerRef`.
   */
  function findUnsafeCallbacks(source: string) {
    const violations = [];
    // Match useCallback( ... , [ ... ])  — greedy but good enough for linting
    const callbackRegex = /(?:React\.)?useCallback\(\s*(?:async\s+)?\(([^)]*)\)\s*=>\s*\{/g;

    let match;
    while ((match = callbackRegex.exec(source)) !== null) {
      const startIdx = match.index + match[0].length;
      // Walk forward counting braces to find the end of the callback body
      let depth = 1;
      let i = startIdx;
      while (i < source.length && depth > 0) {
        if (source[i] === "{") depth++;
        if (source[i] === "}") depth--;
        i++;
      }
      const body = source.slice(startIdx, i - 1);
      const lineNumber = source.slice(0, match.index).split("\n").length;

      // Check for bare `bpmnModeler` usage (not `bpmnModelerRef`)
      // Negative lookbehind: not preceded by `Ref.current` context
      // Negative lookahead: not followed by `Ref`
      const unsafePattern = /\bbpmnModeler\b(?!Ref)/g;
      let unsafeMatch;
      while ((unsafeMatch = unsafePattern.exec(body)) !== null) {
        // Skip if it's a parameter name (e.g., function(bpmnModeler))
        const params = match[1] || "";
        if (params.includes("bpmnModeler")) continue;

        // Get line within body for better reporting
        const bodyLineOffset = body.slice(0, unsafeMatch.index).split("\n").length;
        violations.push({
          line: lineNumber + bodyLineOffset,
          snippet: body.slice(Math.max(0, unsafeMatch.index - 30), unsafeMatch.index + 40).trim(),
        });
      }
    }
    return violations;
  }

  it("BpmnModeler.jsx has no useCallback with direct bpmnModeler reference", () => {
    const source = fs.readFileSync(BPMN_MODELER_PATH, "utf-8");
    const violations = findUnsafeCallbacks(source);

    if (violations.length > 0) {
      const report = violations.map((v) => `  Line ~${v.line}: ...${v.snippet}...`).join("\n");
      expect.fail(
        `Found ${violations.length} useCallback(s) capturing \`bpmnModeler\` directly ` +
          `instead of \`bpmnModelerRef.current\`:\n${report}\n\n` +
          `Fix: replace \`bpmnModeler\` with \`bpmnModelerRef.current\` inside the callback body.`,
      );
    }
  });

  it("bpmnModelerRef is defined early in useBpmnDiagram hook (business logic location)", () => {
    // After extraction, the ref pattern lives in the useBpmnDiagram hook
    const hookPath = path.resolve(__dirname, "..", "hooks", "useBpmnDiagram.ts");
    const hookSource = fs.readFileSync(hookPath, "utf-8");
    expect(hookSource).toContain("const bpmnModelerRef = useRef<");
    expect(hookSource).toContain("bpmnModelerRef.current = bpmnModeler");
  });

  it("domain hooks have no useCallback with direct bpmnModeler reference", () => {
    const allViolations: Array<{ file: string; line: number; snippet: string }> = [];

    for (const filePath of HOOK_FILES) {
      if (!fs.existsSync(filePath)) continue;
      const source = fs.readFileSync(filePath, "utf-8");
      const violations = findUnsafeCallbacks(source);
      for (const v of violations) {
        allViolations.push({ file: path.basename(filePath), ...v });
      }
    }

    if (allViolations.length > 0) {
      const report = allViolations
        .map((v) => `  ${v.file} Line ~${v.line}: ...${v.snippet}...`)
        .join("\n");
      expect.fail(
        `Found ${allViolations.length} useCallback(s) capturing \`bpmnModeler\` directly:\n${report}\n\n` +
          `Fix: replace \`bpmnModeler\` with \`bpmnModelerRef.current\` inside the callback body.`,
      );
    }
  });
});
