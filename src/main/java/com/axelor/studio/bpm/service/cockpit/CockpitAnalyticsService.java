/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.cockpit;

import com.axelor.studio.bpm.dto.AnalyticsNodeDurationDto;
import com.axelor.studio.bpm.dto.AssigneeThroughputDto;
import com.axelor.studio.bpm.dto.CalendarHeatmapDto;
import com.axelor.studio.bpm.dto.SankeyDataDto;
import com.axelor.studio.bpm.dto.StatusTrendDto;
import java.util.List;

/**
 * Analytics aggregation service for cockpit charts. Delegates heavy SQL queries to {@link
 * CockpitCamundaQueryService} and applies business logic (granularity, period parsing, node name
 * resolution).
 */
public interface CockpitAnalyticsService {

  /** Percentile-enriched duration statistics per activity node for a process definition. */
  List<AnalyticsNodeDurationDto> getNodeDurationStats(
      String processDefinitionKey, String period);

  /** Time-bucketed status trend with auto-computed granularity. */
  List<StatusTrendDto> getStatusTrend(String processDefinitionKey, String period);

  /**
   * Computes the DATE_TRUNC granularity for a given period string.
   *
   * @return one of "HOUR", "DAY", "WEEK", "MONTH"
   */
  String computeGranularity(String period);

  /** Assignee throughput from completed tasks. */
  List<AssigneeThroughputDto> getAssigneeThroughput(
      String processDefinitionKey, String period);

  /** Node-to-node transition data for Sankey diagrams. */
  SankeyDataDto getSankeyData(String processDefinitionKey, String period);

  /** Calendar heatmap: instance count per day across all processes. */
  List<CalendarHeatmapDto> getCalendarHeatmap(String period);
}
