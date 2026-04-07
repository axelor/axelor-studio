import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { AxelorActionResponse, TypedBpmnModeler } from "@studio/shared/types";

// Mock Service
vi.mock("@studio/shared/services/Service", () => {
  const ServiceClass = Object.assign(vi.fn(), {
    action: vi.fn(),
    add: vi.fn(),
  });
  return { default: ServiceClass, Service: ServiceClass };
});

// Mock modeler-api
vi.mock("../../BPMN/Modeler/utils/modeler-api", () => ({
  getDefinitionAttrs: vi.fn(),
  getProcesses: vi.fn(),
}));

// Mock bpmn-js
vi.mock("bpmn-js/lib/util/ModelUtil", () => ({
  getBusinessObject: vi.fn((el: unknown) => (el as Record<string, unknown>).businessObject || el),
  is: vi.fn((el: unknown, type: string) => (el as Record<string, string>).type === type),
}));

// Mock wkf-api
vi.mock("../wkf-api", () => ({
  deployWkfModel: vi.fn(),
}));

// Mock utils
vi.mock("../../utils", () => ({
  getBool: vi.fn((v: unknown) => v === true || v === "true"),
}));

import Service from "@studio/shared/services/Service";
import { is } from "bpmn-js/lib/util/ModelUtil";

import { prepareDeployContext, executeDeploy, callOutputMapping } from "../deploy-service";
import { deployWkfModel } from "../wkf-api";
import { getBool } from "../../utils";

function createMockModeler() {
  const elementRegistry = {
    filter: vi.fn((_fn: (el: unknown) => boolean) => [] as unknown[]),
  };
  return {
    get: vi.fn((name: string) => {
      if (name === "elementRegistry") return elementRegistry;
      return null;
    }),
    saveXML: vi.fn().mockResolvedValue({ xml: "<bpmn/>" }),
    saveSVG: vi.fn().mockResolvedValue({ svg: "<svg/>" }),
    _elementRegistry: elementRegistry,
  };
}

function createMockWkf(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    version: 1,
    name: "Test WKF",
    statusSelect: 1,
    ...overrides,
  };
}

describe("deploy-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("prepareDeployContext", () => {
    it("builds a deploy context object from wkf with _model prefix", () => {
      const wkf = createMockWkf({ name: "My Flow", code: "MF" });

      const context = prepareDeployContext(wkf);

      expect(context._model).toBe("com.axelor.studio.db.WkfModel");
      expect(context.id).toBe(1);
      expect(context.name).toBe("My Flow");
      expect(context.code).toBe("MF");
      expect(context.statusSelect).toBe(1);
    });
  });

  describe("executeDeploy", () => {
    it("calls deployWkfModel and returns success on reload", async () => {
      const context = {
        _model: "com.axelor.studio.db.WkfModel",
        id: 1,
      };
      const wkf = createMockWkf();

      (deployWkfModel as Mock).mockResolvedValue({
        success: true,
        data: { reload: true },
      });

      const result = await executeDeploy(context, wkf);

      expect(deployWkfModel).toHaveBeenCalledWith(context);
      expect(result).toEqual({ success: true, data: { reload: true } });
    });

    it("returns error on deploy failure", async () => {
      const context = { _model: "com.axelor.studio.db.WkfModel", id: 1 };
      const wkf = createMockWkf();

      (deployWkfModel as Mock).mockResolvedValue({
        success: false,
        error: "Deploy failed",
      });

      const result = await executeDeploy(context, wkf);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Deploy failed");
    });

    it("returns generic error when deployWkfModel throws", async () => {
      const context = { _model: "com.axelor.studio.db.WkfModel", id: 1 };
      const wkf = createMockWkf();

      (deployWkfModel as Mock).mockRejectedValue(new Error("Network error"));

      const result = await executeDeploy(context, wkf);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });
  });

  describe("callOutputMapping", () => {
    it("returns success with status -1 when no business rule tasks", async () => {
      const modeler = createMockModeler();
      modeler._elementRegistry.filter.mockReturnValue([]);

      const result = await callOutputMapping(modeler as unknown as TypedBpmnModeler);

      expect(result).toEqual({ success: true, status: -1 });
    });

    it("returns success with status -1 when no elements with assignOutputToFields", async () => {
      const modeler = createMockModeler();
      // First filter returns business rule tasks
      modeler._elementRegistry.filter.mockImplementation((fn: (el: unknown) => boolean) => {
        const elements = [
          {
            type: "bpmn:BusinessRuleTask",
            businessObject: { $attrs: {} },
          },
        ];
        return elements.filter(fn);
      });
      (is as Mock).mockImplementation(
        (el: unknown, type: string) => (el as Record<string, string>).type === type,
      );
      (getBool as Mock).mockReturnValue(false);

      const result = await callOutputMapping(modeler as unknown as TypedBpmnModeler);

      expect(result).toEqual({ success: true, status: -1 });
    });

    it("calls Service.action for each business rule element with output mapping", async () => {
      const modeler = createMockModeler();

      const brElement = {
        type: "bpmn:BusinessRuleTask",
        businessObject: {
          $attrs: {
            "camunda:assignOutputToFields": "true",
            "camunda:ifMultiple": "first",
            "camunda:searchWith": "id",
            "camunda:metaModelModelName": "SaleOrder",
          },
          resultVariable: "result",
          decisionRef: "decision1",
          extensionElements: {
            values: [],
          },
        },
      };

      // The filter calls: first for BusinessRuleTask, then for assignOutputToFields
      let callCount = 0;
      modeler._elementRegistry.filter.mockImplementation((fn: (el: unknown) => boolean) => {
        callCount++;
        if (callCount === 1) {
          // Filter for BusinessRuleTask
          (is as Mock).mockImplementation(
            (el: unknown, type: string) => (el as Record<string, string>).type === type,
          );
          return [brElement].filter(fn);
        }
        return [];
      });

      (getBool as Mock).mockReturnValue(true);

      (Service as unknown as Record<string, Mock>).action.mockResolvedValue({
        status: 0, data: [{ values: { script: "println 'hello'" } }],
      } as AxelorActionResponse);

      const result = await callOutputMapping(modeler as unknown as TypedBpmnModeler);

      expect((Service as unknown as Record<string, Mock>).action).toHaveBeenCalledWith({
        model: "com.axelor.studio.db.WkfModel",
        action: "action-wkf-dmn-model-method-create-output-to-field-script",
        data: {
          context: {
            decisionId: "decision1",
            ctxModel: "SaleOrder",
            searchWith: "id",
            ifMultiple: "first",
            resultVariable: "result",
          },
        },
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(0);
    });

    it("returns success with status 0 when no script returned", async () => {
      const modeler = createMockModeler();

      const brElement = {
        type: "bpmn:BusinessRuleTask",
        businessObject: {
          $attrs: {
            "camunda:assignOutputToFields": "true",
          },
          resultVariable: "result",
          decisionRef: "decision1",
          extensionElements: { values: [] },
        },
      };

      let callCount = 0;
      modeler._elementRegistry.filter.mockImplementation((fn: (el: unknown) => boolean) => {
        callCount++;
        if (callCount === 1) {
          (is as Mock).mockImplementation(
            (el: unknown, type: string) => (el as Record<string, string>).type === type,
          );
          return [brElement].filter(fn);
        }
        return [];
      });

      (getBool as Mock).mockReturnValue(true);

      (Service as unknown as Record<string, Mock>).action.mockResolvedValue({
        status: 0, data: [{ values: {} }],
      } as AxelorActionResponse);

      const result = await callOutputMapping(modeler as unknown as TypedBpmnModeler);

      expect(result.success).toBe(true);
      expect(result.status).toBe(0);
    });
  });
});
