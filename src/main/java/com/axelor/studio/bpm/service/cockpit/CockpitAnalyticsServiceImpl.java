/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.cockpit;

import com.axelor.studio.bpm.dto.AnalyticsNodeDurationDto;
import com.axelor.studio.bpm.dto.AssigneeThroughputDto;
import com.axelor.studio.bpm.dto.CalendarHeatmapDto;
import com.axelor.studio.bpm.dto.SankeyDataDto;
import com.axelor.studio.bpm.dto.SankeyDataDto.SankeyNodeDto;
import com.axelor.studio.bpm.dto.SankeyLinkDto;
import com.axelor.studio.bpm.dto.StatusTrendDto;
import jakarta.inject.Inject;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Orchestrates analytics queries by combining period parsing, granularity logic and SQL delegation
 * to {@link CockpitCamundaQueryService}.
 */
public class CockpitAnalyticsServiceImpl implements CockpitAnalyticsService {

  protected final CockpitCamundaQueryService queryService;

  @Inject
  public CockpitAnalyticsServiceImpl(CockpitCamundaQueryService queryService) {
    this.queryService = queryService;
  }

  @Override
  public List<AnalyticsNodeDurationDto> getNodeDurationStats(
      String processDefinitionKey, String period) {
    LocalDateTime since = toLocalDateTime(period);
    return queryService.queryNodeDurationStats(processDefinitionKey, since);
  }

  @Override
  public List<StatusTrendDto> getStatusTrend(String processDefinitionKey, String period) {
    String granularity = computeGranularity(period);
    LocalDateTime since = toLocalDateTime(period);
    return queryService.queryStatusTrend(processDefinitionKey, since, granularity);
  }

  @Override
  public String computeGranularity(String period) {
    if (period == null || period.length() < 2) {
      return "DAY";
    }
    String numberPart = period.substring(0, period.length() - 1);
    char unit = period.charAt(period.length() - 1);
    int amount;
    try {
      amount = Integer.parseInt(numberPart);
    } catch (NumberFormatException e) {
      return "DAY";
    }

    // D-16: 7d->HOUR, 30d->DAY, 90d->WEEK, else->MONTH
    if (unit == 'd') {
      if (amount <= 7) {
        return "HOUR";
      } else if (amount <= 30) {
        return "DAY";
      } else if (amount <= 90) {
        return "WEEK";
      } else {
        return "MONTH";
      }
    }
    // Months or years always use MONTH granularity
    return "MONTH";
  }

  @Override
  public List<AssigneeThroughputDto> getAssigneeThroughput(
      String processDefinitionKey, String period) {
    LocalDateTime since = toLocalDateTime(period);
    return queryService.queryAssigneeThroughput(processDefinitionKey, since);
  }

  @Override
  public SankeyDataDto getSankeyData(String processDefinitionKey, String period) {
    LocalDateTime since = toLocalDateTime(period);
    List<SankeyLinkDto> links = queryService.querySankeyTransitions(processDefinitionKey, since);

    // Collect unique node names from links and build node list with display names
    Set<String> nodeNames = new LinkedHashSet<>();
    for (SankeyLinkDto link : links) {
      nodeNames.add(link.source());
      nodeNames.add(link.target());
    }
    List<SankeyNodeDto> nodes = new ArrayList<>();
    for (String name : nodeNames) {
      // Display name: use the activity ID as display name (activity names would require
      // a separate query; can be enriched later if needed)
      nodes.add(new SankeyNodeDto(name, name));
    }
    return new SankeyDataDto(nodes, links);
  }

  @Override
  public List<CalendarHeatmapDto> getCalendarHeatmap(String period) {
    LocalDateTime since = toLocalDateTime(period);
    return queryService.queryCalendarHeatmap(since);
  }

  /**
   * Converts a period string to a LocalDateTime by leveraging the existing periodToTimestamp on the
   * query service.
   */
  private LocalDateTime toLocalDateTime(String period) {
    Timestamp ts = queryService.periodToTimestamp(period);
    return ts.toLocalDateTime();
  }
}
