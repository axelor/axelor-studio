/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.cockpit;

import com.axelor.studio.bpm.dto.AdoptionOverviewDto;
import com.axelor.studio.bpm.dto.KpiValueDto;
import com.axelor.studio.bpm.dto.MonthlyProcessCountDto;
import com.axelor.studio.bpm.dto.ProcessSummaryDto;
import com.axelor.studio.db.WkfModel;
import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.List;

/**
 * Assembles {@link ProcessSummaryDto} with KPI values by orchestrating calls to {@link
 * CockpitCamundaQueryService}.
 */
public class CockpitProcessServiceImpl implements CockpitProcessService {

  protected final CockpitCamundaQueryService queryService;

  @Inject
  public CockpitProcessServiceImpl(CockpitCamundaQueryService queryService) {
    this.queryService = queryService;
  }

  @Override
  public List<ProcessSummaryDto> getProcessList(String period) {
    List<WkfModel> models = queryService.findDeployedModels();
    List<ProcessSummaryDto> result = new ArrayList<>();

    for (WkfModel model : models) {
      String key = model.getCode();
      List<KpiValueDto> kpiTime = buildTimeKpis(key);
      List<KpiValueDto> kpiQuality = buildQualityKpis(key);

      result.add(
          new ProcessSummaryDto(
              model.getId(),
              model.getCode(),
              model.getName(),
              model.getDescription(),
              model.getStatusSelect(),
              model.getVersionTag(),
              kpiTime,
              kpiQuality));
    }

    return result;
  }

  @Override
  public AdoptionOverviewDto getAdoptionOverview(String period) {
    long totalProcesses = queryService.findDeployedModels().size();
    long currentlyRunning = queryService.countCurrentlyRunningTotal();
    long endedInPeriod = queryService.countEndedInPeriod(period);
    List<MonthlyProcessCountDto> monthlyCounts = queryService.monthlyInstanceCounts(period);

    return new AdoptionOverviewDto(totalProcesses, currentlyRunning, endedInPeriod, monthlyCounts);
  }

  // ---- KPI builders ----

  private List<KpiValueDto> buildTimeKpis(String processDefinitionKey) {
    List<KpiValueDto> kpis = new ArrayList<>();

    // Cycle time
    Double cycleTime = queryService.averageCycleTimeMinutes(processDefinitionKey);
    if (cycleTime != null) {
      kpis.add(new KpiValueDto("Cycle time", formatCycleTime(cycleTime), cycleTime, null, "ok"));
    }

    // SLA compliance — only available when a target duration is configured on the model.
    // WkfModel currently has no targetDuration field, so SLA KPI is skipped.
    // When the field is added, call:
    //   queryService.slaCompliancePercent(key, targetMinutes) and build the KPI here.

    return kpis;
  }

  private List<KpiValueDto> buildQualityKpis(String processDefinitionKey) {
    List<KpiValueDto> kpis = new ArrayList<>();

    long running = queryService.countRunningInstances(processDefinitionKey);
    kpis.add(new KpiValueDto("Running", String.valueOf(running), running, null, "ok"));

    long failed = queryService.countFailedInstances(processDefinitionKey);
    kpis.add(
        new KpiValueDto(
            "Failed", String.valueOf(failed), failed, 0.0, failed == 0 ? "ok" : "critical"));

    long incidents = queryService.countOpenIncidents(processDefinitionKey);
    kpis.add(
        new KpiValueDto(
            "Incidents",
            String.valueOf(incidents),
            incidents,
            0.0,
            incidents == 0 ? "ok" : "critical"));

    return kpis;
  }

  /**
   * Formats a cycle time in minutes to a human-readable string.
   *
   * @param minutes cycle time in minutes
   * @return formatted string, e.g. "2h 30m" or "45m"
   */
  static String formatCycleTime(double minutes) {
    long totalMinutes = Math.round(minutes);
    if (totalMinutes < 60) {
      return totalMinutes + "m";
    }
    long hours = totalMinutes / 60;
    long remaining = totalMinutes % 60;
    if (remaining == 0) {
      return hours + "h";
    }
    return hours + "h " + remaining + "m";
  }

  /**
   * Computes the SLA status based on the compliance percentage.
   *
   * @param percent SLA compliance percentage (0-100)
   * @return "ok" if >= 80, "warning" if >= 50, "critical" if < 50
   */
  static String slaStatus(double percent) {
    if (percent >= 80) {
      return "ok";
    }
    if (percent >= 50) {
      return "warning";
    }
    return "critical";
  }
}
