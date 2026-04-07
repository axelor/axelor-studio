import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeAxelorResponse, makeMetaView } from "../../__tests__/fixtures";

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

import { getViews, getFormViews, getItems } from "../meta-view-service";

describe("meta-view-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getViews", () => {
    it("returns views matching model criteria", async () => {
      const views = [
        makeMetaView({ name: "sale-order-form", model: "com.axelor.sale.SaleOrder" }),
      ];
      mockService.search.mockResolvedValue(makeAxelorResponse({ data: views }));

      const result = await getViews(
        { name: "SaleOrder", type: "metaModel", fullName: "com.axelor.sale.SaleOrder" },
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ name: "sale-order-form" });
    });

    it("returns empty array when model is undefined and isModelAllow is true", async () => {
      const result = await getViews(undefined);
      expect(result).toEqual([]);
      expect(mockService.search).not.toHaveBeenCalled();
    });

    it("returns empty array when model has no name and isModelAllow is true", async () => {
      const result = await getViews({});
      expect(result).toEqual([]);
    });

    it("filters out views with null names", async () => {
      const views = [
        makeMetaView({ name: "valid-view" }),
        { id: 2, name: null } as unknown,
      ];
      mockService.search.mockResolvedValue(makeAxelorResponse({ data: views as never[] }));

      const result = await getViews(
        { name: "SaleOrder", type: "metaModel", fullName: "com.axelor.sale.SaleOrder" },
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ name: "valid-view" });
    });

    it("adds custom model naming convention for metaJsonModel type", async () => {
      mockService.search.mockResolvedValue(makeAxelorResponse({ data: [] }));

      await getViews({ name: "MyCustom", type: "metaJsonModel" });
      expect(mockService.search).toHaveBeenCalledWith(
        "com.axelor.meta.db.MetaView",
        expect.objectContaining({
          data: expect.objectContaining({
            criteria: expect.arrayContaining([
              expect.objectContaining({
                fieldName: "name",
                value: "custom-model-MyCustom-form",
              }),
            ]),
          }),
        }),
      );
    });
  });

  describe("getFormViews", () => {
    it("returns form views matching provided names", async () => {
      const views = [
        makeMetaView({ name: "sale-order-form", title: "Sale Order" }),
        makeMetaView({ id: 2, name: "partner-form", title: "Partner" }),
      ];
      mockService.search.mockResolvedValue(makeAxelorResponse({ data: views }));

      const result = await getFormViews(["sale-order-form", "partner-form"]);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ name: "sale-order-form" });
    });

    it("returns empty array when no views match", async () => {
      mockService.search.mockResolvedValue(makeAxelorResponse({ data: [] }));

      const result = await getFormViews(["nonexistent-form"]);
      expect(result).toEqual([]);
    });
  });

  describe("getItems", () => {
    it("returns empty array when model is null", async () => {
      const result = await getItems("some-form", null);
      expect(result).toEqual([]);
    });

    it("returns items from view data including fields and panels", async () => {
      const viewResponse = {
        status: 0,
        data: {
          fields: [{ name: "name", type: "string" }],
          jsonAttrs: [],
          view: {
            items: [
              { name: "mainPanel", type: "panel", items: [{ name: "code", type: "string" }] },
            ],
            toolbar: [],
            menubar: [],
          },
        },
      };
      mockService.post.mockResolvedValue(viewResponse);

      const result = await getItems("sale-form", { type: "metaModel", fullName: "com.axelor.sale.SaleOrder", name: "SaleOrder" });
      const names = result.map((r) => r.name);
      expect(names).toContain("name");
      expect(names).toContain("mainPanel");
      expect(names).toContain("code");
      // Self always appended
      expect(names).toContain("self");
    });
  });
});
