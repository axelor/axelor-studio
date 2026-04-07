import type {
  AnalyticsNodeDuration,
  StatusTrendResponse,
  AssigneeThroughputEntry,
  SankeyDataResponse,
  CalendarHeatmapEntry,
  AnalyticsNodeDurationResponse,
  AssigneeThroughputResponse,
} from "../../api/types";

export const mockNodeDurations: AnalyticsNodeDuration[] = [
  {
    activityId: "UserTask_1",
    activityName: "Review Order",
    activityType: "userTask",
    avgDuration: 3200000,
    minDuration: 1800000,
    maxDuration: 5400000,
    passCount: 42,
    p50: 3100000,
    p95: 5200000,
    p99: 5380000,
    totalDuration: 134400000,
    workDuration: 89600000,
    idleDuration: 44800000,
  },
  {
    activityId: "ServiceTask_1",
    activityName: "Process Payment",
    activityType: "serviceTask",
    avgDuration: 120000,
    minDuration: 50000,
    maxDuration: 300000,
    passCount: 84,
    p50: 110000,
    p95: 280000,
    p99: 295000,
    totalDuration: 10080000,
    workDuration: 10080000,
    idleDuration: 0,
  },
  {
    activityId: "UserTask_2",
    activityName: "Approve Invoice",
    activityType: "userTask",
    avgDuration: 7200000,
    minDuration: 600000,
    maxDuration: 86400000,
    passCount: 30,
    p50: 5400000,
    p95: 72000000,
    p99: 84000000,
    totalDuration: 216000000,
    workDuration: 108000000,
    idleDuration: 108000000,
  },
];

export const mockStatusTrend: StatusTrendResponse = {
  points: [
    { timeBucket: "2026-03-01", running: 12, completed: 45, failed: 2 },
    { timeBucket: "2026-03-02", running: 15, completed: 38, failed: 1 },
    { timeBucket: "2026-03-03", running: 10, completed: 52, failed: 3 },
    { timeBucket: "2026-03-04", running: 18, completed: 41, failed: 0 },
    { timeBucket: "2026-03-05", running: 14, completed: 47, failed: 2 },
  ],
  granularity: "DAY",
};

export const mockAssigneeThroughput: AssigneeThroughputEntry[] = [
  {
    assignee: "admin",
    taskCount: 45,
    avgDuration: 2400000,
    totalDuration: 108000000,
  },
  {
    assignee: "manager1",
    taskCount: 32,
    avgDuration: 3600000,
    totalDuration: 115200000,
  },
  {
    assignee: "reviewer1",
    taskCount: 28,
    avgDuration: 1800000,
    totalDuration: 50400000,
  },
  {
    assignee: "Unassigned",
    taskCount: 5,
    avgDuration: 7200000,
    totalDuration: 36000000,
  },
];

export const mockSankeyData: SankeyDataResponse = {
  nodes: [
    { name: "StartEvent_1", displayName: "Start" },
    { name: "UserTask_1", displayName: "Review Order" },
    { name: "ServiceTask_1", displayName: "Process Payment" },
    { name: "ExclusiveGateway_1", displayName: "Approved?" },
    { name: "UserTask_2", displayName: "Approve Invoice" },
    { name: "EndEvent_1", displayName: "End" },
  ],
  links: [
    { source: "StartEvent_1", target: "UserTask_1", value: 42 },
    { source: "UserTask_1", target: "ExclusiveGateway_1", value: 42 },
    { source: "ExclusiveGateway_1", target: "ServiceTask_1", value: 35 },
    { source: "ExclusiveGateway_1", target: "UserTask_2", value: 7 },
    { source: "ServiceTask_1", target: "EndEvent_1", value: 35 },
    { source: "UserTask_2", target: "EndEvent_1", value: 7 },
  ],
};

export const mockCalendarHeatmap: CalendarHeatmapEntry[] = Array.from(
  { length: 30 },
  (_, i) => ({
    date: `2026-03-${String(i + 1).padStart(2, "0")}`,
    count: ((i * 7 + 3) % 20) + 1,
  }),
);

export const mockNodeDurationResponse: AnalyticsNodeDurationResponse = {
  nodes: mockNodeDurations,
};
export const mockAssigneeThroughputResponse: AssigneeThroughputResponse = {
  entries: mockAssigneeThroughput,
};
