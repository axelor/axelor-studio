/**
 * Expression Builder — operator handling regression tests
 *
 * Guards against the "Cannot read properties of undefined (reading 'id')" crash
 * introduced when editor.jsx was split into RenderRelationalWidget/RenderSimpleWidget.
 *
 * Root causes tested:
 * 1. handleEditorChange must tolerate undefined/null editor (boundary guard)
 * 2. handleRemove in RenderRelationalWidget must use targetName, not hardcoded 'id'
 * 3. findIndex in rule handlers must tolerate sparse/empty rule items
 */
import { readFileSync } from "fs";
import { resolve } from "path";

import { describe, it, expect } from "vitest";

const ROOT = resolve(__dirname, "..");

describe("expression-builder.tsx — rule handler safety", () => {
  const code = readFileSync(resolve(ROOT, "views/builder/expression-builder.tsx"), "utf-8");

  it("handleEditorChange guards against null/undefined editor without blocking id=0", () => {
    // editor is optional in the widget chain (RenderWidget passes it from props).
    // When used outside expression-builder context, editor may be undefined.
    // The handler must not crash — it should early-return.
    // CRITICAL: editor.id can be 0 (first rule group). A truthiness check like
    // !editor?.id would block id=0. Must use == null instead.
    expect(code).toMatch(/editor\s*==\s*null/);
    expect(code).toMatch(/editor\.id\s*==\s*null/);
    // Must NOT use truthiness check on id (blocks id=0)
    expect(code).not.toMatch(/if\s*\(\s*!editor\?\.id\s*\)/);
  });

  it("findIndex callbacks use optional chaining on draft items (?.id)", () => {
    // Rules array can contain empty objects {} (initial state, mid-edit).
    // Accessing item.id on undefined crashes inside immer produce().
    // All findIndex lines must use optional chaining (?.) before .id.
    const findIndexLines = code.split("\n").filter((line) => line.includes("findIndex"));
    expect(findIndexLines.length).toBeGreaterThan(0);
    for (const line of findIndexLines) {
      // Must use optional chaining before .id (variable name varies: i, r, etc.)
      expect(line).toMatch(/\?\.\s*id\b/);
    }
  });

  it("handlers guard against findIndex returning -1", () => {
    // If findIndex returns -1, draft[-1] is undefined → crash.
    // All handlers that use findIndex must check editorIndex >= 0.
    const editorIndexChecks = code.match(/editorIndex\s*<\s*0/g) || [];
    // At least handleEditorChange, handleRuleAdd, handleRuleRemove
    expect(editorIndexChecks.length).toBeGreaterThanOrEqual(3);
  });
});

describe("RenderRelationalWidget — handleRemove uses targetName", () => {
  const code = readFileSync(resolve(ROOT, "views/editor/RenderRelationalWidget.tsx"), "utf-8");

  it("handleRemove uses targetName for comparison key, not hardcoded 'id'", () => {
    // Selection fields (enum/status) have items like { name: 'New', title: 'New' }
    // without an 'id' property. The original editor.jsx used targetName || 'name'.
    // Using hardcoded 'id' crashes with "Cannot read properties of undefined".
    expect(code).toMatch(/targetName\s*\|\|\s*['"]id['"]/);
    // Must NOT have the old pattern: v?.id !== option?.id (without targetName)
    const handleRemoveBlock = code.match(/handleRemove[\s\S]*?(?=classes|$)/);
    if (handleRemoveBlock) {
      // The filter should reference `key` or `targetName`, not bare `.id`
      expect(handleRemoveBlock[0]).not.toMatch(/v\?\.id\s*!==\s*option\?\.id/);
    }
  });

  it("guards against null option in handleRemove", () => {
    expect(code).toMatch(/if\s*\(\s*!option\s*\)\s*return/);
  });
});

describe("RenderSimpleWidget — handleRemove uses targetName (reference implementation)", () => {
  const code = readFileSync(resolve(ROOT, "views/editor/RenderSimpleWidget.tsx"), "utf-8");

  it("handleRemove uses targetName || 'name' for comparison (correct pattern)", () => {
    // This is the reference implementation that was correct from the start.
    // RenderRelationalWidget must follow the same pattern.
    expect(code).toMatch(/targetName\s*\|\|\s*['"]name['"]/);
  });
});

describe("RenderWidget — editor prop must be passed to all widget branches", () => {
  const code = readFileSync(resolve(ROOT, "views/editor/RenderWidget.tsx"), "utf-8");

  it("every RenderSimpleWidget and RenderRelationalWidget receives editor", () => {
    // During the editor.jsx split into RenderWidget/RenderSimpleWidget/RenderRelationalWidget,
    // the `editor` prop was dropped from the `default` and `integer/long/decimal` switch cases.
    // Without editor, onChange passes undefined to handleEditorChange which silently
    // discards the update — the selected value never appears in the UI.
    //
    // This test ensures ALL code paths that create widgetProps or JSX include editor.
    // The switch has 5 branches: relational, date, integer, enum, default.

    // Count JSX editor={editor} occurrences (relational, date, enum)
    const jsxEditorProps = (code.match(/editor=\{editor\}/g) || []).length;

    // Count widgetProps with editor key (integer, default)
    // Look for lines that assign editor in widgetProps objects
    const widgetPropsBlocks = code.split("widgetProps");
    let widgetPropsWithEditor = 0;
    for (const block of widgetPropsBlocks) {
      // Each widgetProps = { ... } block between assignment and closing brace
      const match = block.match(/=\s*\{[\s\S]*?\};/);
      if (match && match[0].includes("editor")) {
        widgetPropsWithEditor++;
      }
    }

    // All 5 branches must pass editor (3 JSX + 2 widgetProps)
    expect(jsxEditorProps).toBeGreaterThanOrEqual(3);
    expect(widgetPropsWithEditor).toBeGreaterThanOrEqual(2);
    expect(jsxEditorProps + widgetPropsWithEditor).toBeGreaterThanOrEqual(5);
  });
});
