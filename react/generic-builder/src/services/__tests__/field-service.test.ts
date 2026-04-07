import { describe, it, expect, vi, beforeEach } from "vitest";

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

vi.mock("@studio/shared/services", () => ({
  ServiceInstance: mockService,
  default: mockService,
}));

vi.mock("../view-service", () => ({
  getViews: vi.fn().mockResolvedValue([]),
}));

import { getMetaFields, getPackageFields, getButtons, getSubMetaField } from "../field-service";

describe("field-service (generic-builder)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMetaFields", () => {
    it("returns sorted fields for metaModel type", async () => {
      mockService.get.mockResolvedValue({
        data: {
          fields: [
            { name: "code", type: "string", json: false },
            { name: "name", type: "string", json: false },
          ],
          jsonFields: {},
        },
      });
      mockService.search.mockResolvedValue({ data: [] });

      const result = await getMetaFields({
        type: "metaModel",
        name: "SaleOrder",
        fullName: "com.axelor.sale.SaleOrder",
      });
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("code");
      expect(result[1].name).toBe("name");
    });

    it("returns empty array when model is null", async () => {
      const result = await getMetaFields(null);
      expect(result).toEqual([]);
      expect(mockService.get).not.toHaveBeenCalled();
    });

    it("returns empty array when model is undefined", async () => {
      const result = await getMetaFields(undefined);
      expect(result).toEqual([]);
    });

    it("uses jsonModel endpoint for non-metaModel type", async () => {
      mockService.get.mockResolvedValue({
        data: {
          fields: [{ name: "customField", type: "string", json: false, sequence: 1 }],
          jsonFields: {},
        },
      });

      const result = await getMetaFields({ type: "metaJsonModel", name: "CustomOrder" });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("customField");
      expect(mockService.get).toHaveBeenCalledWith(
        "ws/meta/fields/com.axelor.meta.db.MetaJsonRecord?jsonModel=CustomOrder",
      );
    });

    it("marks ZonedDateTime fields with correct typeName", async () => {
      mockService.get.mockResolvedValue({
        data: {
          fields: [
            { name: "createdAt", type: "datetime", json: false },
            { name: "name", type: "string", json: false },
          ],
          jsonFields: {},
        },
      });
      mockService.search.mockResolvedValue({
        data: [{ name: "createdAt", typeName: "ZonedDateTime" }],
      });

      // Use unique fullName to avoid internal cache collision with other tests
      const result = await getMetaFields({
        type: "metaModel",
        name: "InvoiceLine",
        fullName: "com.axelor.account.InvoiceLine",
      });
      const createdAt = result.find((f) => f.name === "createdAt");
      expect(createdAt?.typeName).toBe("ZonedDateTime");
    });
  });

  describe("getPackageFields", () => {
    it("returns action data for a valid model package", async () => {
      const actionData = [{ name: "id", type: "long" }, { name: "name", type: "string" }];
      mockService.action.mockResolvedValue({ data: actionData });

      const result = await getPackageFields("com.axelor.sale");
      expect(result).toEqual(actionData);
      expect(mockService.action).toHaveBeenCalledWith(
        "com.axelor.apps.tool.web.QueryBuilderController:getCommonFields",
        expect.objectContaining({
          data: expect.objectContaining({
            context: { package: "com.axelor.sale" },
          }),
        }),
      );
    });

    it("returns empty array for empty model string", async () => {
      const result = await getPackageFields("");
      expect(result).toEqual([]);
      expect(mockService.action).not.toHaveBeenCalled();
    });
  });

  describe("getButtons", () => {
    it("returns empty array when models is empty", async () => {
      const result = await getButtons([]);
      expect(result).toEqual([]);
    });

    it("returns buttons from form view for model with defaultForm", async () => {
      mockService.view.mockResolvedValue({
        data: {
          view: {
            type: "form",
            items: [
              { name: "confirmBtn", type: "button" },
              { name: "nameField", type: "string" },
            ],
            toolbar: [],
            menubar: [],
          },
        },
      });

      const result = await getButtons([
        { type: "metaModel", model: "Sale", modelFullName: "com.axelor.sale.Sale", defaultForm: "sale-form" },
      ]);
      expect(result.some((b) => b.name === "confirmBtn")).toBe(true);
      expect(result.some((b) => b.name === "nameField")).toBe(false);
    });

    it("returns empty array with default parameter", async () => {
      const result = await getButtons();
      expect(result).toEqual([]);
    });
  });

  describe("getSubMetaField", () => {
    it("fetches and filters fields by allowed types", async () => {
      mockService.get.mockResolvedValue({
        data: {
          fields: [
            { name: "partner", type: "many_to_one", json: false },
            { name: "notes", type: "text", json: false },
            { name: "customPanel", type: "panel", json: false },
          ],
          jsonFields: {},
        },
      });

      const result = await getSubMetaField("com.axelor.sale.SaleOrder");
      const names = result.map((f) => f.name);
      expect(names).toContain("partner");
      expect(names).toContain("notes");
      expect(names).not.toContain("customPanel");
    });

    it("returns empty array when no fields match", async () => {
      mockService.get.mockResolvedValue({
        data: {
          fields: [{ name: "hidden", type: "panel", json: false }],
          jsonFields: {},
        },
      });

      const result = await getSubMetaField("com.axelor.test.Model");
      expect(result).toEqual([]);
    });
  });
});
