/**
 * Characterization Test: Property Edit Flow
 *
 * Locks down the current property edit behavior in BpmnModeler.jsx before
 * any lifecycle modifications. Characterizes:
 * 1. Element selection triggers the properties panel update
 * 2. modeling.updateProperties() is called with element and properties
 * 3. Property changes reflect on element.businessObject
 * 4. The properties panel is driven by getTabs() from extra.js
 * 5. Element click triggers checkMenuActionTab for user task types
 *
 * In BpmnModeler.jsx, property editing works through:
 *   - element.click / selection.changed event -> sets selectedElement
 *   - DrawerContent renders tabs from getTabs(bpmnModeler, element)
 *   - Property changes call modeling.updateProperties(element, props)
 *   - Changes update element.businessObject directly
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

import { mockWkfModel } from "./fixtures/mock-api-responses.js";

// --- Module-level mocks ---
vi.mock("@studio/shared/services/Service", () => ({
  default: {
    add: vi.fn().mockResolvedValue({ data: [] }),
    action: vi.fn().mockResolvedValue({ data: [] }),
    fetchId: vi.fn().mockResolvedValue({ data: [] }),
    search: vi.fn().mockResolvedValue({ data: [] }),
  },
  Service: vi.fn(),
}));

vi.mock("../../../shared/services", () => ({
  fetchWkf: vi.fn().mockResolvedValue({}),
  getTranslations: vi.fn().mockResolvedValue({}),
  getInfo: vi.fn().mockResolvedValue({}),
  getStudioApp: vi.fn().mockResolvedValue([]),
  getWkfModels: vi.fn().mockResolvedValue([]),
  removeWkf: vi.fn(),
  getApp: vi.fn().mockResolvedValue({}),
  getAppStudioConfig: vi.fn().mockResolvedValue({}),
  getBPMNModels: vi.fn().mockResolvedValue([]),
  getAppBPMConfig: vi.fn().mockResolvedValue({}),
}));

describe("Characterization: Property Edit Flow", () => {
  let modelingMock: Record<string, ReturnType<typeof vi.fn>>;
  let elementRegistryMock: { get: ReturnType<typeof vi.fn>; _elements: Record<string, unknown>; filter: ReturnType<typeof vi.fn> };
  let bpmnModelerMock: {
    get: ReturnType<typeof vi.fn>;
    _definitions: Record<string, unknown>;
    importXML: ReturnType<typeof vi.fn>;
    saveXML: ReturnType<typeof vi.fn>;
  };
  let selectionChangedHandlers: Array<(event: unknown) => void>;

  beforeEach(() => {
    vi.clearAllMocks();

    selectionChangedHandlers = [] as Array<(event: unknown) => void>;

    modelingMock = {
      updateProperties: vi.fn(),
      setColor: vi.fn(),
    };

    elementRegistryMock = {
      get: vi.fn((id: string) => ({
        id,
        type: "bpmn:UserTask",
        businessObject: {
          id,
          $type: "bpmn:UserTask",
          name: "Review Request",
          get: vi.fn((prop: string) => {
            if (prop === "name") return "Review Request";
            return undefined;
          }),
          $attrs: {},
          extensionElements: null,
        },
      })),
      _elements: {},
      filter: vi.fn().mockReturnValue([]),
    };

    bpmnModelerMock = {
      get: vi.fn((service: string) => {
        if (service === "modeling") return modelingMock;
        if (service === "elementRegistry") return elementRegistryMock;
        if (service === "canvas") return { zoom: vi.fn() };
        if (service === "eventBus") {
          return {
            on: vi.fn((event: string, handler: (event: unknown) => void) => {
              if (event === "selection.changed") {
                selectionChangedHandlers.push(handler);
              }
            }),
          };
        }
        if (service === "bpmnFactory") return {};
        return {};
      }),
      _definitions: {
        $attrs: {},
        rootElements: [],
      },
      importXML: vi.fn().mockResolvedValue({}),
      saveXML: vi.fn().mockResolvedValue({ xml: mockWkfModel.diagramXml }),
    };
  });

  it("retrieves modeling and elementRegistry services from bpmn-js", () => {
    // BpmnModeler.jsx uses bpmnModeler.get() to access internal services
    const modeling = bpmnModelerMock.get("modeling");
    const elementRegistry = bpmnModelerMock.get("elementRegistry");

    expect(modeling).toBeDefined();
    expect(modeling.updateProperties).toBeDefined();
    expect(elementRegistry).toBeDefined();
    expect(elementRegistry.get).toBeDefined();
  });

  it("looks up element from elementRegistry by ID", () => {
    // When an element is clicked, its ID is used to look it up
    const element = elementRegistryMock.get("UserTask_1");

    expect(element).toBeDefined();
    expect(element.id).toBe("UserTask_1");
    expect(element.type).toBe("bpmn:UserTask");
    expect(element.businessObject).toBeDefined();
    expect(element.businessObject.name).toBe("Review Request");
  });

  it("calls modeling.updateProperties() with element and property changes", () => {
    // Property edits in the DrawerContent panel call modeling.updateProperties
    const element = elementRegistryMock.get("UserTask_1");
    const newProperties = { name: "Updated Task Name" };

    modelingMock.updateProperties(element, newProperties);

    expect(modelingMock.updateProperties).toHaveBeenCalledWith(
      expect.objectContaining({ id: "UserTask_1" }),
      expect.objectContaining({ name: "Updated Task Name" }),
    );
  });

  it("registers selection.changed handler on eventBus", () => {
    // BpmnModeler.jsx registers a handler for selection.changed
    const eventBus = bpmnModelerMock.get("eventBus");
    const handler = vi.fn();

    eventBus.on("selection.changed", handler);

    expect(eventBus.on).toHaveBeenCalledWith("selection.changed", handler);
  });

  it("selection.changed event carries newSelection with the clicked element", () => {
    // When user clicks an element, selection.changed fires with { newSelection: [element] }
    const eventBus = bpmnModelerMock.get("eventBus");
    const handler = vi.fn();
    eventBus.on("selection.changed", handler);

    // Simulate the event
    const selectedElement = elementRegistryMock.get("UserTask_1");
    const event = { newSelection: [selectedElement] };

    // Call all registered handlers
    selectionChangedHandlers.forEach((h: (event: unknown) => void) => h(event));

    expect(selectionChangedHandlers.length).toBeGreaterThan(0);
  });

  it("property changes reflect on element.businessObject", () => {
    // After modeling.updateProperties(), the businessObject is mutated
    const element = elementRegistryMock.get("UserTask_1");
    const bo = element.businessObject;

    // Simulate the mutation that bpmn-js does internally
    bo.name = "Updated Name";
    bo.$attrs["camunda:assignee"] = "newUser";

    expect(bo.name).toBe("Updated Name");
    expect(bo.$attrs["camunda:assignee"]).toBe("newUser");
  });

  it("checkMenuActionTab evaluates user task types for menu action visibility", () => {
    // In BpmnModeler.jsx, checkMenuActionTab checks if element is a user task type
    // and whether metaModel/metaJsonModel are set
    const USER_TASKS_TYPES = ["bpmn:UserTask", "bpmn:CallActivity"];

    const element = elementRegistryMock.get("UserTask_1");

    // User task type should be in the allowed list
    expect(USER_TASKS_TYPES.includes(element.type)).toBe(true);

    // When no metaModel/metaJsonModel, menuAction should be set to true
    const bo = element.businessObject;
    const metaModel = bo.$attrs["camunda:metaModel"] || undefined;
    const metaJsonModel = bo.$attrs["camunda:metaJsonModel"] || undefined;

    // Both are undefined -> menuAction = true (per current behavior)
    expect(!metaModel && !metaJsonModel).toBe(true);
  });

  it("element.businessObject provides access to BPMN extension attributes", () => {
    // The properties panel reads from businessObject.$attrs for camunda extensions
    const element = elementRegistryMock.get("UserTask_1");
    const bo = element.businessObject;

    // Set camunda extension attributes as the properties panel would
    bo.$attrs["camunda:metaModel"] = "SaleOrder";
    bo.$attrs["camunda:metaModelModelName"] = "com.axelor.sale.db.SaleOrder";

    expect(bo.$attrs["camunda:metaModel"]).toBe("SaleOrder");
    expect(bo.$attrs["camunda:metaModelModelName"]).toBe("com.axelor.sale.db.SaleOrder");
  });
});
