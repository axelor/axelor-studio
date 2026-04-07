import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Service module before any imports that use it
vi.mock("@studio/shared/services/Service", () => ({
  ServiceInstance: {
    action: vi.fn(),
  },
}));

import { ServiceInstance } from "@studio/shared/services/Service";
import { fetchProcessList, fetchTaskStats, fetchAdoptionOverview } from "../api/cockpit-api";

import type { ProcessListResponse, TaskStatsData, AdoptionOverview } from "../api/types";

const mockAction = vi.mocked(ServiceInstance.action);

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// fetchProcessList
// ---------------------------------------------------------------------------

describe("fetchProcessList", () => {
  it("returns typed ProcessListResponse on success", async () => {
    const expected: ProcessListResponse = {
      processes: [
        {
          id: 1,
          code: "PROC-001",
          name: "Leave Request",
          description: null,
          statusSelect: 1,
          versionTag: "1.0",
          kpiTime: [],
          kpiQuality: [],
        },
      ],
    };

    mockAction.mockResolvedValueOnce({ data: [expected] } as never);

    const result = await fetchProcessList("30d");

    expect(result).toEqual(expected);
    expect(mockAction).toHaveBeenCalledWith(
      "com.axelor.studio.bpm.web.CockpitProcessController:getProcessList",
      { data: { context: { period: "30d" } } },
    );
  });

  it("throws on empty response", async () => {
    mockAction.mockResolvedValueOnce({ data: [] } as never);

    await expect(fetchProcessList("30d")).rejects.toThrow("No process data");
  });

  it("throws on null data", async () => {
    mockAction.mockResolvedValueOnce({} as never);

    await expect(fetchProcessList("7d")).rejects.toThrow("No process data");
  });
});

// ---------------------------------------------------------------------------
// fetchTaskStats
// ---------------------------------------------------------------------------

describe("fetchTaskStats", () => {
  it("returns typed TaskStatsData on success", async () => {
    const expected: TaskStatsData = {
      tasksDueToday: 5,
      tasksOverdue: 2,
      tasksUpcoming: 10,
      instancesByStatus: [
        { status: "running", count: 3 },
        { status: "completed", count: 8 },
      ],
    };

    mockAction.mockResolvedValueOnce({ data: [expected] } as never);

    const result = await fetchTaskStats("30d");

    expect(result).toEqual(expected);
    expect(mockAction).toHaveBeenCalledWith(
      "com.axelor.studio.bpm.web.CockpitTaskController:getTaskStats",
      { data: { context: { period: "30d" } } },
    );
  });

  it("throws on empty response", async () => {
    mockAction.mockResolvedValueOnce({ data: [] } as never);

    await expect(fetchTaskStats("30d")).rejects.toThrow("No task stats data");
  });
});

// ---------------------------------------------------------------------------
// fetchAdoptionOverview
// ---------------------------------------------------------------------------

describe("fetchAdoptionOverview", () => {
  it("returns typed AdoptionOverview on success", async () => {
    const expected: AdoptionOverview = {
      totalProcesses: 12,
      currentlyRunning: 5,
      endedInPeriod: 42,
      monthlyCounts: [
        { month: "2026-01", processName: "Leave Request", count: 15 },
      ],
    };

    mockAction.mockResolvedValueOnce({ data: [expected] } as never);

    const result = await fetchAdoptionOverview("90d");

    expect(result).toEqual(expected);
    expect(mockAction).toHaveBeenCalledWith(
      "com.axelor.studio.bpm.web.CockpitProcessController:getAdoptionOverview",
      { data: { context: { period: "90d" } } },
    );
  });

  it("throws on empty response", async () => {
    mockAction.mockResolvedValueOnce({ data: [] } as never);

    await expect(fetchAdoptionOverview("30d")).rejects.toThrow("No adoption overview data");
  });
});
