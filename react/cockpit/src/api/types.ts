/**
 * TypeScript interfaces matching Java DTO records field-for-field (D-06).
 *
 * Every interface here is the 1:1 frontend mirror of its Java record
 * counterpart in `com.axelor.studio.bpm.dto.*`.
 */

export interface KpiValue {
  name: string;
  displayValue: string;
  rawValue: number;
  target: number | null;
  status: "ok" | "warning" | "critical";
}

export interface ProcessSummary {
  id: number;
  code: string;
  name: string;
  description: string | null;
  statusSelect: number;
  versionTag: string;
  kpiTime: KpiValue[];
  kpiQuality: KpiValue[];
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface TaskStatsData {
  tasksDueToday: number;
  tasksOverdue: number;
  tasksUpcoming: number;
  instancesByStatus: StatusCount[];
}

export interface MonthlyProcessCount {
  month: string;
  processName: string;
  count: number;
}

export interface AdoptionOverview {
  totalProcesses: number;
  currentlyRunning: number;
  endedInPeriod: number;
  monthlyCounts: MonthlyProcessCount[];
}

export interface ProcessListResponse {
  processes: ProcessSummary[];
}

// ---------------------------------------------------------------------------
// Phase 51: Instance Analysis DTOs
// ---------------------------------------------------------------------------

/** Status of a process instance in Camunda history tables. */
export type InstanceStatus =
  | "ACTIVE"
  | "COMPLETED"
  | "INTERNALLY_TERMINATED"
  | "SUSPENDED";

/** Single instance summary row for InstanceList. */
export interface InstanceSummary {
  instanceId: string; // Camunda process instance ID
  processDefinitionKey: string;
  status: InstanceStatus;
  startTime: string; // ISO 8601
  endTime: string | null; // ISO 8601, null if running
  durationMs: number; // milliseconds since start
  progress: number; // 0.0 - 1.0 (fraction of nodes visited)
  linkedObjects: LinkedObject[];
  hasError: boolean;
  errorMessage: string | null;
  currentNode: string | null; // error node ID
}

/** Business object linked to an instance. */
export interface LinkedObject {
  modelName: string; // e.g. "SaleOrder"
  modelFullName: string; // e.g. "com.axelor.sale.db.SaleOrder"
  recordId: number;
  displayName: string; // e.g. "SO-2024-042"
}

/** Active activity data for BPMN overlays. */
export interface ActivityData {
  activityId: string;
  activityName: string | null;
  activityType: string; // "userTask", "serviceTask", "exclusiveGateway", etc.
  isActive: boolean;
  passCount: number;
  durationMs: number | null;
}

/** Duration breakdown for a single node. */
export interface NodeDuration {
  total: number; // ms
  work: number; // ms (time actively worked)
  idle: number; // ms (wait time)
}

/** Aggregate duration stats across all instances of a process. */
export interface NodeDurationStats {
  avg: number; // ms
  min: number; // ms
  max: number; // ms
  count: number; // number of executions
}

/** Single passage (execution) of a node. */
export interface PassageEntry {
  startTime: string; // ISO 8601
  endTime: string | null;
  durationMs: number;
  assignee: string | null;
}

/** Branch distribution for a gateway node. */
export interface BranchDistribution {
  targetActivityId: string;
  targetActivityName: string | null;
  count: number;
  percentage: number; // 0-100
}

/** Full node detail for NodeDetailPanel. */
export interface NodeDetail {
  activityId: string;
  activityName: string | null;
  activityType: string;
  duration: NodeDuration;
  durationStats: NodeDurationStats;
  assignee: string | null;
  candidateGroups: string[];
  assignmentDate: string | null;
  passages: PassageEntry[];
  branches: BranchDistribution[];
}

/** Response for instance list endpoint. */
export interface InstanceListResponse {
  instances: InstanceSummary[];
  total: number;
  offset: number;
  limit: number;
}

/** Response for instance counts (ProcessHeader). */
export interface InstanceCountsResponse {
  running: number;
  completed: number;
  failed: number;
  suspended: number;
}

/** Response for instance activities (BPMN overlays). */
export interface InstanceActivitiesResponse {
  activities: ActivityData[];
  processInstanceId: string;
}

/** Response for node detail endpoint. */
export interface NodeDetailResponse {
  nodeDetail: NodeDetail;
}

/** Response for branch distribution endpoint. */
export interface BranchDistributionResponse {
  distributions: BranchDistribution[];
  gatewayId: string;
}

// ---------------------------------------------------------------------------
// Phase 52: Analytics DTOs
// ---------------------------------------------------------------------------

/** Extended node duration with percentiles for analytics (D-17). */
export interface AnalyticsNodeDuration {
  activityId: string;
  activityName: string | null;
  activityType: string;
  avgDuration: number; // ms
  minDuration: number; // ms
  maxDuration: number; // ms
  passCount: number;
  p50: number; // ms — PERCENTILE_CONT(0.50)
  p95: number; // ms — PERCENTILE_CONT(0.95)
  p99: number; // ms — PERCENTILE_CONT(0.99)
  totalDuration: number; // ms — sum of all executions
  workDuration: number; // ms — active work time
  idleDuration: number; // ms — wait/idle time
}

/** Time-bucketed status counts for trend chart (D-16). */
export interface StatusTrendPoint {
  timeBucket: string; // ISO 8601 truncated timestamp
  running: number;
  completed: number;
  failed: number;
}

/** Temporal granularity enum matching backend (D-16). */
export type TemporalGranularity = "HOUR" | "DAY" | "WEEK" | "MONTH";

/** Status trend response with computed granularity. */
export interface StatusTrendResponse {
  points: StatusTrendPoint[];
  granularity: TemporalGranularity;
}

/** Per-assignee throughput metrics (D-19). */
export interface AssigneeThroughputEntry {
  assignee: string;
  taskCount: number;
  avgDuration: number; // ms
  totalDuration: number; // ms
}

/** Sankey node-to-node transition (D-18). */
export interface SankeyTransition {
  source: string; // source activity ID
  target: string; // target activity ID
  value: number; // transition count
}

/** Sankey data response. */
export interface SankeyDataResponse {
  nodes: Array<{ name: string; displayName: string | null }>;
  links: SankeyTransition[];
}

/** Calendar heatmap entry for dashboard widget. */
export interface CalendarHeatmapEntry {
  date: string; // "YYYY-MM-DD"
  count: number;
}

/** Active filter in analytics tab (D-10). */
export interface AnalyticsFilter {
  id: string;
  type: "node" | "dateRange" | "status";
  label: string;
  value: string;
}

/** Analytics heatmap mode (D-12). */
export type AnalyticsMode = "tokens" | "duration" | "frequency";

/** Node duration stats response for analytics endpoints. */
export interface AnalyticsNodeDurationResponse {
  nodes: AnalyticsNodeDuration[];
}

/** Assignee throughput response. */
export interface AssigneeThroughputResponse {
  entries: AssigneeThroughputEntry[];
}

/** Calendar heatmap response. */
export interface CalendarHeatmapResponse {
  entries: CalendarHeatmapEntry[];
}
