/**
 * CSS Integrity Tests for DMN editor.
 *
 * Guards against visual regressions by verifying:
 * 1. Height chain: #root is in the height:100% selector (layout collapse fix)
 * 2. NO global box-sizing: border-box (breaks dmn-js table cell alignment + context menu layout)
 * 3. NO dmn-embedded.css import (not needed, causes font conflicts)
 * 4. .bpmn-property-toggle: CSS selector matches the actual component class name
 * 5. Property toggle uses left:-30px positioning (aligned with BPM)
 * 6. axelor.png exists in public/ (logo rendering)
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

import { describe, it, expect } from "vitest";

const ROOT = resolve(__dirname, "../..");

describe("dmnModeler.css integrity", () => {
  const css = readFileSync(resolve(ROOT, "src/css/dmnModeler.css"), "utf-8");

  it("includes #root in the height:100% selector chain", () => {
    // The height chain must include html, body, #root, #canvas, .App
    // Missing #root caused layout collapse (canvas height: 150px instead of 100%)
    const heightBlock = css.match(/html[\s\S]*?\{[^}]*height:\s*100%[^}]*\}/);
    expect(heightBlock).toBeTruthy();
    expect(heightBlock![0]).toContain("#root");
  });

  it("targets .bpmn-property-toggle (not .property-toggle)", () => {
    // The component uses className="bpmn-property-toggle" (DmnPropertiesDrawer.jsx:70)
    // CSS must match this exact class name
    expect(css).toContain(".bpmn-property-toggle");
    expect(css).not.toMatch(/^\.property-toggle\s*\{/m);
  });

  it("property toggle uses left:-30px positioning (aligned with BPM)", () => {
    // The old left: calc(100% - 29.5px - var(--container-width)) was wrong
    // after the component moved inside the Resizable container
    const toggleBlock = css.match(/\.bpmn-property-toggle\s*\{([^}]*)\}/);
    expect(toggleBlock).toBeTruthy();
    expect(toggleBlock![1]).toContain("left: -30px");
  });

  it("property toggle has transform: rotate(-90deg)", () => {
    const toggleBlock = css.match(/\.bpmn-property-toggle\s*\{([^}]*)\}/);
    expect(toggleBlock).toBeTruthy();
    expect(toggleBlock![1]).toContain("rotate(-90deg)");
  });

  it("property toggle has cursor: pointer", () => {
    const toggleBlock = css.match(/\.bpmn-property-toggle\s*\{([^}]*)\}/);
    expect(toggleBlock).toBeTruthy();
    expect(toggleBlock![1]).toContain("cursor: pointer");
  });

  it("must NOT include global * { box-sizing: border-box } (breaks dmn-js table cells and context menu)", () => {
    // dmn-js decision table CSS expects the browser default content-box.
    // A global box-sizing: border-box changes cell dimensions, breaks centered alignment,
    // and collapses the multi-column context menu into a single column.
    expect(css).not.toMatch(/\*\s*\{[^}]*box-sizing:\s*border-box/);
  });
});

describe("DMNModeler.tsx CSS imports", () => {
  const jsx = readFileSync(resolve(ROOT, "src/DMNModeler.tsx"), "utf-8");

  it("must NOT import dmn-embedded.css (not in original, causes font/style conflicts)", () => {
    // dmn-embedded.css was mistakenly added during Phase 16 extraction.
    // The original DMNModeler.jsx on main did NOT import it.
    // It brings in extra font definitions that conflict with dmn-js default styling.
    expect(jsx).not.toContain("dmn-embedded.css");
  });

  it("imports dmn-font/css/dmn.css for icon font loading", () => {
    // dmn-font/css/dmn.css provides the @font-face declaration for the 'dmn' icon font.
    // Without it, .dmn-icon-plus and all other dmn-icon-* pseudo-elements render as empty boxes.
    // Vite resolves the url() font file references from node_modules correctly.
    expect(jsx).toContain("dmn-font/css/dmn.css");
  });

  it("imports all 7 required dmn-js CSS files", () => {
    const requiredCss = [
      "dmn-js-decision-table-controls.css",
      "dmn-js-decision-table.css",
      "dmn-js-drd.css",
      "dmn-js-literal-expression.css",
      "dmn-js-shared.css",
      "diagram-js.css",
      "dmn-font/css/dmn.css",
    ];

    for (const cssFile of requiredCss) {
      expect(jsx).toContain(cssFile);
    }
  });

  it("imports dmnModeler.css for custom theming", () => {
    expect(jsx).toContain("./css/dmnModeler.css");
  });
});

describe("DMN public assets", () => {
  it("axelor.png exists in public/ directory", () => {
    const pngPath = resolve(ROOT, "public/axelor.png");
    expect(existsSync(pngPath)).toBe(true);
  });
});

describe("DmnPropertiesDrawer component class consistency", () => {
  const drawerJsx = readFileSync(resolve(ROOT, "src/components/DmnPropertiesDrawer.tsx"), "utf-8");

  it("uses bpmn-property-toggle class (matches CSS selector)", () => {
    expect(drawerJsx).toContain('className="bpmn-property-toggle"');
  });

  it("has cursor: pointer via CSS (toggle is clickable)", () => {
    // The component has an onClick handler
    expect(drawerJsx).toContain("onClick");
  });
});

describe("useDmnSheet uses activeEditor injector (not sheet module)", () => {
  const hookCode = readFileSync(resolve(ROOT, "src/hooks/useDmnSheet.ts"), "utf-8");

  it("gets eventBus from activeEditor, not from sheet", () => {
    // The critical line: eventBus must come from the activeEditor injector
    // sheet.get("eventBus") throws TypeError because sheet is a module, not an injector
    expect(hookCode).toContain('activeEditor.get("eventBus")');
    expect(hookCode).not.toContain('sheet.get("eventBus")');
  });
});
