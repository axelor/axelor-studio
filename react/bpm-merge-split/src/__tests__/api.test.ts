import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AxelorResponse, AxelorActionResponse, WkfModel, MetaTranslation } from "@studio/shared/types";

// Mock the shared Service (api.ts imports from @studio/shared/services)
const mockService = {
  get: vi.fn(),
  post: vi.fn(),
  search: vi.fn(),
  action: vi.fn(),
  add: vi.fn(),
  delete: vi.fn(),
  request: vi.fn(),
  info: vi.fn(),
};

vi.mock("@studio/shared/services", () => ({
  ServiceInstance: mockService,
}));

describe("api.js - Characterization Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("removeWkf", () => {
    it("calls Service.delete with entity and id", async () => {
      mockService.delete.mockResolvedValue({ status: 0, data: [{ id: 1 }] } as AxelorResponse<WkfModel>);
      const { removeWkf } = await import("../services/api");

      const result = await removeWkf(1);

      expect(mockService.delete).toHaveBeenCalledWith("com.axelor.studio.db.WkfModel", 1);
      expect(result).toEqual({ id: 1 });
    });

    it("returns error message when status is -1", async () => {
      mockService.delete.mockResolvedValue({
        status: -1,
        data: { message: "Cannot delete" },
      } as unknown as AxelorResponse);
      const { removeWkf } = await import("../services/api");

      const result = await removeWkf(1);

      expect(result).toBe("Cannot delete");
    });
  });

  describe("getInfo", () => {
    it("calls Service.get with public info URL", async () => {
      mockService.get.mockResolvedValue({ user: { lang: "en" } });
      const { getInfo } = await import("../services/api");

      const result = await getInfo();

      expect(mockService.get).toHaveBeenCalledWith("ws/public/app/info");
      expect(result).toEqual({ user: { lang: "en" } });
    });
  });

  describe("getTranslations", () => {
    it("calls Service.search with translation domain", async () => {
      mockService.search.mockResolvedValue({
        status: 0, data: [{ id: 1, key: "value:test", message: "Test", language: "en" }],
      } as AxelorResponse<MetaTranslation>);
      const { getTranslations } = await import("../services/api");

      const result = await getTranslations("test");

      expect(mockService.search).toHaveBeenCalledWith(
        "com.axelor.meta.db.MetaTranslation",
        expect.objectContaining({
          data: expect.objectContaining({
            _domain: "self.key = :key",
            _domainContext: { key: "value:test" },
          }) as unknown,
          sortBy: ["id"],
        }),
      );
      expect(result).toEqual([{ id: 1, key: "value:test", message: "Test", language: "en" }]);
    });

    it("returns undefined for empty key", async () => {
      const { getTranslations } = await import("../services/api");
      const result = await getTranslations("");
      expect(mockService.search).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });

  describe("getBPMModels", () => {
    it("calls Service.search with correct payload", async () => {
      mockService.search.mockResolvedValue({
        status: 0, data: [{ id: 1, code: "wkf1", name: "Workflow 1" }],
      } as AxelorResponse<WkfModel>);
      const { getBPMModels } = await import("../services/api");

      const result = await getBPMModels();

      expect(mockService.search).toHaveBeenCalledWith(
        "com.axelor.studio.db.WkfModel",
        expect.objectContaining({
          offset: 0,
          sortBy: ["code"],
          fields: ["code", "name", "diagramXml"],
          limit: 40,
        }),
      );
      expect(result).toEqual([{ id: 1, code: "wkf1", name: "Workflow 1" }]);
    });
  });

  describe("mergeWkfModel", () => {
    it("calls Service.action with merge controller", async () => {
      const payload = { models: [1, 2] };
      mockService.action.mockResolvedValue({ status: 0, data: [{ id: 3 }] } as AxelorActionResponse);
      const { mergeWkfModel } = await import("../services/api");

      const result = await mergeWkfModel(payload);

      expect(mockService.action).toHaveBeenCalledWith(
        "com.axelor.studio.bpm.web.WkfModelController:mergeWkfModel",
        { data: { contributor: JSON.stringify(payload) } },
      );
      expect(result).toEqual({ id: 3 });
    });
  });

  describe("splitWkfModel", () => {
    it("calls Service.action with split controller", async () => {
      const payload = { model: 1, participants: ["p1"] };
      mockService.action.mockResolvedValue({ status: 0, data: [{ id: 2 }] } as AxelorActionResponse);
      const { splitWkfModel } = await import("../services/api");

      const result = await splitWkfModel(payload);

      expect(mockService.action).toHaveBeenCalledWith(
        "com.axelor.studio.bpm.web.WkfModelController:splitWkfModel",
        { data: { contributor: JSON.stringify(payload) } },
      );
      expect(result).toEqual({ id: 2 });
    });
  });

  describe("save", () => {
    it("calls saveAndDeploy with deploy=false", async () => {
      mockService.action.mockResolvedValue({ status: 0, data: [{ saved: true }] } as AxelorActionResponse);
      const { save } = await import("../services/api");

      const ids = { id: 1 };
      const results = { result: "data" };
      const result = await save(ids, results);

      expect(mockService.action).toHaveBeenCalledWith(
        "com.axelor.studio.bpm.web.WkfModelController:saveAndDeploy",
        expect.objectContaining({
          data: expect.objectContaining({
            deploy: false,
          }) as unknown,
        }),
      );
      expect(result).toEqual({ saved: true });
    });
  });

  describe("saveAndDeploy", () => {
    it("calls Service.action with deploy=true by default", async () => {
      mockService.action.mockResolvedValue({ status: 0, data: [{ deployed: true }] } as AxelorActionResponse);
      const { saveAndDeploy } = await import("../services/api");

      const ids = { id: 1 };
      const results = { result: "data" };
      const result = await saveAndDeploy(ids, results);

      expect(mockService.action).toHaveBeenCalledWith(
        "com.axelor.studio.bpm.web.WkfModelController:saveAndDeploy",
        expect.objectContaining({
          data: expect.objectContaining({
            deploy: true,
          }) as unknown,
        }),
      );
      expect(result).toEqual({ deployed: true });
    });

    it("nullifies diagramXml in ids", async () => {
      mockService.action.mockResolvedValue({ status: 0, data: [{}] } as AxelorActionResponse);
      const { saveAndDeploy } = await import("../services/api");

      const ids = { id: 1, diagramXml: "<xml>" };
      await saveAndDeploy(ids, {});

      // ids is mutated: diagramXml set to null
      expect(ids.diagramXml).toBeNull();
    });
  });
});
