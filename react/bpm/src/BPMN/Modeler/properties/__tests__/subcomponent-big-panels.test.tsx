/**
 * Sub-component Tests: Extracted sub-components from 4 big panels
 *
 * Tests for logic extracted during decomposition of:
 * 1. ModelProps -> constants.js, utils.js, FieldAction, FieldConfigTable, ModelSection
 * 2. MenuActionPanel -> constants.js, useMenuActions, UserActionTable, TaskFieldRows, MenuCard
 * 3. ProcessConfiguration -> ProcessConfigItem, ProcessConfigDialogs
 * 4. ViewAttributePanel -> utils.js, ValueCard, ItemsTable
 *
 * Pure-render sub-components (no testable logic beyond JSX composition) are documented
 * but not independently tested -- they are covered by panel-level characterization tests.
 */

import { describe, it, expect, vi } from "vitest";

// --- Module-level mocks ---

vi.mock("bpmn-js/lib/util/ModelUtil", () => ({
  getBusinessObject: vi.fn((el) => el?.businessObject || el),
  is: vi.fn((element, type) => element?.type === type),
}));

vi.mock("bpmn-js/lib/features/modeling/util/ModelingUtil", () => ({
  isAny: vi.fn((element, types) => types.some((t: any) => element?.type === t)),
}));

vi.mock("lodash", () => ({
  camelCase: (s: any) => s,
}));

vi.mock("../../../../utils", () => ({
  translate: (s: any) => s,
  getBool: (v: any) => v === true || v === "true",
  dashToUnderScore: (s: any) => (s ? s.replace(/-/g, "_") : s),
  capitalizeFirst: (s: any) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s),
  getAxelorScope: vi.fn().mockReturnValue(null),
  getLowerCase: (s: any) => (s ? s.toLowerCase() : s),
}));

vi.mock("../../../../shared/services", () => ({
  getParentMenus: vi.fn(),
  getSubMenus: vi.fn(),
  getViews: vi.fn(),
  getTemplates: vi.fn(),
  getRoles: vi.fn(),
  getMenu: vi.fn(),
  getMetaModels: vi.fn(),
  getCustomModels: vi.fn(),
  getMetaFields: vi.fn(),
  fetchModels: vi.fn(),
  getAllModels: vi.fn(),
  getProcessConfigModel: vi.fn(),
  addTranslations: vi.fn(),
  removeAllTranslations: vi.fn(),
  getModels: vi.fn(),
  getItems: vi.fn(),
  getTranslations: vi.fn(),
}));

vi.mock("ids", () => ({
  default: class MockIds {
    counter = 0;
    nextPrefixed(prefix: any) {
      return `${prefix}${++this.counter}`;
    }
  },
}));

vi.mock("../../../../utils/ElementUtil", () => ({
  createElement: vi.fn(() => ({})),
}));

vi.mock("../../../../components/Select", () => ({ default: () => null }));
vi.mock("../../../../components/Tooltip", () => ({ default: () => null }));
vi.mock("../../../../components/AlertDialog", () => ({ default: () => null }));
vi.mock("../../../../components/IconButton", () => ({ default: () => null }));
vi.mock("../../../../components/QueryBuilder", () => ({ default: () => null }));
vi.mock("@studio/shared/hooks", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...(actual || {}), useDialog: vi.fn(() => vi.fn()) };
});
vi.mock("../../../../components/properties/components", () => ({
  TextField: () => null,
  Checkbox: () => null,
  Table: () => null,
  Textbox: () => null,
  FieldEditor: () => null,
}));

// ============================================================
// 1. ModelProps sub-components
// ============================================================

describe("ModelProps/constants", () => {
  let constants;

  it("can be imported from the sub-folder path", async () => {
    constants = await import("../parts/CustomImplementation/ModelProps/constants");
    expect(typeof constants).toBe("object");
  });

  it("exports GATEWAY array with EventBasedGateway", async () => {
    constants = await import("../parts/CustomImplementation/ModelProps/constants");
    expect(constants.GATEWAY).toContain("bpmn:EventBasedGateway");
  });

  it("exports CONDITIONAL_SOURCES with expected BPMN types", async () => {
    constants = await import("../parts/CustomImplementation/ModelProps/constants");
    expect(constants.CONDITIONAL_SOURCES).toContain("bpmn:ExclusiveGateway");
    expect(constants.CONDITIONAL_SOURCES).toContain("bpmn:SequenceFlow");
    expect(constants.CONDITIONAL_SOURCES).toContain("bpmn:ServiceTask");
  });

  it("exports TITLE_SOURCES with process and participant types", async () => {
    constants = await import("../parts/CustomImplementation/ModelProps/constants");
    expect(constants.TITLE_SOURCES).toContain("bpmn:Process");
    expect(constants.TITLE_SOURCES).toContain("bpmn:Participant");
  });

  it("exports HELP_TITLE_SOURCES with DataObjectReference", async () => {
    constants = await import("../parts/CustomImplementation/ModelProps/constants");
    expect(constants.HELP_TITLE_SOURCES).toContain("bpmn:DataObjectReference");
  });

  it("exports typesWithMenuAction with user task types", async () => {
    constants = await import("../parts/CustomImplementation/ModelProps/constants");
    expect(constants.typesWithMenuAction).toContain("bpmn:UserTask");
    expect(constants.typesWithMenuAction).toContain("bpmn:StartEvent");
  });

  it("exports EVENT_DEFINITIONS_TYPES mapping", async () => {
    constants = await import("../parts/CustomImplementation/ModelProps/constants");
    expect(constants.EVENT_DEFINITIONS_TYPES["bpmn:StartEvent"]).toContain(
      "bpmn:MessageEventDefinition",
    );
    expect(constants.EVENT_DEFINITIONS_TYPES["bpmn:EndEvent"]).toContain(
      "bpmn:TerminateEventDefinition",
    );
  });

  it("exports PRIORITIES with 4 levels", async () => {
    constants = await import("../parts/CustomImplementation/ModelProps/constants");
    expect(constants.PRIORITIES).toHaveLength(4);
    expect(constants.PRIORITIES.map((p) => p.value)).toEqual(["low", "normal", "high", "urgent"]);
  });

  it("isConditionalSource returns true for ExclusiveGateway", async () => {
    constants = await import("../parts/CustomImplementation/ModelProps/constants");
    expect(constants.isConditionalSource({ type: "bpmn:ExclusiveGateway" })).toBe(true);
  });

  it("isConditionalSource returns false for UserTask", async () => {
    constants = await import("../parts/CustomImplementation/ModelProps/constants");
    expect(constants.isConditionalSource({ type: "bpmn:UserTask" })).toBe(false);
  });
});

describe("ModelProps/utils", () => {
  it("getModelProcessConfig returns noOptions when no extension elements", async () => {
    const { getModelProcessConfig } =
      await import("../parts/CustomImplementation/ModelProps/utils");
    const element = {
      type: "bpmn:Process",
      businessObject: { extensionElements: null },
    };
    const result = getModelProcessConfig(element, "metaModel");
    expect(result.criteria).toBeDefined();
    expect(result.criteria[0].value).toEqual([""]);
  });

  it("getBO traverses to process parent", async () => {
    const { getBO } = await import("../parts/CustomImplementation/ModelProps/utils");
    const processParent = { $type: "bpmn:Process" };
    const child = { $parent: { $type: "bpmn:SubProcess", $parent: processParent } };
    expect(getBO(child)).toBe(processParent);
  });
});

// ModelProps/FieldAction: Pure render component with state management
// Tested via panel-level characterization tests (FieldAction export, field path helpers)

// ModelProps/FieldActionDialogs: Pure render component (dialogs)
// Tested via panel-level characterization tests

// ModelProps/FieldConfigTable: Pure render component (table with FIELD_ACTIONS constant)
// Tested via panel-level characterization tests

// ModelProps/ModelSection: Pure render component (Model collapse panel JSX)
// Tested via panel-level characterization tests

// ============================================================
// 2. MenuActionPanel sub-components
// ============================================================

describe("MenuActionPanel/constants", () => {
  it("exports PRIORITIES with 4 priority levels", async () => {
    const { PRIORITIES } = await import("../parts/CustomImplementation/MenuActionPanel/constants");
    expect(PRIORITIES).toHaveLength(4);
    expect(PRIORITIES[0]).toEqual({ value: "low", id: "low", title: "Low" });
  });

  it("exports TYPES with value, field, script options", async () => {
    const { TYPES } = await import("../parts/CustomImplementation/MenuActionPanel/constants");
    expect(TYPES).toHaveLength(3);
    expect(TYPES.map((t) => t.value)).toEqual(["value", "field", "script"]);
  });

  it("exports menuObj template with all required fields", async () => {
    const { menuObj } = await import("../parts/CustomImplementation/MenuActionPanel/constants");
    expect(menuObj).toEqual({
      menuName: null,
      menuParent: null,
      position: null,
      positionMenu: null,
      permanent: false,
      tagCount: false,
      isUserMenu: false,
      formView: null,
      gridView: null,
      domain: null,
      roles: [],
      menuContexts: [],
    });
  });

  it("exports createMenus function", async () => {
    const { createMenus } = await import("../parts/CustomImplementation/MenuActionPanel/constants");
    expect(typeof createMenus).toBe("function");
  });
});

// MenuActionPanel/UserActionTable: Pure render component with checkbox + table
// Tested via panel-level characterization tests

// MenuActionPanel/TaskFieldRows: Pure render components (NameRow, PriorityRow, DescriptionRow)
// Tested via panel-level characterization tests

// MenuActionPanel/MenuCard: Pure render component (menu card with fields)
// Tested via panel-level characterization tests

// MenuActionPanel/useMenuActions: Hook with BPMN element state management
// Cannot be tested without full hook rendering context -- covered by characterization tests

// ============================================================
// 3. ProcessConfiguration sub-components
// ============================================================

describe("ProcessConfiguration barrel", () => {
  it(
    "re-exports default from ProcessConfiguration.jsx",
    async () => {
      const mod = await import("../parts/CustomImplementation/ProcessConfiguration");
      expect(typeof mod.default).toBe("function");
    },
    15_000,
  );
});

// ProcessConfiguration/ProcessConfigItem: Pure render component (config item card)
// Tested via panel-level characterization tests (initialProcessConfigList template)

// ProcessConfiguration/ProcessConfigDialogs: Pure render component (field path + script + translation dialogs)
// Tested via panel-level characterization tests

// ProcessConfiguration/ProcessConfigTitleTranslation: Moved file (was sibling, now in folder)
// Import resolution tested below

describe("ProcessConfiguration/ProcessConfigTitleTranslation import resolution", () => {
  it("can be imported from the new folder path", async () => {
    const mod =
      await import("../parts/CustomImplementation/ProcessConfiguration/ProcessConfigTitleTranslation");
    expect(typeof mod.default).toBe("function");
  });
});

// ============================================================
// 4. ViewAttributePanel sub-components
// ============================================================

describe("ViewAttributePanel/utils", () => {
  let utils;

  it("can be imported from the sub-folder path", async () => {
    utils = await import("../parts/CustomImplementation/ViewAttributePanel/utils");
    expect(typeof utils).toBe("object");
  });

  it("exports valueObj template with model, view, roles, items", async () => {
    utils = await import("../parts/CustomImplementation/ViewAttributePanel/utils");
    expect(utils.valueObj).toEqual({
      model: null,
      view: null,
      roles: [],
      items: [],
    });
  });

  it("exports itemsObj template with itemName, attributeName, attributeValue", async () => {
    utils = await import("../parts/CustomImplementation/ViewAttributePanel/utils");
    expect(utils.itemsObj).toEqual({
      itemName: null,
      attributeName: null,
      attributeValue: null,
    });
  });

  it("nextId returns prefixed string", async () => {
    utils = await import("../parts/CustomImplementation/ViewAttributePanel/utils");
    const id = utils.nextId();
    expect(id).toMatch(/^viewAttributes_/);
  });

  it("createData returns object with id and values array", async () => {
    utils = await import("../parts/CustomImplementation/ViewAttributePanel/utils");
    // @ts-expect-error -- TS2322 legacy untyped
    const data = utils.createData([{ a: 1 }]);
    expect(data.id).toMatch(/^viewAttributes_/);
    expect(data.values).toEqual([{ a: 1 }]);
  });

  it("createData with no args returns empty values", async () => {
    utils = await import("../parts/CustomImplementation/ViewAttributePanel/utils");
    const data = utils.createData();
    expect(data.values).toEqual([]);
  });

  it("getAttributes returns 'self' attributes for name='self'", async () => {
    utils = await import("../parts/CustomImplementation/ViewAttributePanel/utils");
    const attrs = utils.getAttributes({ name: "self" });
    expect(Array.isArray(attrs)).toBe(true);
  });

  it("getAttributes returns 'relational' for one_to_many type", async () => {
    utils = await import("../parts/CustomImplementation/ViewAttributePanel/utils");
    const attrs = utils.getAttributes({ name: "field1", type: "one-to-many" });
    expect(Array.isArray(attrs)).toBe(true);
  });

  it("getAttributes returns undefined when no name, title, or label", async () => {
    utils = await import("../parts/CustomImplementation/ViewAttributePanel/utils");
    const attrs = utils.getAttributes({});
    expect(attrs).toBeUndefined();
  });

  it("getKeyData splits array into groups by key", async () => {
    utils = await import("../parts/CustomImplementation/ViewAttributePanel/utils");
    const data = [
      { name: "model", value: "A" },
      { name: "view", value: "v1" },
      { name: "model", value: "B" },
      { name: "view", value: "v2" },
    ];
    const result = utils.getKeyData(data, "model");
    expect(result).toHaveLength(2);
    expect(result[0][0].value).toBe("A");
    expect(result[1][0].value).toBe("B");
  });

  it("getKeyData returns undefined for undefined data", async () => {
    utils = await import("../parts/CustomImplementation/ViewAttributePanel/utils");
    expect(utils.getKeyData(undefined, "model")).toBeUndefined();
  });

  it("getSelectedAttribute extracts name and title from item", async () => {
    utils = await import("../parts/CustomImplementation/ViewAttributePanel/utils");
    const result = utils.getSelectedAttribute({ attributeName: "hidden" });
    expect(result.name).toBe("hidden");
    expect(result.title).toBe("Hidden");
  });

  it("getSelectedAttribute returns empty name for undefined item", async () => {
    utils = await import("../parts/CustomImplementation/ViewAttributePanel/utils");
    const result = utils.getSelectedAttribute(undefined);
    expect(result.name).toBe("");
  });
});

// ViewAttributePanel/ValueCard: Pure render component (model/view card with selects)
// Tested via panel-level characterization tests

// ViewAttributePanel/ItemsTable: Pure render component (items table with attribute selects)
// Tested via panel-level characterization tests

// ============================================================
// 5. Cross-panel import resolution (barrel re-exports)
// ============================================================

describe("Cross-panel barrel re-exports", () => {
  it(
    "ModelProps barrel exports default and FieldAction",
    async () => {
      const mod = await import("../parts/CustomImplementation/ModelProps");
      expect(typeof mod.default).toBe("function");
      expect(typeof mod.FieldAction).toBe("function");
    },
    15_000,
  );

  it(
    "MenuActionPanel barrel exports default and createMenus",
    async () => {
      const mod = await import("../parts/CustomImplementation/MenuActionPanel");
      expect(typeof mod.default).toBe("function");
      expect(typeof mod.createMenus).toBe("function");
    },
    15_000,
  );

  it(
    "ViewAttributePanel barrel exports default",
    async () => {
      const mod = await import("../parts/CustomImplementation/ViewAttributePanel");
      expect(typeof mod.default).toBe("function");
    },
    15_000,
  );

  it(
    "ProcessConfiguration barrel exports default",
    async () => {
      const mod = await import("../parts/CustomImplementation/ProcessConfiguration");
      expect(typeof mod.default).toBe("function");
    },
    15_000,
  );
});
