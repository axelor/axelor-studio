import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPost = vi.fn();
vi.mock("@studio/shared/services", () => ({
  ServiceInstance: { post: mockPost },
}));

// Import after mock setup
const { default: AxelorService } = await import("../index");

describe("AxelorService", () => {
  let service: InstanceType<typeof AxelorService>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AxelorService({ model: "com.axelor.test.Model" });
  });

  it("constructs with model property", () => {
    expect(service.model).toBe("com.axelor.test.Model");
  });

  it("defaults to empty model when no props given", () => {
    const empty = new AxelorService();
    expect(empty.model).toBe("");
  });

  describe("search", () => {
    it("posts to ws/rest/{model}/search with search params", async () => {
      const params = { fields: ["name"], limit: 10, offset: 0 };
      mockPost.mockResolvedValue({ data: [{ id: 1 }] });

      await service.search(params);

      expect(mockPost).toHaveBeenCalledWith(
        "ws/rest/com.axelor.test.Model/search",
        { fields: ["name"], sortBy: undefined, data: undefined, limit: 10, offset: 0 },
      );
    });

    it("passes data criteria for filtered search", async () => {
      const criteria = { data: { criteria: [{ fieldName: "name", operator: "=", value: "Test" }] } };
      mockPost.mockResolvedValue({ data: [] });

      await service.search(criteria);

      expect(mockPost).toHaveBeenCalledWith(
        "ws/rest/com.axelor.test.Model/search",
        expect.objectContaining({ data: criteria.data }),
      );
    });
  });

  describe("fetch", () => {
    it("posts to ws/rest/{model}/{id}/fetch", async () => {
      mockPost.mockResolvedValue({ data: [{ id: 42 }] });
      await service.fetch(42, { fields: ["name"] });

      expect(mockPost).toHaveBeenCalledWith(
        "ws/rest/com.axelor.test.Model/42/fetch",
        { fields: ["name"] },
      );
    });
  });

  describe("view", () => {
    it("posts to /ws/meta/view", async () => {
      mockPost.mockResolvedValue({ data: {} });
      await service.view({ model: "com.axelor.test.Model", type: "form" });

      expect(mockPost).toHaveBeenCalledWith("/ws/meta/view", {
        model: "com.axelor.test.Model",
        type: "form",
      });
    });
  });

  describe("fields", () => {
    it("posts to /ws/meta/view/fields", async () => {
      mockPost.mockResolvedValue({ fields: [] });
      await service.fields({ model: "com.axelor.test.Model" });

      expect(mockPost).toHaveBeenCalledWith("/ws/meta/view/fields", {
        model: "com.axelor.test.Model",
      });
    });
  });

  describe("save", () => {
    it("wraps data in { data } by default", async () => {
      mockPost.mockResolvedValue({ data: [{ id: 1 }] });
      await service.save({ name: "Test" });

      expect(mockPost).toHaveBeenCalledWith("ws/rest/com.axelor.test.Model/", {
        data: { name: "Test" },
      });
    });

    it("spreads data when spread=true", async () => {
      mockPost.mockResolvedValue({ data: [{ id: 1 }] });
      await service.save({ name: "Test", version: 0 }, true);

      expect(mockPost).toHaveBeenCalledWith("ws/rest/com.axelor.test.Model/", {
        name: "Test",
        version: 0,
      });
    });
  });

  describe("removeAll", () => {
    it("posts records to removeAll endpoint", async () => {
      mockPost.mockResolvedValue({ status: 0 });
      const records = [{ id: 1 }, { id: 2 }];
      await service.removeAll(records);

      expect(mockPost).toHaveBeenCalledWith(
        "ws/rest/com.axelor.test.Model/removeAll",
        { records },
      );
    });
  });

  describe("action", () => {
    it("posts to /ws/action/{name} with model", async () => {
      mockPost.mockResolvedValue({ data: [] });
      await service.action("action-validate", { context: { id: 1 } });

      expect(mockPost).toHaveBeenCalledWith("/ws/action/action-validate", {
        context: { id: 1 },
        model: "com.axelor.test.Model",
      });
    });
  });
});
