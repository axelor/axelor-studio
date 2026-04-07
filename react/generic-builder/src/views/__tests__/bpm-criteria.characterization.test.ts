/**
 * Characterization tests for _getBPMCriteria and _getListOfTree.
 *
 * Split from expression-generation.characterization.test.ts.
 * Merged _getListOfTree (small, ~20L tests) into this file with _getBPMCriteria
 * for cleaner semantic grouping (both deal with tree-structured rule data).
 *
 * DO NOT "fix" expected values -- they capture current behavior, warts and all.
 * If a test fails after refactoring, the refactoring broke something.
 */
import { describe, it, expect } from "vitest";
// Ensure dayjs customParseFormat plugin is loaded before expression-generation
// (Vitest module transform may break the side-effect extend in the source module)
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

import {
  getBPMCriteria as _getBPMCriteria,
  getListOfTree as _getListOfTree,
} from "../../views/expression-builder/expression-generation";

import {
  makeOptions,
  equalsStringRule,
  notEqualsStringRule,
  isNullRule,
  isNotNullRule,
  flatRuleList,
} from "./fixtures/expression-fixtures";

// ============================================================
// _getBPMCriteria Characterization
// ============================================================

describe("Characterization: _getBPMCriteria", () => {
  it("produces criteria for a simple flat rule set", () => {
    const opts = makeOptions();
    const treeRules = [
      {
        id: 0,
        parentId: -1,
        combinator: "and",
        rules: [equalsStringRule, notEqualsStringRule],
        children: [],
      },
    ];
    const result = _getBPMCriteria(treeRules, "account", false, opts);
    expect(result.condition).toBe("self.name = 'test' and self.name != 'hello'");
    expect(result.values).toEqual([]);
  });

  it("produces criteria with children (nested groups)", () => {
    const opts = makeOptions();
    const treeRules = [
      {
        id: 0,
        parentId: -1,
        combinator: "and",
        rules: [equalsStringRule],
        children: [
          {
            id: 1,
            parentId: 0,
            combinator: "or",
            rules: [isNullRule, isNotNullRule],
            children: [],
          },
        ],
      },
    ];
    const result = _getBPMCriteria(treeRules, "account", false, opts);
    expect(result.condition).toContain("self.name = 'test'");
    expect(result.condition).toContain("(");
  });

  it("wraps in parentheses when isChildren is true", () => {
    const opts = makeOptions();
    const treeRules = [
      {
        id: 0,
        parentId: -1,
        combinator: "and",
        rules: [equalsStringRule],
        children: [],
      },
    ];
    const result = _getBPMCriteria(treeRules, "account", true, opts);
    expect(result.condition).toBe("(self.name = 'test')");
  });
});

// ============================================================
// _getListOfTree Characterization
// ============================================================

describe("Characterization: _getListOfTree", () => {
  it("converts flat rule list to tree structure", () => {
    const result = _getListOfTree(flatRuleList);
    // Two root nodes (parentId: -1)
    expect(result).toHaveLength(2);
    // First root should have one child
    expect(result[0].children).toHaveLength(1);
    expect((result[0].children as Record<string, unknown>[])[0].id).toBe(1);
    // Second root has no children
    expect(result[1].children).toHaveLength(0);
    expect(result[1].id).toBe(2);
  });

  it("preserves rule data in tree nodes", () => {
    const result = _getListOfTree(flatRuleList);
    expect(result[0].combinator).toBe("and");
    expect((result[0].rules as Record<string, unknown>[])[0].fieldName).toBe("name");
    expect((result[0].children as Record<string, unknown>[])[0].combinator).toBe("or");
  });
});
