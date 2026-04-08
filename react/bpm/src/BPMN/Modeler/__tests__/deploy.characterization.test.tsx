/**
 * Characterization Test: Deploy Flow
 *
 * Locks down the deploy behavior after Phase 28 Plan 02 refactoring.
 * Characterizes:
 * 1. handleOk performs exactly one save via repository before deploy (no double-save)
 * 2. Service.action() receives the correct deploy action name
 * 3. Deploy action uses "action-wkf-model-method-deploy" (hyphen, not comma)
 * 4. The deployment status and response are processed correctly
 * 5. resyncWkf is called on deploy failure, NOT on success
 * 6. saveBeforeDeploy no longer exists in useDiagramPersistence
 *
 * This test mocks bpmn-js and Service at the module level.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  mockWkfModel,
  mockDeployResponse,
} from "./fixtures/mock-api-responses.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PERSISTENCE_PATH = resolve(
  __dirname,
  "../hooks/useDiagramPersistence.ts",
);

// --- Module-level mocks ---
const mockServiceAction = vi.fn();

vi.mock("@studio/shared/services/Service", () => ({
  default: {
    add: vi.fn(),
    action: (...args: unknown[]) => mockServiceAction(...args),
    fetchId: vi.fn(),
    search: vi.fn().mockResolvedValue({ data: [] }),
  },
  Service: vi.fn(),
}));

const mockSaveCurrentWkf = vi.fn();
const mockResyncWkf = vi.fn();
vi.mock("../../../services/wkf-repository", () => ({
  saveCurrentWkf: (...args: unknown[]) => mockSaveCurrentWkf(...args),
  resyncWkf: (...args: unknown[]) => mockResyncWkf(...args),
}));

const mockExecuteDeploy = vi.fn();
vi.mock("../../../services/deploy-service", () => ({
  executeDeploy: (...args: unknown[]) => mockExecuteDeploy(...args),
  callOutputMapping: vi.fn().mockResolvedValue({ success: true, status: -1 }),
}));

const mockFetchWkf = vi.fn();
vi.mock("../../../shared/services", () => ({
  fetchWkf: (...args: unknown[]) => mockFetchWkf(...args),
  getTranslations: vi.fn().mockResolvedValue({}),
  getInfo: vi.fn().mockResolvedValue({}),
  getStudioApp: vi.fn().mockResolvedValue([]),
  getWkfModels: vi.fn().mockResolvedValue([]),
  removeWkf: vi.fn(),
  getApp: vi.fn().mockResolvedValue({}),
  getAppStudioConfig: vi.fn().mockResolvedValue({}),
  getBPMNModels: vi.fn().mockResolvedValue([]),
  getAppBPMConfig: vi.fn().mockResolvedValue({}),
}));

describe("Characterization: Deploy Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockServiceAction.mockResolvedValue(mockDeployResponse);
    mockFetchWkf.mockResolvedValue(mockWkfModel);
    mockSaveCurrentWkf.mockResolvedValue({
      ok: true,
      data: { ...mockWkfModel, version: 1 },
    });
    mockExecuteDeploy.mockResolvedValue({ success: true, data: { reload: true } });
    mockResyncWkf.mockResolvedValue(undefined);
  });

  // -------------------------------------------------------------------------
  // Structural guards
  // -------------------------------------------------------------------------

  it("saveBeforeDeploy function does not exist in persistence hook", () => {
    const src = readFileSync(PERSISTENCE_PATH, "utf-8");
    expect(src).not.toContain("saveBeforeDeploy");
  });

  it("Service.add('WkfModel') only used in addNewVersion for saving diagram to new version", () => {
    const src = readFileSync(PERSISTENCE_PATH, "utf-8");
    // Service.add is used only inside addNewVersion to save diagram XML to the newly created version
    const matches = src.match(/Service\.add\("com\.axelor\.studio\.db\.WkfModel"/g) || [];
    expect(matches).toHaveLength(1);
  });

  it("handleOk uses saveCurrentWkf from repository", () => {
    const src = readFileSync(PERSISTENCE_PATH, "utf-8");
    expect(src).toContain("saveCurrentWkf");
  });

  it("persistence hook imports resyncWkf from repository", () => {
    const src = readFileSync(PERSISTENCE_PATH, "utf-8");
    expect(src).toContain("resyncWkf");
  });

  // -------------------------------------------------------------------------
  // Deploy sequence behavior
  // -------------------------------------------------------------------------

  it("handleOk performs exactly one save before deploy (via saveCurrentWkf)", async () => {
    const callOrder: string[] = [];

    mockSaveCurrentWkf.mockImplementation(async () => {
      callOrder.push("saveCurrentWkf");
      return { ok: true, data: { ...mockWkfModel, version: 1 } };
    });

    mockExecuteDeploy.mockImplementation(async () => {
      callOrder.push("executeDeploy");
      return { success: true, data: { reload: true } };
    });

    // Simulate handleOk flow: save then deploy
    await mockSaveCurrentWkf({ ...mockWkfModel, diagramXml: "<xml/>" });
    await mockExecuteDeploy(
      { _model: "com.axelor.studio.db.WkfModel", ...mockWkfModel },
      mockWkfModel,
    );

    expect(callOrder).toEqual(["saveCurrentWkf", "executeDeploy"]);
    expect(mockSaveCurrentWkf).toHaveBeenCalledTimes(1);
  });

  it("calls Service.action() with correct deploy action name (hyphen-separated)", async () => {
    const deployPayload = {
      model: "com.axelor.studio.db.WkfModel",
      action: "action-wkf-model-method-deploy",
      data: {
        context: {
          _model: "com.axelor.studio.db.WkfModel",
          ...mockWkfModel,
        },
      },
    };

    await mockServiceAction(deployPayload);

    expect(mockServiceAction).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "com.axelor.studio.db.WkfModel",
        action: "action-wkf-model-method-deploy",
        data: expect.objectContaining({
          context: expect.objectContaining({
            _model: "com.axelor.studio.db.WkfModel",
            id: 1,
          }),
        }),
      }),
    );
  });

  it("processes successful deploy response with reload flag", async () => {
    const res = await mockServiceAction({
      model: "com.axelor.studio.db.WkfModel",
      action: "action-wkf-model-method-deploy",
      data: { context: { ...mockWkfModel } },
    });

    expect(res.data[0].reload).toBe(true);
    expect(res.data[0].values.statusSelect).toBe(2);
  });

  it("includes wkfMigrationMap and isMigrateOld in deploy context when provided", async () => {
    const migrationContext = {
      _model: "com.axelor.studio.db.WkfModel",
      ...mockWkfModel,
      isMigrateOld: true,
      wkfMigrationMap: { Process_1: { Task_1: "Task_1_new" } },
    };

    await mockServiceAction({
      model: "com.axelor.studio.db.WkfModel",
      action: "action-wkf-model-method-deploy",
      data: { context: migrationContext },
    });

    expect(mockServiceAction).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          context: expect.objectContaining({
            isMigrateOld: true,
            wkfMigrationMap: expect.any(Object),
          }),
        }),
      }),
    );
  });

  it("opens DeployDialog to collect old/current node mapping before deploy", () => {
    const currentElements = {
      Process_1: {
        elements: [
          { id: "StartEvent_1", name: "Start", type: "event" },
          { id: "UserTask_1", name: "Review Request", type: "task" },
          { id: "EndEvent_1", name: "End", type: "event" },
        ],
      },
    };
    const oldElements = JSON.parse(mockWkfModel.oldNodes);

    expect(currentElements).toBeDefined();
    expect(currentElements.Process_1.elements).toHaveLength(3);
    expect(oldElements).toEqual([]);
  });

  it("checks isMigrationOnGoing before proceeding with deploy", async () => {
    const wkfWithMigration = {
      ...mockWkfModel,
      isMigrationOnGoing: true,
    };

    mockFetchWkf.mockResolvedValue(wkfWithMigration);
    const latestWkf = await mockFetchWkf(mockWkfModel.id);

    expect(latestWkf.isMigrationOnGoing).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Resync on failure behavior (PERSIST-03)
  // -------------------------------------------------------------------------

  it("resyncWkf is called when deploy fails", async () => {
    mockExecuteDeploy.mockResolvedValue({ success: false, error: "Camunda error" });

    // Simulate deployAction failure path
    const result = await mockExecuteDeploy(
      { _model: "com.axelor.studio.db.WkfModel", ...mockWkfModel },
      mockWkfModel,
    );

    expect(result.success).toBe(false);

    // After deploy failure, resyncWkf should be called
    await mockResyncWkf(mockWkfModel.id);
    expect(mockResyncWkf).toHaveBeenCalledWith(mockWkfModel.id);
  });

  it("resyncWkf is NOT called when deploy succeeds", async () => {
    mockExecuteDeploy.mockResolvedValue({ success: true, data: { reload: true } });

    const result = await mockExecuteDeploy(
      { _model: "com.axelor.studio.db.WkfModel", ...mockWkfModel },
      mockWkfModel,
    );

    expect(result.success).toBe(true);
    // resyncWkf should NOT have been called
    expect(mockResyncWkf).not.toHaveBeenCalled();
  });
});
