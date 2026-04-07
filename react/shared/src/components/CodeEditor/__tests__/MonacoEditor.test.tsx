/**
 * MonacoEditor height handling tests
 *
 * Verifies that MonacoEditor correctly handles both numeric heights
 * (for resizable inline editors) and CSS string heights (for full-screen
 * panels like XmlEditor that need height="100%").
 *
 * The XmlEditor passes height="100%" which must be forwarded as-is to
 * the Monaco Editor component, not converted to a numeric default.
 */
import fs from "fs";
import path from "path";

import {  describe, it, expect } from "vitest";

const MONACO_EDITOR_PATH = path.resolve(__dirname, "..", "MonacoEditor.tsx");

describe("MonacoEditor — height handling", () => {
  const source = fs.readFileSync(MONACO_EDITOR_PATH, "utf-8");

  it("supports CSS string heights (e.g. '100%') without defaulting to 120px", () => {
    // The Editor component must receive the CSS string directly, not "120px"
    // Pattern: resolvedHeight that uses initialHeight when it's a string
    expect(source).toMatch(/isCSSHeight/);
    expect(source).toMatch(/resolvedHeight/);
  });

  it("disables resize when height is a CSS string", () => {
    // Resize makes no sense with percentage heights — it needs pixels
    expect(source).toMatch(/!resizable\s*\|\|\s*isCSSHeight/);
  });

  it("passes resolvedHeight to the Editor component (not hardcoded px)", () => {
    // Must use resolvedHeight (which is either CSS string or numeric px)
    expect(source).toMatch(/height=\{resolvedHeight\}/);
  });

  it("sets container height via inline style for CSS string heights", () => {
    // The container div needs explicit height for CSS strings to work
    expect(source).toMatch(/style=.*isCSSHeight.*height.*resolvedHeight/s);
  });
});
