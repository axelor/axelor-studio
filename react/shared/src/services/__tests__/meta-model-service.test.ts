import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeAxelorResponse, makeMetaModel, makeMetaJsonModel } from "../../__tests__/fixtures";

const mockService = vi.hoisted(() => ({
  post: vi.fn(),
  search: vi.fn(),
  add: vi.fn(),
  action: vi.fn(),
  fetchId: vi.fn(),
  fetchRecord: vi.fn(),
  get: vi.fn(),
  request: vi.fn(),
  fields: vi.fn(),
  fetchFields: vi.fn(),
  view: vi.fn(),
  upload: vi.fn(),
  download: vi.fn(),
  delete: vi.fn(),
  fetch: vi.fn(),
  info: vi.fn(),
}));

vi.mock("../Service", () => ({
  ServiceInstance: mockService,
  default: mockService,
  Service: vi.fn(),
}));

vi.mock("../meta-view-service", () => ({
  getViews: vi.fn().mockResolvedValue([]),
}));

import {
  getModels,
  fetchModelByName,
  getCustomModels,
  getMetaModel,
} from "../meta-model-service";

describe("meta-model-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getModels", () => {
    it("returns combined metaModel and metaJsonModel results", async () => {
      const meta = [makeMetaModel({ id: 1, name: "Sale" })];
      const json = [makeMetaJsonModel({ id: 2, name: "Custom" })];

      mockService.search
        .mockResolvedValueOnce(makeAxelorResponse({ data: meta }))
        .mockResolvedValueOnce(makeAxelorResponse({ data: json }));

      const result = await getModels();
      expect(result.length).toBe(2);
      expect(result[0]).toMatchObject({ name: "Sale", type: "metaModel" });
      expect(result[1]).toMatchObject({ name: "Custom", type: "metaJsonModel" });
    });

    it("returns only metaModel when metaModalType is 'metaModel'", async () => {
      const meta = [makeMetaModel({ id: 1, name: "Sale" })];
      mockService.search.mockResolvedValue(makeAxelorResponse({ data: meta }));

      const result = await getModels({}, "metaModel");
      expect(result.length).toBe(1);
      expect(result[0]).toMatchObject({ type: "metaModel" });
    });

    it("returns empty array when both searches return empty", async () => {
      mockService.search
        .mockResolvedValueOnce(makeAxelorResponse({ data: [] }))
        .mockResolvedValueOnce(makeAxelorResponse({ data: [] }));

      const result = await getModels();
      expect(result).toEqual([]);
    });
  });

  describe("fetchModelByName", () => {
    it("returns the found MetaModel", async () => {
      const model = makeMetaModel({ id: 1, name: "SaleOrder", fullName: "com.axelor.sale.SaleOrder" });
      mockService.search.mockResolvedValue(makeAxelorResponse({ data: [model] }));

      const result = await fetchModelByName("SaleOrder");
      expect(result).toMatchObject({ name: "SaleOrder", fullName: "com.axelor.sale.SaleOrder" });
    });

    it("returns null when model not found in MetaModel, falls back to custom models", async () => {
      mockService.search
        .mockResolvedValueOnce(makeAxelorResponse({ data: [] }))
        .mockResolvedValueOnce(makeAxelorResponse({ data: [] }));

      const result = await fetchModelByName("NonExistent");
      expect(result).toBeNull();
    });

    it("returns undefined for empty modelName", async () => {
      const result = await fetchModelByName("");
      expect(result).toBeUndefined();
      expect(mockService.search).not.toHaveBeenCalled();
    });
  });

  describe("getMetaModel", () => {
    it("returns first matching model from search", async () => {
      const model = makeMetaModel({ id: 1, name: "Partner" });
      mockService.search.mockResolvedValue(makeAxelorResponse({ data: [model] }));

      const result = await getMetaModel({ criteria: [{ fieldName: "name", operator: "=", value: "Partner" }] });
      expect(result).toMatchObject({ name: "Partner" });
    });

    it("returns undefined when no model matches", async () => {
      mockService.search.mockResolvedValue(makeAxelorResponse({ data: [] }));

      const result = await getMetaModel({ criteria: [] });
      expect(result).toBeUndefined();
    });
  });

  describe("getCustomModels", () => {
    it("returns custom models with CUSTOM modelType", async () => {
      const json = [makeMetaJsonModel({ id: 1, name: "CustomOrder" })];
      mockService.search.mockResolvedValue(makeAxelorResponse({ data: json }));

      const result = await getCustomModels();
      expect(result.length).toBe(1);
      expect(result[0]).toMatchObject({ name: "CustomOrder", modelType: "CUSTOM" });
    });
  });
});
