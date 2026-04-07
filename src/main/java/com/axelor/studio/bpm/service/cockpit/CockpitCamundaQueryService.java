/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.cockpit;

import com.axelor.studio.bpm.dto.AnalyticsNodeDurationDto;
import com.axelor.studio.bpm.dto.AssigneeThroughputDto;
import com.axelor.studio.bpm.dto.CalendarHeatmapDto;
import com.axelor.studio.bpm.dto.InstanceCountsDto;
import com.axelor.studio.bpm.dto.MonthlyProcessCountDto;
import com.axelor.studio.bpm.dto.NodeDurationStatsDto;
import com.axelor.studio.bpm.dto.SankeyLinkDto;
import com.axelor.studio.bpm.dto.StatusCountDto;
import com.axelor.studio.bpm.dto.StatusTrendDto;
import com.axelor.studio.db.WkfModel;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Shared Camunda query layer — the ONLY place that touches Camunda runtime/history tables or APIs.
 * All cockpit domain services must go through this interface for data access.
 */
public interface CockpitCamundaQueryService {

  /** Returns all deployed WkfModels (status ON_GOING or TERMINATED). */
  List<WkfModel> findDeployedModels();

  /** Counts ACTIVE process instances for a given process definition key. */
  long countRunningInstances(String processDefinitionKey);

  /** Counts INTERNALLY_TERMINATED process instances for a given process definition key. */
  long countFailedInstances(String processDefinitionKey);

  /** Counts COMPLETED process instances for a given process definition key. */
  long countCompletedInstances(String processDefinitionKey);

  /** Counts open incidents for a given process definition key. */
  long countOpenIncidents(String processDefinitionKey);

  /** Average cycle time in minutes for completed instances. Returns null if no data. */
  Double averageCycleTimeMinutes(String processDefinitionKey);

  /** SLA compliance percentage for completed instances within target minutes. */
  Double slaCompliancePercent(String processDefinitionKey, int targetMinutes);

  /** Counts tasks whose due date is today. */
  long countTasksDueToday();

  /** Counts overdue tasks (due date in the past). */
  long countTasksOverdue();

  /** Counts tasks due within the next N days. */
  long countTasksUpcoming(int daysAhead);

  /** Instance counts grouped by status (ACTIVE, COMPLETED, etc.). */
  List<StatusCountDto> countInstancesByStatus();

  /** Monthly instance counts per process, filtered by period (e.g. "30d", "6m"). */
  List<MonthlyProcessCountDto> monthlyInstanceCounts(String period);

  /** Total currently running instances across all processes. */
  long countCurrentlyRunningTotal();

  /** Total instances ended within a period (e.g. "7d", "30d"). */
  long countEndedInPeriod(String period);

  // ---- Instance-level queries (Phase 51) ----

  /**
   * Paginated historic process instances for a given process definition key.
   *
   * @param processDefinitionKey the process definition key
   * @param statusFilter optional status filter (ACTIVE, COMPLETED, INTERNALLY_TERMINATED,
   *     SUSPENDED) — null for all
   * @param offset pagination offset
   * @param limit maximum number of results
   * @param sortOrder sort direction ("asc" or "desc", default desc by start time)
   * @return list of historic process instance rows as Object arrays
   */
  List<Object[]> findHistoricInstances(
      String processDefinitionKey, String statusFilter, int offset, int limit, String sortOrder);

  /**
   * Total count of historic instances for pagination.
   *
   * @param processDefinitionKey the process definition key
   * @param statusFilter optional status filter — null for all
   * @param search optional search string matched against proc_inst_id_ (null to skip)
   */
  long countHistoricInstances(String processDefinitionKey, String statusFilter, String search);

  /** Instance counts grouped by status for a given process definition key. */
  InstanceCountsDto getInstanceCounts(String processDefinitionKey);

  /** Active activity IDs for a running process instance (empty list if not active). */
  List<String> getActiveActivityIds(String processInstanceId);

  /**
   * All historic activity instances for a process instance as Object arrays: [act_id_, act_name_,
   * act_type_, start_time_, end_time_, duration_, assignee_].
   */
  List<Object[]> getHistoricActivities(String processInstanceId);

  /** Activity pass counts (how many times each activity was executed). */
  Map<String, Integer> getActivityPassCounts(String processInstanceId);

  /** Duration stats per activity across all instances of a process. */
  Map<String, NodeDurationStatsDto> getNodeDurationStats(String processDefinitionKey);

  /** BPMN XML for a process definition by process instance ID. */
  String getProcessDefinitionXml(String processDefinitionId);

  /**
   * Total flow node count in a BPMN model (tasks + events + gateways, excludes sequence flows and
   * annotations).
   */
  int countFlowNodes(String processDefinitionKey);

  // ---- Analytics queries (Phase 52) ----

  /**
   * Converts a period string (e.g. "7d", "30d", "90d", "6m", "1y") to a {@link Timestamp}.
   *
   * @param period the period string
   * @return a timestamp representing the start of the period relative to now
   */
  Timestamp periodToTimestamp(String period);

  /**
   * Percentile-enriched duration statistics per activity for a process definition.
   *
   * <p>Uses PERCENTILE_CONT(0.50/0.95/0.99) for P50/P95/P99 computation.
   */
  List<AnalyticsNodeDurationDto> queryNodeDurationStats(
      String processDefKey, LocalDateTime since);

  /**
   * Time-bucketed status trend using DATE_TRUNC with the specified granularity.
   *
   * @param granularity one of "HOUR", "DAY", "WEEK", "MONTH" (whitelist-validated)
   */
  List<StatusTrendDto> queryStatusTrend(
      String processDefKey, LocalDateTime since, String granularity);

  /** Assignee throughput from completed tasks (via act_hi_taskinst). */
  List<AssigneeThroughputDto> queryAssigneeThroughput(
      String processDefKey, LocalDateTime since);

  /** Node-to-node transitions via LAG window function for Sankey diagrams. */
  List<SankeyLinkDto> querySankeyTransitions(
      String processDefKey, LocalDateTime since);

  /** Calendar heatmap: instance count per day across all processes. */
  List<CalendarHeatmapDto> queryCalendarHeatmap(LocalDateTime since);
}
