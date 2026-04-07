import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPost = vi.fn();
const mockSearch = vi.fn();
vi.mock("@studio/shared/services", () => ({
  ServiceInstance: { post: mockPost, search: mockSearch },
}));

// Import after mock setup
const { getData, getCustomModelData, getNameField } = await import("../api");

describe("DMN API functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getData", () => {
    it("searches model and returns data array", async () => {
      mockPost.mockResolvedValue({ data: [{ id: 1, name: "Record1" }] });

      const result = await getData("com.axelor.test.Model");

      expect(result).toEqual([{ id: 1, name: "Record1" }]);
    });

    it("returns empty array on error response", async () => {
      mockPost.mockResolvedValue({ status: -1 });

      const result = await getData("com.axelor.test.Model");

      expect(result).toEqual([]);
    });

    it("returns undefined when response has no data", async () => {
      mockPost.mockResolvedValue({});

      const result = await getData("com.axelor.test.Model");

      expect(result).toBeUndefined();
    });
  });

  describe("getCustomModelData", () => {
    it("searches MetaJsonRecord with jsonModel criteria", async () => {
      mockSearch.mockResolvedValue({ data: [{ id: 1, jsonModel: "custom" }] });

      const result = await getCustomModelData("custom");

      expect(mockSearch).toHaveBeenCalledWith(
        "com.axelor.meta.db.MetaJsonRecord",
        {
          data: {
            criteria: [{ fieldName: "jsonModel", operator: "=", value: "custom" }],
            operator: "and",
          },
        },
      );
      expect(result).toEqual([{ id: 1, jsonModel: "custom" }]);
    });

    it("returns empty array on error", async () => {
      mockSearch.mockResolvedValue({ status: -1 });

      const result = await getCustomModelData("missing");

      expect(result).toEqual([]);
    });
  });

  describe("getNameField", () => {
    it("searches MetaJsonField with jsonModel and nameField criteria", async () => {
      mockSearch.mockResolvedValue({ data: [{ name: "fullName" }] });

      const result = await getNameField("custom");

      expect(mockSearch).toHaveBeenCalledWith(
        "com.axelor.meta.db.MetaJsonField",
        {
          data: {
            criteria: [
              { fieldName: "jsonModel", operator: "=", value: "custom" },
              { fieldName: "nameField", operator: "=", value: true },
            ],
            operator: "and",
          },
          fields: ["name"],
        },
      );
      expect(result).toEqual({ name: "fullName" });
    });

    it("returns undefined on error", async () => {
      mockSearch.mockResolvedValue({ status: -1 });

      const result = await getNameField("missing");

      expect(result).toBeUndefined();
    });

    it("returns undefined when no matching field found", async () => {
      mockSearch.mockResolvedValue({ data: [] });

      const result = await getNameField("noName");

      expect(result).toBeUndefined();
    });
  });
});
