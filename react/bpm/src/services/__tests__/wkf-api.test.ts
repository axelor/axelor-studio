import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { AxelorResponse, AxelorActionResponse, WkfModel } from "@studio/shared/types";

vi.mock("@studio/shared/services/Service", () => {
  return {
    default: {
      add: vi.fn(),
      action: vi.fn(),
    },
  };
});

vi.mock("../../shared/services/wkf-service", () => ({
  fetchWkf: vi.fn(),
}));

import Service from "@studio/shared/services/Service";

import { fetchWkf } from "../../shared/services/wkf-service";
import {
  saveWkfModel,
  deployWkfModel,
  startWkfModel,
  fetchWkfModel,
  createNewVersion,
} from "../wkf-api";

const MockService = Service as unknown as {
  add: Mock;
  action: Mock;
};

describe("wkf-api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("saveWkfModel", () => {
    it("returns success with data when Service.add resolves with data array", async () => {
      MockService.add.mockResolvedValue({ status: 0, data: [{ id: 1, name: "test" }] } as AxelorResponse<WkfModel>);

      const result = await saveWkfModel({ name: "test" });

      expect(result).toEqual({ success: true, data: { id: 1, name: "test" } });
      expect(MockService.add).toHaveBeenCalledWith("com.axelor.studio.db.WkfModel", {
        name: "test",
      });
    });

    it("returns failure with message when Service.add resolves with error message", async () => {
      MockService.add.mockResolvedValue({ status: -1, data: { message: "Conflict" } } as unknown as AxelorResponse);

      const result = await saveWkfModel({ name: "test" });

      expect(result).toEqual({ success: false, error: "Conflict" });
    });

    it("returns failure with default message when Service.add resolves with null data", async () => {
      MockService.add.mockResolvedValue(null);

      const result = await saveWkfModel({ name: "test" });

      expect(result).toEqual({ success: false, error: "Save failed" });
    });
  });

  describe("deployWkfModel", () => {
    it("returns success when Service.action resolves with reload", async () => {
      MockService.action.mockResolvedValue({ status: 0, data: [{ reload: true }] } as AxelorActionResponse);

      const result = await deployWkfModel({ id: 1 });

      expect(result).toEqual({ success: true, data: { reload: true } });
      expect(MockService.action).toHaveBeenCalledWith({
        model: "com.axelor.studio.db.WkfModel",
        action: "action-wkf-model-method-deploy",
        data: { context: { id: 1 } },
      });
    });

    it("returns failure when response contains error", async () => {
      MockService.action.mockResolvedValue({
        status: 0, data: [{ error: { message: "Deploy error" } }],
      } as AxelorActionResponse);

      const result = await deployWkfModel({ id: 1 });

      expect(result).toEqual({ success: false, error: "Deploy error" });
    });
  });

  describe("startWkfModel", () => {
    it("returns success when Service.action resolves with reload", async () => {
      MockService.action.mockResolvedValue({ status: 0, data: [{ reload: true }] } as AxelorActionResponse);

      const result = await startWkfModel({ id: 1, name: "test" });

      expect(result).toEqual({ success: true, data: { reload: true } });
      expect(MockService.action).toHaveBeenCalledWith({
        model: "com.axelor.studio.db.WkfModel",
        action: "action-wkf-model-method-start",
        data: {
          context: {
            _model: "com.axelor.studio.db.WkfModel",
            id: 1,
            name: "test",
          },
        },
      });
    });

    it("returns failure on error", async () => {
      MockService.action.mockResolvedValue({ status: -1, data: { message: "Start error" } } as unknown as AxelorActionResponse);

      const result = await startWkfModel({ id: 1 });

      expect(result).toEqual({ success: false, error: "Start error" });
    });
  });

  describe("fetchWkfModel", () => {
    it("returns success with wkf data when fetchWkf resolves with object", async () => {
      const wkfData = { id: 1, name: "test", version: 0 };
      (fetchWkf as Mock).mockResolvedValue(wkfData);

      const result = await fetchWkfModel(1);

      expect(result).toEqual({ success: true, data: wkfData });
      expect(fetchWkf).toHaveBeenCalledWith(1);
    });

    it("returns failure when fetchWkf resolves with undefined", async () => {
      (fetchWkf as Mock).mockResolvedValue(undefined);

      const result = await fetchWkfModel(999);

      expect(result).toEqual({ success: false, error: "WkfModel not found" });
    });

    it("returns failure when fetchWkf resolves with empty object", async () => {
      (fetchWkf as Mock).mockResolvedValue({});

      const result = await fetchWkfModel(999);

      expect(result).toEqual({ success: false, error: "WkfModel not found" });
    });
  });

  describe("createNewVersion", () => {
    it("returns success with newVersionId when present", async () => {
      MockService.action.mockResolvedValue({
        status: 0, data: [{ values: { newVersionId: 42 } }],
      } as AxelorActionResponse);

      const result = await createNewVersion({ id: 1, version: 0 });

      expect(result).toEqual({ success: true, data: { newVersionId: 42 } });
      expect(MockService.action).toHaveBeenCalledWith({
        model: "com.axelor.studio.db.WkfModel",
        action: "action-wkf-model-method-create-new-version",
        data: {
          context: {
            _model: "com.axelor.studio.db.WkfModel",
            id: 1,
            version: 0,
            _signal: "newVersionBtn",
            _source: "newVersionBtn",
            _viewName: "wkf-model-form",
            _viewType: "form",
            __check_version: true,
            _views: [
              { type: "grid", name: "wkf-model-grid" },
              { type: "form", name: "wkf-model-form" },
            ],
          },
        },
      });
    });

    it("returns failure when newVersionId is not present", async () => {
      MockService.action.mockResolvedValue({ status: 0, data: [{ values: {} }] } as AxelorActionResponse);

      const result = await createNewVersion({ id: 1 });

      expect(result).toEqual({
        success: false,
        error: "Failed to create new version",
      });
    });
  });
});
