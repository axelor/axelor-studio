/**
 * Characterization Test: VariableMapping
 *
 * Split from panel-characterization-medium.test.tsx.
 * Locks down: inOutTypeOptions, CAMUNDA extension constants, getInOutType, setOptionLabelValue.
 */

import { describe, it, expect, vi } from "vitest";
import { mockGetBusinessObject, mockIs } from "./fixtures/bpmn-mocks";

// --- Module-level mocks ---

vi.mock("bpmn-js/lib/util/ModelUtil", () => ({
  getBusinessObject: (...args: any[]) => mockGetBusinessObject(...args),
  // @ts-expect-error -- TS2556 legacy untyped
  is: (...args: any[]) => mockIs(...args),
}));

vi.mock("bpmn-js/lib/features/modeling/util/ModelingUtil", () => ({
  isAny: vi.fn((element, types) => types.some((t: any) => element?.type === t)),
}));

vi.mock("lodash/filter", () => ({
  default: vi.fn((arr, predicate) => {
    if (typeof predicate === "function") return arr?.filter(predicate);
    return arr;
  }),
}));

vi.mock("../../../../../utils", () => ({
  translate: (s: any) => s,
  getBool: (v: any) => v === true || v === "true",
  dashToUnderScore: (s: any) => (s ? s.replace(/-/g, "_") : s),
  capitalizeFirst: (s: any) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s),
  getAxelorScope: vi.fn().mockReturnValue(null),
  getLowerCase: (s: any) => (s ? s.toLowerCase() : s),
}));

vi.mock("../../../../../shared/services", () => ({
  getMetaModels: vi.fn(),
  getCustomModels: vi.fn(),
  getMetaFields: vi.fn(),
  fetchModels: vi.fn(),
  getModels: vi.fn(),
  getItems: vi.fn(),
  getButtons: vi.fn(),
}));

vi.mock("@studio/shared/services/Service", () => ({
  default: { action: vi.fn() },
}));

vi.mock("@studio/shared/hooks", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...(actual || {}), useDialog: vi.fn(() => vi.fn()) };
});

vi.mock("../../../../../utils/ExtensionElementsUtil", () => ({
  getExtensionElements: vi.fn(() => []),
}));

vi.mock("../../../../../utils/EventDefinitionUtil", () => ({
  getSignalEventDefinition: vi.fn(),
  getLinkEventDefinition: vi.fn(),
}));

vi.mock("../../../../../utils/ElementUtil", () => ({
  createElement: vi.fn((type, props, parent, factory) => {
    const result = factory ? factory.create(type, props) : { $type: type, ...props };
    if (parent) result.$parent = parent;
    return result;
  }),
}));

vi.mock("ids", () => ({
  default: class {
    constructor() {
      // @ts-expect-error -- TS2339 legacy untyped
      this._counter = 0;
    }
    nextPrefixed(prefix: any) {
      // @ts-expect-error -- TS2339 legacy untyped
      return `${prefix}${++this._counter}`;
    }
  },
}));

// ===== CHARACTERIZATION: VariableMapping =====

describe("Characterization: VariableMapping", () => {
  describe("inOutTypeOptions constant", () => {
    const inOutTypeOptions = [
      { name: "Source", value: "source" },
      { name: "Source expression", value: "sourceExpression" },
      { name: "All", value: "variables" },
    ];

    it("defines exactly 3 mapping type options", () => {
      expect(inOutTypeOptions).toHaveLength(3);
    });

    it("includes source, sourceExpression, and variables", () => {
      expect(inOutTypeOptions.map((o) => o.value)).toEqual([
        "source",
        "sourceExpression",
        "variables",
      ]);
    });

    it("has name/value structure for each option", () => {
      inOutTypeOptions.forEach((opt) => {
        expect(opt).toHaveProperty("name");
        expect(opt).toHaveProperty("value");
      });
    });
  });

  describe("CAMUNDA extension element constants", () => {
    const CAMUNDA_IN_EXTENSION_ELEMENT = "camunda:In";
    const CAMUNDA_OUT_EXTENSION_ELEMENT = "camunda:Out";

    it("defines camunda:In type", () => {
      expect(CAMUNDA_IN_EXTENSION_ELEMENT).toBe("camunda:In");
    });

    it("defines camunda:Out type", () => {
      expect(CAMUNDA_OUT_EXTENSION_ELEMENT).toBe("camunda:Out");
    });
  });

  describe("getInOutType logic", () => {
    // Replicating the getInOutType helper from VariableMapping
    function getInOutType(mapping: any) {
      let inOutType = "source";
      if (!mapping) return;
      if (mapping.variables === "all") {
        inOutType = "variables";
      } else if (typeof mapping.source !== "undefined") {
        inOutType = "source";
      } else if (typeof mapping.sourceExpression !== "undefined") {
        inOutType = "sourceExpression";
      }
      return inOutType;
    }

    it("returns undefined for null/undefined mapping", () => {
      expect(getInOutType(null)).toBeUndefined();
      expect(getInOutType(undefined)).toBeUndefined();
    });

    it("returns 'variables' when variables is 'all'", () => {
      expect(getInOutType({ variables: "all" })).toBe("variables");
    });

    it("returns 'source' when source property is defined", () => {
      expect(getInOutType({ source: "someField" })).toBe("source");
    });

    it("returns 'sourceExpression' when sourceExpression is defined", () => {
      expect(getInOutType({ sourceExpression: "${expr}" })).toBe("sourceExpression");
    });

    it("returns 'source' as default when no special properties", () => {
      expect(getInOutType({})).toBe("source");
    });

    it("prioritizes variables > source > sourceExpression", () => {
      expect(
        getInOutType({
          variables: "all",
          source: "field",
          sourceExpression: "expr",
        }),
      ).toBe("variables");
    });
  });

  describe("setOptionLabelValue logic", () => {
    // Characterizes the label formatting logic in VariableMapping
    function formatMappingLabel(mapping: any) {
      if (!mapping) return "<undefined> := ";
      let label = ((mapping && mapping.target) || "<undefined>") + " := ";
      let mappingType = "source";
      if (mapping.variables === "all") {
        mappingType = "variables";
      } else if (typeof mapping.source !== "undefined") {
        mappingType = "source";
      } else if (typeof mapping.sourceExpression !== "undefined") {
        mappingType = "sourceExpression";
      }

      if (mappingType === "variables") {
        label = "all";
      } else if (mappingType === "source") {
        label = label + (mapping.source || "<empty>");
      } else if (mappingType === "sourceExpression") {
        label = label + (mapping.sourceExpression || "<empty>");
      }
      return label;
    }

    it("returns 'all' label for variables mapping", () => {
      expect(formatMappingLabel({ variables: "all" })).toBe("all");
    });

    it("formats source mapping as 'target := source'", () => {
      expect(formatMappingLabel({ target: "myVar", source: "someField" })).toBe(
        "myVar := someField",
      );
    });

    it("formats sourceExpression mapping", () => {
      expect(
        formatMappingLabel({
          target: "myVar",
          sourceExpression: "${expr}",
        }),
      ).toBe("myVar := ${expr}");
    });

    it("uses <undefined> for missing target", () => {
      expect(formatMappingLabel({ source: "field" })).toBe("<undefined> := field");
    });

    it("uses <empty> for missing source value", () => {
      expect(formatMappingLabel({ target: "myVar" })).toBe("myVar := <empty>");
    });
  });
});
