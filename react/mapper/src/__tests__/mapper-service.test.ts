/**
 * Tests for mapper-service CRUD and script generation functions.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAdd = vi.fn();
const mockFetchRecord = vi.fn();
const mockAction = vi.fn();
const mockSearch = vi.fn();

vi.mock("@studio/shared/services", () => ({
  ServiceInstance: {
    add: (...args: unknown[]) => mockAdd(...args),
    fetchRecord: (...args: unknown[]) => mockFetchRecord(...args),
    action: (...args: unknown[]) => mockAction(...args),
    search: (...args: unknown[]) => mockSearch(...args),
  },
}));

import {
  saveRecord,
  fetchRecord,
  generateScriptString,
  getData,
  getCustomModelData,
  getCustomVariables,
} from "../services/mapper-service";

describe("mapper-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- saveRecord ---

  it("saveRecord: returns first data item on success", async () => {
    mockAdd.mockResolvedValue({ status: 0, data: [{ id: 1, name: "saved" }] });
    const result = await saveRecord({ model: "com.axelor.test.Model" }, { name: "test" });
    expect(result).toEqual({ id: 1, name: "saved" });
    expect(mockAdd).toHaveBeenCalledWith("com.axelor.test.Model", { name: "test" });
  });

  it("saveRecord: returns null on error status", async () => {
    mockAdd.mockResolvedValue({ status: -1 });
    const result = await saveRecord({ model: "com.axelor.test.Model" }, {});
    expect(result).toBeNull();
  });

  // --- fetchRecord ---

  it("fetchRecord: returns record data on success", async () => {
    mockFetchRecord.mockResolvedValue({ status: 0, data: [{ id: 42, name: "fetched" }] });
    const result = await fetchRecord("com.axelor.test.Model", 42);
    expect(result).toEqual({ id: 42, name: "fetched" });
  });

  it("fetchRecord: returns null on error", async () => {
    mockFetchRecord.mockResolvedValue({ status: -1 });
    const result = await fetchRecord("com.axelor.test.Model", 42);
    expect(result).toBeNull();
  });

  // --- generateScriptString ---

  it("generateScriptString: returns script string from action response", async () => {
    mockAction.mockResolvedValue({
      data: [{ values: { _scriptString: "def x = ctx.name" } }],
    });
    const result = await generateScriptString('{"test":1}', "com.axelor.test.Model");
    expect(result).toBe("def x = ctx.name");
    expect(mockAction).toHaveBeenCalledWith(
      "action-mapper-method-create-script-from-json",
      expect.objectContaining({
        data: expect.objectContaining({
          context: expect.objectContaining({
            _jsonString: '{"test":1}',
            _model: "com.axelor.test.Model",
          }),
        }),
      }),
    );
  });

  it("generateScriptString: returns undefined when no script in response", async () => {
    mockAction.mockResolvedValue({ data: [{}] });
    const result = await generateScriptString("{}", "com.axelor.test.Model");
    expect(result).toBeUndefined();
  });

  // --- getData ---

  it("getData: returns data array on success", async () => {
    mockSearch.mockResolvedValue({ status: 0, data: [{ id: 1 }, { id: 2 }] });
    const result = await getData("com.axelor.test.Model");
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("getData: returns empty array on error", async () => {
    mockSearch.mockResolvedValue({ status: -1 });
    const result = await getData("com.axelor.test.Model");
    expect(result).toEqual([]);
  });

  // --- getCustomModelData ---

  it("getCustomModelData: searches MetaJsonRecord with jsonModel criteria", async () => {
    mockSearch.mockResolvedValue({ status: 0, data: [{ id: 10, jsonModel: "myModel" }] });
    const result = await getCustomModelData("myModel");
    expect(result).toEqual([{ id: 10, jsonModel: "myModel" }]);
    expect(mockSearch).toHaveBeenCalledWith(
      "com.axelor.meta.db.MetaJsonRecord",
      expect.objectContaining({
        data: expect.objectContaining({
          criteria: [{ fieldName: "jsonModel", operator: "=", value: "myModel" }],
        }),
      }),
    );
  });

  // --- getCustomVariables ---

  it("getCustomVariables: returns active custom variables", async () => {
    mockSearch.mockResolvedValue({ status: 0, data: [{ id: 1, status: 1 }] });
    const result = await getCustomVariables();
    expect(result).toEqual([{ id: 1, status: 1 }]);
  });

  it("getCustomVariables: returns empty array on error", async () => {
    mockSearch.mockResolvedValue({ status: -1 });
    const result = await getCustomVariables();
    expect(result).toEqual([]);
  });
});
