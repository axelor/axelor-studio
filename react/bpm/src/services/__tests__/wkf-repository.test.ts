import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

// Mock wkf-api
vi.mock("../wkf-api", () => ({
  saveWkfModel: vi.fn(),
  fetchWkfModel: vi.fn(),
  deployWkfModel: vi.fn(),
  startWkfModel: vi.fn(),
  createNewVersion: vi.fn(),
}));

// Mock useWkfStore
const mockSetWkf = vi.fn();
vi.mock("../../BPMN/Modeler/stores/useWkfStore", () => ({
  default: {
    getState: () => ({
      setWkf: mockSetWkf,
      wkf: null,
    }),
  },
}));

import { saveWkfModel, fetchWkfModel, deployWkfModel, startWkfModel, createNewVersion } from "../wkf-api";
import {
  saveCurrentWkf,
  createSatelliteWkf,
  resyncWkf,
  deployCurrentWkf,
  startCurrentWkf,
  addNewWkfVersion,
} from "../wkf-repository";

const mockSaveWkfModel = saveWkfModel as Mock;
const mockFetchWkfModel = fetchWkfModel as Mock;
const mockDeployWkfModel = deployWkfModel as Mock;
const mockStartWkfModel = startWkfModel as Mock;
const mockCreateNewVersion = createNewVersion as Mock;

describe("wkf-repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("saveCurrentWkf", () => {
    it("calls saveWkfModel and syncs store on success", async () => {
      const savedData = { id: 1, name: "test", version: 1 };
      mockSaveWkfModel.mockResolvedValue({ success: true, data: savedData });

      const result = await saveCurrentWkf({ name: "test" });

      expect(result).toEqual({ ok: true, data: savedData });
      expect(mockSaveWkfModel).toHaveBeenCalledWith({ name: "test" });
      expect(mockSetWkf).toHaveBeenCalledWith(savedData);
    });

    it("returns optimistic_lock error for concurrent modification", async () => {
      mockSaveWkfModel.mockResolvedValue({
        success: false,
        error: "Record has been updated or deleted by another transaction",
      });

      const result = await saveCurrentWkf({ name: "test" });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("optimistic_lock");
      }
      expect(mockSetWkf).not.toHaveBeenCalled();
    });

    it("returns validation error for unique constraint violation", async () => {
      mockSaveWkfModel.mockResolvedValue({
        success: false,
        error: "unique constraint violation",
      });

      const result = await saveCurrentWkf({ name: "test" });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("validation");
      }
    });

    it("returns validation error for required field", async () => {
      mockSaveWkfModel.mockResolvedValue({
        success: false,
        error: "Field 'name' is required",
      });

      const result = await saveCurrentWkf({ code: "test" });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("validation");
      }
    });

    it("returns network error when fetch throws TypeError", async () => {
      mockSaveWkfModel.mockRejectedValue(new TypeError("Failed to fetch"));

      const result = await saveCurrentWkf({ name: "test" });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("network");
        expect(result.error.message).toBe("Failed to fetch");
      }
    });

    it("returns unknown error for unrecognized errors", async () => {
      mockSaveWkfModel.mockResolvedValue({
        success: false,
        error: "Something completely unexpected",
      });

      const result = await saveCurrentWkf({ name: "test" });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("unknown");
      }
    });
  });

  describe("createSatelliteWkf", () => {
    it("does NOT sync store on success (wkf unchanged)", async () => {
      const savedData = { id: 2, name: "satellite", version: 0 };
      mockSaveWkfModel.mockResolvedValue({ success: true, data: savedData });

      const result = await createSatelliteWkf({ name: "satellite" });

      expect(result).toEqual({ ok: true, data: savedData });
      expect(mockSaveWkfModel).toHaveBeenCalledWith({ name: "satellite" });
      expect(mockSetWkf).not.toHaveBeenCalled();
    });

    it("returns classified error on failure", async () => {
      mockSaveWkfModel.mockResolvedValue({
        success: false,
        error: "unique constraint violation",
      });

      const result = await createSatelliteWkf({ name: "dup" });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("validation");
      }
    });

    it("returns network error when fetch throws", async () => {
      mockSaveWkfModel.mockRejectedValue(new TypeError("Network error"));

      const result = await createSatelliteWkf({ name: "test" });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("network");
      }
    });
  });

  describe("resyncWkf", () => {
    it("fetches WkfModel from server and updates store", async () => {
      const serverWkf = { id: 1, name: "Server Version", version: 5 };
      mockFetchWkfModel.mockResolvedValue({ success: true, data: serverWkf });

      await resyncWkf(1);

      expect(mockFetchWkfModel).toHaveBeenCalledWith(1);
      expect(mockSetWkf).toHaveBeenCalledWith(serverWkf);
    });

    it("swallows fetch errors silently (best-effort)", async () => {
      mockFetchWkfModel.mockRejectedValue(new Error("Network down"));

      // Should not throw
      await expect(resyncWkf(1)).resolves.toBeUndefined();
      expect(mockSetWkf).not.toHaveBeenCalled();
    });

    it("does not update store when fetch returns failure", async () => {
      mockFetchWkfModel.mockResolvedValue({ success: false, error: "Not found" });

      await resyncWkf(1);

      expect(mockSetWkf).not.toHaveBeenCalled();
    });
  });

  describe("deployCurrentWkf", () => {
    it("returns success on deploy success", async () => {
      const deployData = { reload: true };
      mockDeployWkfModel.mockResolvedValue({ success: true, data: deployData });

      const result = await deployCurrentWkf({ _model: "test" }, 1);

      expect(result).toEqual({ ok: true, data: deployData });
    });

    it("calls resyncWkf on deploy failure", async () => {
      mockDeployWkfModel.mockResolvedValue({ success: false, error: "Deploy failed" });
      mockFetchWkfModel.mockResolvedValue({ success: true, data: { id: 1, version: 3 } });

      const result = await deployCurrentWkf({ _model: "test" }, 1);

      expect(result.ok).toBe(false);
      expect(mockFetchWkfModel).toHaveBeenCalledWith(1);
    });

    it("does NOT call resyncWkf on deploy success", async () => {
      mockDeployWkfModel.mockResolvedValue({ success: true, data: { reload: true } });

      await deployCurrentWkf({ _model: "test" }, 1);

      expect(mockFetchWkfModel).not.toHaveBeenCalled();
    });

    it("calls resyncWkf on network error", async () => {
      mockDeployWkfModel.mockRejectedValue(new Error("Network error"));
      mockFetchWkfModel.mockResolvedValue({ success: true, data: { id: 1 } });

      const result = await deployCurrentWkf({ _model: "test" }, 1);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("network");
      }
      expect(mockFetchWkfModel).toHaveBeenCalledWith(1);
    });
  });

  describe("startCurrentWkf", () => {
    it("returns success on start success", async () => {
      const startData = { reload: true };
      mockStartWkfModel.mockResolvedValue({ success: true, data: startData });

      const result = await startCurrentWkf({ id: 1, name: "test" });

      expect(result).toEqual({ ok: true, data: startData });
      expect(mockStartWkfModel).toHaveBeenCalledWith({ id: 1, name: "test" });
    });

    it("returns classified error on failure", async () => {
      mockStartWkfModel.mockResolvedValue({ success: false, error: "Start failed" });

      const result = await startCurrentWkf({ id: 1 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("unknown");
      }
    });

    it("returns network error when fetch throws", async () => {
      mockStartWkfModel.mockRejectedValue(new TypeError("Failed to fetch"));

      const result = await startCurrentWkf({ id: 1 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("network");
      }
    });
  });

  describe("addNewWkfVersion", () => {
    it("returns success with newVersionId", async () => {
      mockCreateNewVersion.mockResolvedValue({
        success: true,
        data: { newVersionId: 42 },
      });

      const result = await addNewWkfVersion({ id: 1, name: "test" });

      expect(result).toEqual({ ok: true, data: { newVersionId: 42 } });
      expect(mockCreateNewVersion).toHaveBeenCalledWith({ id: 1, name: "test" });
    });

    it("returns classified error on failure", async () => {
      mockCreateNewVersion.mockResolvedValue({
        success: false,
        error: "Failed to create new version",
      });

      const result = await addNewWkfVersion({ id: 1 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("unknown");
      }
    });

    it("returns network error when fetch throws", async () => {
      mockCreateNewVersion.mockRejectedValue(new TypeError("Network error"));

      const result = await addNewWkfVersion({ id: 1 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("network");
      }
    });
  });
});
