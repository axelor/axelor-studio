import { http, HttpResponse } from "msw";
import type {
  ProcessSummary,
  TaskStatsData,
  AdoptionOverview,
  InstanceSummary,
  InstanceCountsResponse,
  ActivityData,
  NodeDetail,
} from "../../api/types";
import {
  mockNodeDurationResponse,
  mockStatusTrend,
  mockAssigneeThroughputResponse,
  mockSankeyData,
  mockCalendarHeatmap,
} from "../stubs/analytics-stubs";

// Mock data matching Java DTO structure
export const mockProcessList: ProcessSummary[] = [
  {
    id: 1,
    code: "proc-1",
    name: "Order Process",
    description: "Handles customer orders",
    statusSelect: 1,
    versionTag: "1.0",
    kpiTime: [
      {
        name: "Cycle time",
        displayValue: "4h 12m",
        rawValue: 252,
        target: 300,
        status: "ok",
      },
    ],
    kpiQuality: [
      {
        name: "Incidents",
        displayValue: "2",
        rawValue: 2,
        target: 0,
        status: "critical",
      },
    ],
  },
  {
    id: 2,
    code: "proc-2",
    name: "Invoice Process",
    description: "Manages invoice approval workflow",
    statusSelect: 1,
    versionTag: "2.1",
    kpiTime: [
      {
        name: "Cycle time",
        displayValue: "1h 30m",
        rawValue: 90,
        target: 120,
        status: "ok",
      },
    ],
    kpiQuality: [
      {
        name: "Incidents",
        displayValue: "0",
        rawValue: 0,
        target: 0,
        status: "ok",
      },
    ],
  },
  {
    id: 3,
    code: "proc-3",
    name: "Leave Request",
    description: "Employee leave approval",
    statusSelect: 2,
    versionTag: "1.3",
    kpiTime: [
      {
        name: "Cycle time",
        displayValue: "8h 45m",
        rawValue: 525,
        target: 480,
        status: "warning",
      },
    ],
    kpiQuality: [
      {
        name: "Incidents",
        displayValue: "1",
        rawValue: 1,
        target: 0,
        status: "critical",
      },
    ],
  },
];

export const mockTaskStats: TaskStatsData = {
  tasksDueToday: 5,
  tasksOverdue: 2,
  tasksUpcoming: 12,
  instancesByStatus: [
    { status: "ACTIVE", count: 45 },
    { status: "COMPLETED", count: 120 },
    { status: "INTERNALLY_TERMINATED", count: 8 },
  ],
};

export const mockAdoption: AdoptionOverview = {
  totalProcesses: 3,
  currentlyRunning: 45,
  endedInPeriod: 78,
  monthlyCounts: [
    { month: "2026-01", processName: "Order Process", count: 30 },
    { month: "2026-02", processName: "Order Process", count: 48 },
    { month: "2026-01", processName: "Invoice Process", count: 15 },
    { month: "2026-02", processName: "Invoice Process", count: 22 },
  ],
};

// ---------------------------------------------------------------------------
// Phase 51: Instance Analysis mock data
// ---------------------------------------------------------------------------

export const mockInstances: InstanceSummary[] = [
  {
    instanceId: "inst-abc-001",
    processDefinitionKey: "proc-1",
    status: "INTERNALLY_TERMINATED",
    startTime: "2026-04-01T10:00:00Z",
    endTime: null,
    durationMs: 86400000,
    progress: 0.4,
    linkedObjects: [
      {
        modelName: "SaleOrder",
        modelFullName: "com.axelor.sale.db.SaleOrder",
        recordId: 42,
        displayName: "SO-2024-042",
      },
    ],
    hasError: true,
    errorMessage: "NullPointerException in ServiceTask_1",
    currentNode: "ServiceTask_1",
  },
  {
    instanceId: "inst-abc-002",
    processDefinitionKey: "proc-1",
    status: "ACTIVE",
    startTime: "2026-04-02T08:00:00Z",
    endTime: null,
    durationMs: 43200000,
    progress: 0.65,
    linkedObjects: [
      {
        modelName: "SaleOrder",
        modelFullName: "com.axelor.sale.db.SaleOrder",
        recordId: 43,
        displayName: "SO-2024-043",
      },
    ],
    hasError: false,
    errorMessage: null,
    currentNode: null,
  },
  {
    instanceId: "inst-abc-003",
    processDefinitionKey: "proc-1",
    status: "COMPLETED",
    startTime: "2026-03-28T09:00:00Z",
    endTime: "2026-03-30T17:00:00Z",
    durationMs: 201600000,
    progress: 1.0,
    linkedObjects: [
      {
        modelName: "SaleOrder",
        modelFullName: "com.axelor.sale.db.SaleOrder",
        recordId: 44,
        displayName: "SO-2024-044",
      },
    ],
    hasError: false,
    errorMessage: null,
    currentNode: null,
  },
];

export const mockInstanceCounts: InstanceCountsResponse = {
  running: 42,
  completed: 318,
  failed: 7,
  suspended: 3,
};

export const mockActivities: ActivityData[] = [
  {
    activityId: "StartEvent_1",
    activityName: "Start",
    activityType: "startEvent",
    isActive: false,
    passCount: 1,
    durationMs: 0,
  },
  {
    activityId: "UserTask_1",
    activityName: "Review Order",
    activityType: "userTask",
    isActive: true,
    passCount: 1,
    durationMs: 3600000,
  },
  {
    activityId: "ServiceTask_1",
    activityName: "Process Payment",
    activityType: "serviceTask",
    isActive: false,
    passCount: 2,
    durationMs: 120000,
  },
];

export const mockNodeDetail: NodeDetail = {
  activityId: "UserTask_1",
  activityName: "Review Order",
  activityType: "userTask",
  duration: { total: 3600000, work: 2400000, idle: 1200000 },
  durationStats: { avg: 3200000, min: 1800000, max: 5400000, count: 42 },
  assignee: "admin",
  candidateGroups: ["managers", "reviewers"],
  assignmentDate: "2026-04-02T08:15:00Z",
  passages: [
    {
      startTime: "2026-04-02T08:15:00Z",
      endTime: "2026-04-02T09:15:00Z",
      durationMs: 3600000,
      assignee: "admin",
    },
  ],
  branches: [],
};

const MOCK_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?><bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"><bpmn:process id="proc-1" isExecutable="true"><bpmn:startEvent id="StartEvent_1"/></bpmn:process></bpmn:definitions>`;

export const handlers = [
  http.post(
    "*/ws/action/com.axelor.studio.bpm.web.CockpitProcessController:getProcessList",
    () => HttpResponse.json({ data: [{ processes: mockProcessList }] }),
  ),
  http.post(
    "*/ws/action/com.axelor.studio.bpm.web.CockpitTaskController:getTaskStats",
    () => HttpResponse.json({ data: [mockTaskStats] }),
  ),
  http.post(
    "*/ws/action/com.axelor.studio.bpm.web.CockpitProcessController:getAdoptionOverview",
    () => HttpResponse.json({ data: [mockAdoption] }),
  ),
  // Layout persistence endpoints (MetaViewCustom)
  http.post("*/ws/meta/view/custom", () =>
    HttpResponse.json({ data: { items: [] } }),
  ),
  http.post("*/ws/meta/view/save", () => HttpResponse.json({ status: 0 })),

  // --- Phase 51: Instance endpoints ---
  http.post(
    "*/ws/action/com.axelor.studio.bpm.web.CockpitInstanceController:getInstances",
    () =>
      HttpResponse.json({
        data: [
          { instances: mockInstances, total: 3, offset: 0, limit: 20 },
        ],
      }),
  ),
  http.post(
    "*/ws/action/com.axelor.studio.bpm.web.CockpitInstanceController:getInstanceCounts",
    () => HttpResponse.json({ data: [mockInstanceCounts] }),
  ),
  http.post(
    "*/ws/action/com.axelor.studio.bpm.web.CockpitInstanceController:getInstanceActivities",
    () =>
      HttpResponse.json({
        data: [
          {
            activities: mockActivities,
            processInstanceId: "inst-abc-002",
          },
        ],
      }),
  ),
  http.post(
    "*/ws/action/com.axelor.studio.bpm.web.CockpitInstanceController:getNodeDetail",
    () => HttpResponse.json({ data: [{ nodeDetail: mockNodeDetail }] }),
  ),
  http.post(
    "*/ws/action/com.axelor.studio.bpm.web.CockpitInstanceController:getBranchDistribution",
    () =>
      HttpResponse.json({
        data: [{ distributions: [], gatewayId: "Gateway_1" }],
      }),
  ),
  http.post(
    "*/ws/action/com.axelor.studio.bpm.web.CockpitInstanceController:getInstanceXml",
    () => HttpResponse.json({ data: [{ xml: MOCK_BPMN_XML }] }),
  ),

  // --- Phase 52: Analytics endpoints ---
  http.post(
    "*/ws/action/com.axelor.studio.bpm.web.CockpitAnalyticsController:getNodeDurationStats",
    () => HttpResponse.json({ data: [mockNodeDurationResponse] }),
  ),
  http.post(
    "*/ws/action/com.axelor.studio.bpm.web.CockpitAnalyticsController:getStatusTrend",
    () => HttpResponse.json({ data: [mockStatusTrend] }),
  ),
  http.post(
    "*/ws/action/com.axelor.studio.bpm.web.CockpitAnalyticsController:getAssigneeThroughput",
    () => HttpResponse.json({ data: [mockAssigneeThroughputResponse] }),
  ),
  http.post(
    "*/ws/action/com.axelor.studio.bpm.web.CockpitAnalyticsController:getSankeyData",
    () => HttpResponse.json({ data: [mockSankeyData] }),
  ),
  http.post(
    "*/ws/action/com.axelor.studio.bpm.web.CockpitAnalyticsController:getCalendarHeatmap",
    () =>
      HttpResponse.json({ data: [{ entries: mockCalendarHeatmap }] }),
  ),
];
