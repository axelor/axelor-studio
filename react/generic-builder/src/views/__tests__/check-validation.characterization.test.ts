/**
 * Characterization tests for _checkValidation.
 *
 * Split from expression-generation.characterization.test.ts.
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
  checkValidation as _checkValidation,
} from "../../views/expression-builder/expression-generation";

import {
  validExpressionComponents,
  invalidExpressionComponents_noFieldName,
  invalidExpressionComponents_noValue,
} from "./fixtures/expression-fixtures";

// ============================================================
// _checkValidation Characterization
// ============================================================

describe("Characterization: _checkValidation", () => {
  it("returns true for valid expression components", () => {
    const result = _checkValidation(validExpressionComponents, {
      isPackage: false,
      isCondition: false,
    });
    expect(result).toBe(true);
  });

  it("returns false when fieldName is empty", () => {
    const result = _checkValidation(invalidExpressionComponents_noFieldName, {
      isPackage: false,
      isCondition: false,
    });
    expect(result).toBe(false);
  });

  it("returns false when fieldValue is empty for non-null operators", () => {
    const result = _checkValidation(invalidExpressionComponents_noValue, {
      isPackage: false,
      isCondition: false,
    });
    expect(result).toBe(false);
  });

  it("returns true when operator is isNull (no value needed)", () => {
    const components = [
      {
        value: {
          metaModals: { name: "Account", type: "metaModel" },
          rules: [
            {
              id: 0,
              parentId: -1,
              combinator: "and",
              rules: [
                {
                  fieldName: "name",
                  field: { type: "string" },
                  operator: "isNull",
                  fieldValue: "",
                },
              ],
            },
          ],
        },
      },
    ];
    const result = _checkValidation(components, {
      isPackage: false,
      isCondition: false,
    });
    expect(result).toBe(true);
  });

  it("returns false for param mode with empty fieldValue when operator requires value", () => {
    // Characterization: the actual behavior returns false here because the empty string
    // check (`isEmpty(fValue)`) triggers before the param mode check.
    // The param mode bypass only applies to the final complex condition block,
    // not to the earlier isEmpty check.
    const components = [
      {
        value: {
          metaModals: { name: "Account", type: "metaModel" },
          rules: [
            {
              id: 0,
              parentId: -1,
              combinator: "and",
              rules: [
                {
                  fieldName: "name",
                  field: { type: "string" },
                  operator: "=",
                  fieldValue: "",
                  isField: "param",
                },
              ],
            },
          ],
        },
      },
    ];
    const result = _checkValidation(components, {
      isPackage: false,
      isCondition: false,
    });
    expect(result).toBe(false);
  });

  it("returns true (early) when no metaModals and not isPackage", () => {
    const components = [
      {
        value: {
          metaModals: undefined,
          rules: [],
        },
      },
    ];
    const result = _checkValidation(components, {
      isPackage: false,
      isCondition: false,
    });
    // Returns true because the function early-returns isValid (true) when !metaModals && !isPackage
    expect(result).toBe(true);
  });
});
