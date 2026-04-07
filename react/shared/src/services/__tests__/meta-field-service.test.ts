import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeAxelorResponse, makeMetaField } from "../../__tests__/fixtures";

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

vi.mock("../meta-model-service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../meta-model-service")>();
  return {
    ...actual,
    getMetaModel: vi.fn(),
  };
});

import {
  fetchMetaFields,
  getMetaFields,
  getNameColumn,
  getResultedFields,
  getSubMetaField,
  fetchFields,
} from "../meta-field-service";
import { getMetaModel } from "../meta-model-service";

const mockedGetMetaModel = vi.mocked(getMetaModel);

describe("meta-field-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchMetaFields", () => {
    it("returns fields when API responds with status 0", async () => {
      const fields = [makeMetaField({ name: "field1" }), makeMetaField({ name: "field2", id: 2 })];
      mockService.search.mockResolvedValue(makeAxelorResponse({ data: fields }));

      const result = await fetchMetaFields({ _domain: "self.name = 'test'" });
      expect(result).toEqual(fields);
      expect(mockService.search).toHaveBeenCalledWith(
        "com.axelor.meta.db.MetaField",
        expect.objectContaining({ data: { _domain: "self.name = 'test'" } }),
      );
    });

    it("returns empty array with empty criteria", async () => {
      mockService.search.mockResolvedValue(makeAxelorResponse({ data: [] }));
      const result = await fetchMetaFields();
      expect(result).toEqual([]);
    });

    it("returns empty array on error response (status -1)", async () => {
      mockService.search.mockResolvedValue({ status: -1, data: [] });
      const result = await fetchMetaFields();
      expect(result).toEqual([]);
    });
  });

  describe("getMetaFields", () => {
    it("returns fields for metaModel type via ws/meta/fields endpoint", async () => {
      const viewResponse = {
        status: 0,
        data: {
          fields: [{ name: "name", type: "string" }, { name: "code", type: "string" }],
          jsonFields: {},
        },
      };
      mockService.get.mockResolvedValue(viewResponse);

      const result = await getMetaFields({ type: "metaModel", fullName: "com.axelor.test.Model", name: "Model" });
      expect(result).toEqual([
        { name: "name", type: "string" },
        { name: "code", type: "string" },
      ]);
      expect(mockService.get).toHaveBeenCalledWith("ws/meta/fields/com.axelor.test.Model");
    });

    it("returns empty array when model is null", async () => {
      const result = await getMetaFields(null);
      expect(result).toEqual([]);
      expect(mockService.get).not.toHaveBeenCalled();
    });

    it("uses jsonModel endpoint for non-metaModel type", async () => {
      const viewResponse = {
        status: 0,
        data: {
          fields: [{ name: "jsonField1", type: "string" }],
          jsonFields: {},
        },
      };
      mockService.get.mockResolvedValue(viewResponse);

      const result = await getMetaFields({ type: "metaJsonModel", name: "CustomModel" });
      expect(result).toEqual([{ name: "jsonField1", type: "string" }]);
      expect(mockService.get).toHaveBeenCalledWith(
        "ws/meta/fields/com.axelor.meta.db.MetaJsonRecord?jsonModel=CustomModel",
      );
    });

    it("returns empty array when metaModel has no fullName", async () => {
      const result = await getMetaFields({ type: "metaModel", name: "Model" });
      expect(result).toEqual([]);
    });

    it("returns empty array when metaJsonModel has no name", async () => {
      const result = await getMetaFields({ type: "metaJsonModel" });
      expect(result).toEqual([]);
    });
  });

  describe("getResultedFields", () => {
    it("extracts fields from a valid view response", () => {
      const res = {
        status: 0,
        data: {
          fields: [{ name: "f1", type: "string" }, { name: "f2", type: "integer" }],
          jsonFields: {},
        },
      };
      const result = getResultedFields(res);
      expect(result).toEqual([{ name: "f1", type: "string" }, { name: "f2", type: "integer" }]);
    });

    it("returns empty array for empty response", () => {
      const res = { status: 0, data: {} };
      const result = getResultedFields(res);
      expect(result).toEqual([]);
    });

    it("flattens nested JSON fields into the result", () => {
      const res = {
        status: 0,
        data: {
          fields: [{ name: "f1", type: "string" }],
          jsonFields: {
            attrs: {
              customField1: { name: "customField1", type: "string" },
              customField2: { name: "customField2", type: "integer" },
            },
          },
        },
      };
      const result = getResultedFields(res);
      expect(result).toHaveLength(3);
      expect(result).toEqual([
        { name: "f1", type: "string" },
        { name: "customField1", type: "string" },
        { name: "customField2", type: "integer" },
      ]);
    });
  });

  describe("getNameColumn", () => {
    it("returns the nameColumn field name when found", async () => {
      mockService.fetchFields.mockResolvedValue({
        status: 0,
        data: {
          fields: [
            { name: "id", nameColumn: false },
            { name: "fullName", nameColumn: true },
          ],
        },
      });

      const result = await getNameColumn("com.axelor.test.Model");
      expect(result).toBe("fullName");
    });

    it("returns 'name' as default when no nameColumn field exists", async () => {
      mockService.fetchFields.mockResolvedValue({
        status: 0,
        data: {
          fields: [
            { name: "id", nameColumn: false },
            { name: "code", nameColumn: false },
          ],
        },
      });

      const result = await getNameColumn("com.axelor.test.Model");
      expect(result).toBe("name");
    });

    it("returns undefined for empty model string", async () => {
      const result = await getNameColumn("");
      expect(result).toBeUndefined();
      expect(mockService.fetchFields).not.toHaveBeenCalled();
    });
  });

  describe("getSubMetaField", () => {
    it("fetches sub-fields for MetaJsonRecord model with relationJsonModel", async () => {
      const viewResponse = {
        status: 0,
        data: {
          fields: [
            { name: "partner", type: "many_to_one" },
            { name: "status", type: "string" },
          ],
          jsonFields: {},
        },
      };
      mockService.get.mockResolvedValue(viewResponse);

      const result = await getSubMetaField(
        "com.axelor.meta.db.MetaJsonRecord",
        "CustomModel",
        false,
        true,
      );
      // allowAllFields=true so all fields pass the filter
      expect(result).toEqual([
        { name: "partner", type: "many_to_one" },
        { name: "status", type: "string" },
      ]);
    });

    it("filters for collection types when isCollection is true", async () => {
      const viewResponse = {
        status: 0,
        data: {
          fields: [
            { name: "partner", type: "many_to_one" },
            { name: "items", type: "one_to_many" },
            { name: "status", type: "string" },
          ],
          jsonFields: {},
        },
      };
      mockService.get.mockResolvedValue(viewResponse);

      const result = await getSubMetaField(
        "com.axelor.meta.db.MetaJsonRecord",
        "CustomModel",
        true,
        false,
      );
      expect(result).toEqual([
        { name: "partner", type: "many_to_one" },
        { name: "items", type: "one_to_many" },
      ]);
    });

    it("uses getMetaModel for non-JsonRecord models", async () => {
      const metaModel = {
        id: 1,
        name: "SaleOrder",
        fullName: "com.axelor.sale.SaleOrder",
        metaFields: [{ id: 1, name: "name" }, { id: 2, name: "partner" }],
      };
      mockedGetMetaModel.mockResolvedValue(metaModel);
      mockService.fields.mockResolvedValue({
        status: 0,
        data: {
          fields: [
            { name: "name", type: "string" },
            { name: "partner", type: "many_to_one" },
          ],
        },
      });

      const result = await getSubMetaField("com.axelor.sale.SaleOrder", null, false, false);
      expect(result).toEqual([{ name: "partner", type: "many_to_one" }]);
      expect(mockedGetMetaModel).toHaveBeenCalledWith({
        criteria: [{ fieldName: "fullName", operator: "=", value: "com.axelor.sale.SaleOrder" }],
      });
    });

    it("returns empty array when getMetaModel returns undefined", async () => {
      mockedGetMetaModel.mockResolvedValue(undefined);
      const result = await getSubMetaField("com.axelor.nonexistent.Model", null);
      expect(result).toEqual([]);
    });
  });

  describe("fetchFields", () => {
    it("returns empty array when item is null", async () => {
      const result = await fetchFields(null);
      expect(result).toEqual([]);
    });

    it("fetches and filters fields excluding UI types for standard entity", async () => {
      const viewResponse = {
        status: 0,
        data: {
          fields: [
            { name: "name", type: "string", title: "Name" },
            { name: "myPanel", type: "panel", title: "Panel" },
            { name: "code", type: "string", title: "Code" },
          ],
          jsonFields: {},
        },
      };
      mockService.get.mockResolvedValue(viewResponse);

      const result = await fetchFields({ fullName: "com.axelor.test.Model" });
      expect(result).toHaveLength(2);
      const names = result.map((f) => f.name);
      expect(names).toContain("code");
      expect(names).toContain("name");
      expect(names).not.toContain("myPanel");
    });
  });
});
