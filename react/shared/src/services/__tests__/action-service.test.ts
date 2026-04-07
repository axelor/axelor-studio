import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeAxelorResponse } from "../../__tests__/fixtures";

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

vi.mock("../meta-field-service", () => ({
  getResultedFields: vi.fn().mockReturnValue([]),
}));

import { getButtons, getExpressionValues } from "../action-service";

describe("action-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getButtons", () => {
    it("returns empty array when models is empty", async () => {
      const result = await getButtons([]);
      expect(result).toEqual([]);
    });

    it("returns buttons from a single metaModel form view", async () => {
      const { getViews } = await import("../meta-view-service");
      vi.mocked(getViews).mockResolvedValue([{ id: 1, name: "sale-order-form", title: "Sale Order" }]);

      mockService.view.mockResolvedValue({
        status: 0,
        data: {
          view: {
            type: "form",
            items: [
              { name: "confirmBtn", type: "button", title: "Confirm" },
              { name: "nameField", type: "string" },
            ],
            toolbar: [],
            menubar: [],
          },
        },
      });

      const result = await getButtons([
        { type: "metaModel", model: "SaleOrder", modelFullName: "com.axelor.sale.SaleOrder" },
      ]);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.some((b) => b.name === "confirmBtn")).toBe(true);
    });

    it("fetches JSON field buttons for metaModel when no form view button", async () => {
      const { getViews } = await import("../meta-view-service");
      vi.mocked(getViews).mockResolvedValue([{ id: 1, name: "partner-form" }]);

      mockService.view.mockResolvedValue({
        status: 0,
        data: { view: { type: "form", items: [], toolbar: [], menubar: [] } },
      });

      const jsonButtons = [{ id: 10, name: "jsonBtn", type: "button" }];
      mockService.search.mockResolvedValue(makeAxelorResponse({ data: jsonButtons }));

      const result = await getButtons([
        { type: "metaModel", model: "Partner", modelFullName: "com.axelor.partner.Partner" },
      ]);
      expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ name: "jsonBtn" })]));
    });

    it("fetches fields-based buttons for metaJsonModel without form name", async () => {
      const { getViews } = await import("../meta-view-service");
      vi.mocked(getViews).mockResolvedValue([]);

      const { getResultedFields } = await import("../meta-field-service");
      vi.mocked(getResultedFields).mockReturnValue([
        { name: "customBtn", type: "button" },
        { name: "regularField", type: "string" },
      ]);

      mockService.get.mockResolvedValue({ status: 0, data: { fields: [], jsonFields: {} } });

      const result = await getButtons([
        { type: "metaJsonModel", model: "CustomOrder" },
      ]);
      expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ name: "customBtn" })]));
    });

    it("returns empty array when no models provided (default)", async () => {
      const result = await getButtons();
      expect(result).toEqual([]);
    });

    it("uses custom-model naming convention for metaJsonModel with defaultForm", async () => {
      mockService.view.mockResolvedValue({
        status: 0,
        data: {
          view: {
            type: "form",
            items: [{ name: "btn1", type: "button" }],
            toolbar: [],
            menubar: [],
          },
        },
      });

      await getButtons([
        { type: "metaJsonModel", model: "CustomModel", defaultForm: "custom-model-CustomModel-form" },
      ]);
      expect(mockService.view).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "custom-model-CustomModel-form",
          }),
        }),
      );
    });

    it("collects menu-item types alongside button types", async () => {
      const { getViews } = await import("../meta-view-service");
      vi.mocked(getViews).mockResolvedValue([{ id: 1, name: "test-form" }]);

      mockService.view.mockResolvedValue({
        status: 0,
        data: {
          view: {
            type: "form",
            items: [
              { name: "btn1", type: "button" },
              { name: "menu1", type: "menu-item" },
              { name: "field1", type: "string" },
            ],
            toolbar: [],
            menubar: [],
          },
        },
      });

      const result = await getButtons([
        { type: "metaModel", model: "Test", modelFullName: "com.axelor.test.Test" },
      ]);
      const names = result.map((b) => b.name);
      expect(names).toContain("btn1");
      expect(names).toContain("menu1");
      expect(names).not.toContain("field1");
    });

    it("handles includeAllForms fetching multiple form views", async () => {
      const { getViews } = await import("../meta-view-service");
      vi.mocked(getViews).mockResolvedValue([
        { id: 1, name: "form1" },
        { id: 2, name: "form2" },
      ]);

      mockService.view
        .mockResolvedValueOnce({
          status: 0,
          data: { view: { items: [{ name: "btn1", type: "button" }], toolbar: [], menubar: [] } },
        })
        .mockResolvedValueOnce({
          status: 0,
          data: { view: { items: [{ name: "btn2", type: "button" }], toolbar: [], menubar: [] } },
        });

      const result = await getButtons(
        [{ type: "metaModel", model: "Test", modelFullName: "com.axelor.test.Test" }],
        true,
      );
      const names = result.map((b) => b.name);
      expect(names).toContain("btn1");
      expect(names).toContain("btn2");
    });
  });

  describe("getExpressionValues", () => {
    it("returns data from entity search when model contains a dot", async () => {
      const records = [{ id: 1, name: "SaleOrder" }, { id: 2, name: "PurchaseOrder" }];
      mockService.search.mockResolvedValue(makeAxelorResponse({ data: records }));

      const result = await getExpressionValues("com.axelor.sale.SaleOrder");
      expect(result).toEqual(records);
      expect(mockService.search).toHaveBeenCalledWith("com.axelor.sale.SaleOrder", undefined);
    });

    it("uses MetaJsonRecord search for simple model names", async () => {
      const records = [{ id: 1, name: "record1" }];
      mockService.search.mockResolvedValue(makeAxelorResponse({ data: records }));

      const result = await getExpressionValues("CustomModel");
      expect(result).toEqual(records);
      expect(mockService.search).toHaveBeenCalledWith("com.axelor.meta.db.MetaJsonRecord", expect.objectContaining({
        data: expect.objectContaining({
          _domain: "self.jsonModel = 'CustomModel'",
        }),
      }));
    });

    it("returns undefined for empty model string", async () => {
      const result = await getExpressionValues("");
      expect(result).toBeUndefined();
      expect(mockService.search).not.toHaveBeenCalled();
    });

    it("returns empty array when API returns no data", async () => {
      mockService.search.mockResolvedValue(makeAxelorResponse({ data: [] }));

      const result = await getExpressionValues("com.axelor.test.Model");
      expect(result).toEqual([]);
    });
  });
});
