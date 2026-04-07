/**
 * API functions for cockpit data fetching.
 *
 * Each function wraps `ServiceInstance.action()` calls to the dedicated
 * cockpit Java controllers (D-02). Return types match the Java DTO records.
 */

import { ServiceInstance } from "@studio/shared/services/Service";

import type {
  AnalyticsNodeDurationResponse,
  AssigneeThroughputResponse,
  CalendarHeatmapResponse,
  SankeyDataResponse,
  StatusTrendResponse,
  ProcessListResponse,
  TaskStatsData,
  AdoptionOverview,
  InstanceListResponse,
  InstanceCountsResponse,
  InstanceActivitiesResponse,
  NodeDetailResponse,
  BranchDistributionResponse,
} from "./types";

// ---------------------------------------------------------------------------
// Process List
// ---------------------------------------------------------------------------

export async function fetchProcessList(period: string): Promise<ProcessListResponse> {
  const response = await ServiceInstance.action(
    "com.axelor.studio.bpm.web.CockpitProcessController:getProcessList",
    { model: "com.axelor.utils.db.Wizard", data: { context: { period } } },
  );
  const data = (response as { data?: unknown[] })?.data;
  if (!data?.[0]) {
    throw new Error("No process data returned from getProcessList");
  }
  return data[0] as ProcessListResponse;
}

// ---------------------------------------------------------------------------
// Task Stats
// ---------------------------------------------------------------------------

export async function fetchTaskStats(period: string): Promise<TaskStatsData> {
  const response = await ServiceInstance.action(
    "com.axelor.studio.bpm.web.CockpitTaskController:getTaskStats",
    { model: "com.axelor.utils.db.Wizard", data: { context: { period } } },
  );
  const data = (response as { data?: unknown[] })?.data;
  if (!data?.[0]) {
    throw new Error("No task stats data returned from getTaskStats");
  }
  return data[0] as TaskStatsData;
}

// ---------------------------------------------------------------------------
// Adoption Overview
// ---------------------------------------------------------------------------

export async function fetchAdoptionOverview(period: string): Promise<AdoptionOverview> {
  const response = await ServiceInstance.action(
    "com.axelor.studio.bpm.web.CockpitProcessController:getAdoptionOverview",
    { model: "com.axelor.utils.db.Wizard", data: { context: { period } } },
  );
  const data = (response as { data?: unknown[] })?.data;
  if (!data?.[0]) {
    throw new Error("No adoption overview data returned from getAdoptionOverview");
  }
  return data[0] as AdoptionOverview;
}

// ---------------------------------------------------------------------------
// Instance List (INST-02)
// ---------------------------------------------------------------------------

export async function fetchInstances(
  processId: number,
  status: string | null,
  offset: number,
  limit: number,
  search: string,
): Promise<InstanceListResponse> {
  const response = await ServiceInstance.action(
    "com.axelor.studio.bpm.web.CockpitInstanceController:getInstances",
    { model: "com.axelor.utils.db.Wizard", data: { context: { processId, status, offset, limit, search } } },
  );
  const data = (response as { data?: unknown[] })?.data;
  if (!data?.[0]) throw new Error("No instance data returned from getInstances");
  return data[0] as InstanceListResponse;
}

// ---------------------------------------------------------------------------
// Instance Counts (ProcessHeader)
// ---------------------------------------------------------------------------

export async function fetchInstanceCounts(processId: number): Promise<InstanceCountsResponse> {
  const response = await ServiceInstance.action(
    "com.axelor.studio.bpm.web.CockpitInstanceController:getInstanceCounts",
    { model: "com.axelor.utils.db.Wizard", data: { context: { processId } } },
  );
  const data = (response as { data?: unknown[] })?.data;
  if (!data?.[0]) throw new Error("No instance counts returned");
  return data[0] as InstanceCountsResponse;
}

// ---------------------------------------------------------------------------
// Instance Activities (BPMN overlays)
// ---------------------------------------------------------------------------

export async function fetchInstanceActivities(
  processInstanceId: string,
): Promise<InstanceActivitiesResponse> {
  const response = await ServiceInstance.action(
    "com.axelor.studio.bpm.web.CockpitInstanceController:getInstanceActivities",
    { model: "com.axelor.utils.db.Wizard", data: { context: { processInstanceId } } },
  );
  const data = (response as { data?: unknown[] })?.data;
  if (!data?.[0]) throw new Error("No activity data returned");
  return data[0] as InstanceActivitiesResponse;
}

// ---------------------------------------------------------------------------
// Node Detail (NodeDetailPanel)
// ---------------------------------------------------------------------------

export async function fetchNodeDetail(
  processInstanceId: string,
  activityId: string,
  processDefinitionKey: string,
): Promise<NodeDetailResponse> {
  const response = await ServiceInstance.action(
    "com.axelor.studio.bpm.web.CockpitInstanceController:getNodeDetail",
    { model: "com.axelor.utils.db.Wizard", data: { context: { processInstanceId, activityId, processDefinitionKey } } },
  );
  const data = (response as { data?: unknown[] })?.data;
  if (!data?.[0]) throw new Error("No node detail returned");
  return data[0] as NodeDetailResponse;
}

// ---------------------------------------------------------------------------
// Branch Distribution (gateway analysis)
// ---------------------------------------------------------------------------

export async function fetchBranchDistribution(
  processDefinitionKey: string,
  gatewayId: string,
): Promise<BranchDistributionResponse> {
  const response = await ServiceInstance.action(
    "com.axelor.studio.bpm.web.CockpitInstanceController:getBranchDistribution",
    { model: "com.axelor.utils.db.Wizard", data: { context: { processDefinitionKey, gatewayId } } },
  );
  const data = (response as { data?: unknown[] })?.data;
  if (!data?.[0]) throw new Error("No branch distribution returned");
  return data[0] as BranchDistributionResponse;
}

// ---------------------------------------------------------------------------
// Instance BPMN XML
// ---------------------------------------------------------------------------

export async function fetchInstanceXml(processId: number): Promise<string> {
  const response = await ServiceInstance.action(
    "com.axelor.studio.bpm.web.CockpitInstanceController:getInstanceXml",
    { model: "com.axelor.utils.db.Wizard", data: { context: { processId } } },
  );
  const data = (response as { data?: unknown[] })?.data;
  if (!data?.[0]) throw new Error("No XML returned");
  return (data[0] as { xml: string }).xml;
}

// ---------------------------------------------------------------------------
// Phase 52: Analytics
// ---------------------------------------------------------------------------

export async function fetchNodeDurationStats(
  processDefinitionKey: string,
  period: string,
): Promise<AnalyticsNodeDurationResponse> {
  const response = await ServiceInstance.action(
    "com.axelor.studio.bpm.web.CockpitAnalyticsController:getNodeDurationStats",
    { model: "com.axelor.utils.db.Wizard", data: { context: { processDefinitionKey, period } } },
  );
  const data = (response as { data?: unknown[] })?.data;
  if (!data?.[0]) throw new Error("No node duration stats returned");
  return data[0] as AnalyticsNodeDurationResponse;
}

export async function fetchStatusTrend(
  processDefinitionKey: string,
  period: string,
): Promise<StatusTrendResponse> {
  const response = await ServiceInstance.action(
    "com.axelor.studio.bpm.web.CockpitAnalyticsController:getStatusTrend",
    { model: "com.axelor.utils.db.Wizard", data: { context: { processDefinitionKey, period } } },
  );
  const data = (response as { data?: unknown[] })?.data;
  if (!data?.[0]) throw new Error("No status trend data returned");
  return data[0] as StatusTrendResponse;
}

export async function fetchAssigneeThroughput(
  processDefinitionKey: string,
  period: string,
): Promise<AssigneeThroughputResponse> {
  const response = await ServiceInstance.action(
    "com.axelor.studio.bpm.web.CockpitAnalyticsController:getAssigneeThroughput",
    { model: "com.axelor.utils.db.Wizard", data: { context: { processDefinitionKey, period } } },
  );
  const data = (response as { data?: unknown[] })?.data;
  if (!data?.[0]) throw new Error("No assignee throughput data returned");
  return data[0] as AssigneeThroughputResponse;
}

export async function fetchSankeyData(
  processDefinitionKey: string,
  period: string,
): Promise<SankeyDataResponse> {
  const response = await ServiceInstance.action(
    "com.axelor.studio.bpm.web.CockpitAnalyticsController:getSankeyData",
    { model: "com.axelor.utils.db.Wizard", data: { context: { processDefinitionKey, period } } },
  );
  const data = (response as { data?: unknown[] })?.data;
  if (!data?.[0]) throw new Error("No sankey data returned");
  return data[0] as SankeyDataResponse;
}

export async function fetchCalendarHeatmap(
  period: string,
): Promise<CalendarHeatmapResponse> {
  const response = await ServiceInstance.action(
    "com.axelor.studio.bpm.web.CockpitAnalyticsController:getCalendarHeatmap",
    { model: "com.axelor.utils.db.Wizard", data: { context: { period } } },
  );
  const data = (response as { data?: unknown[] })?.data;
  if (!data?.[0]) throw new Error("No calendar heatmap data returned");
  return data[0] as CalendarHeatmapResponse;
}
