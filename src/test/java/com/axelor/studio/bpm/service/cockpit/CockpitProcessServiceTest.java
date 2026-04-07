/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.cockpit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.axelor.studio.bpm.dto.KpiValueDto;
import com.axelor.studio.bpm.dto.MonthlyProcessCountDto;
import com.axelor.studio.bpm.dto.ProcessSummaryDto;
import com.axelor.studio.db.WkfModel;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class CockpitProcessServiceTest {

  private CockpitProcessServiceImpl service;
  private CockpitCamundaQueryService queryService;

  @BeforeEach
  void setUp() {
    queryService = mock(CockpitCamundaQueryService.class);
    service = new CockpitProcessServiceImpl(queryService);
  }

  @Test
  void getProcessList_buildsKpisForTwoModels() {
    WkfModel model1 = createModel(1L, "proc-a", "Process A");
    WkfModel model2 = createModel(2L, "proc-b", "Process B");
    when(queryService.findDeployedModels()).thenReturn(List.of(model1, model2));

    // Model 1: has cycle time, some failures
    when(queryService.averageCycleTimeMinutes("proc-a")).thenReturn(150.0);
    when(queryService.countRunningInstances("proc-a")).thenReturn(5L);
    when(queryService.countFailedInstances("proc-a")).thenReturn(2L);
    when(queryService.countOpenIncidents("proc-a")).thenReturn(0L);

    // Model 2: no cycle time data, no failures
    when(queryService.averageCycleTimeMinutes("proc-b")).thenReturn(null);
    when(queryService.countRunningInstances("proc-b")).thenReturn(10L);
    when(queryService.countFailedInstances("proc-b")).thenReturn(0L);
    when(queryService.countOpenIncidents("proc-b")).thenReturn(0L);

    List<ProcessSummaryDto> result = service.getProcessList("30d");

    assertEquals(2, result.size());

    // Model 1: should have cycle time KPI
    ProcessSummaryDto dto1 = result.get(0);
    assertEquals("proc-a", dto1.code());
    assertEquals(1, dto1.kpiTime().size(), "proc-a has cycle time data");
    assertEquals("Cycle time", dto1.kpiTime().get(0).name());
    assertEquals("2h 30m", dto1.kpiTime().get(0).displayValue());

    // Model 1: quality KPIs
    assertEquals(3, dto1.kpiQuality().size());
    KpiValueDto failedKpi =
        dto1.kpiQuality().stream().filter(k -> k.name().equals("Failed")).findFirst().orElseThrow();
    assertEquals("critical", failedKpi.status(), "Failed > 0 should be critical");

    // Model 2: no cycle time
    ProcessSummaryDto dto2 = result.get(1);
    assertEquals("proc-b", dto2.code());
    assertTrue(dto2.kpiTime().isEmpty(), "proc-b has no cycle time data");

    // Model 2: all quality ok
    KpiValueDto failedKpi2 =
        dto2.kpiQuality().stream().filter(k -> k.name().equals("Failed")).findFirst().orElseThrow();
    assertEquals("ok", failedKpi2.status(), "Failed == 0 should be ok");
  }

  @Test
  void getProcessList_incidentsCriticalWhenNonZero() {
    WkfModel model = createModel(1L, "proc-x", "Process X");
    when(queryService.findDeployedModels()).thenReturn(List.of(model));
    when(queryService.averageCycleTimeMinutes("proc-x")).thenReturn(null);
    when(queryService.countRunningInstances("proc-x")).thenReturn(0L);
    when(queryService.countFailedInstances("proc-x")).thenReturn(0L);
    when(queryService.countOpenIncidents("proc-x")).thenReturn(3L);

    List<ProcessSummaryDto> result = service.getProcessList("30d");

    KpiValueDto incidentKpi =
        result.get(0).kpiQuality().stream()
            .filter(k -> k.name().equals("Incidents"))
            .findFirst()
            .orElseThrow();
    assertEquals("critical", incidentKpi.status());
    assertEquals("3", incidentKpi.displayValue());
  }

  @Test
  void getAdoptionOverview_assemblesTotalCounts() {
    WkfModel model1 = createModel(1L, "a", "A");
    WkfModel model2 = createModel(2L, "b", "B");
    when(queryService.findDeployedModels()).thenReturn(List.of(model1, model2));
    when(queryService.countCurrentlyRunningTotal()).thenReturn(42L);
    when(queryService.countEndedInPeriod("30d")).thenReturn(100L);
    when(queryService.monthlyInstanceCounts("30d"))
        .thenReturn(List.of(new MonthlyProcessCountDto("2026-03", "a", 50)));

    var result = service.getAdoptionOverview("30d");

    assertEquals(2, result.totalProcesses());
    assertEquals(42L, result.currentlyRunning());
    assertEquals(100L, result.endedInPeriod());
    assertEquals(1, result.monthlyCounts().size());
  }

  @Test
  void slaStatus_okAbove80() {
    assertEquals("ok", CockpitProcessServiceImpl.slaStatus(90.0));
    assertEquals("ok", CockpitProcessServiceImpl.slaStatus(80.0));
  }

  @Test
  void slaStatus_warningBetween50And80() {
    assertEquals("warning", CockpitProcessServiceImpl.slaStatus(79.9));
    assertEquals("warning", CockpitProcessServiceImpl.slaStatus(50.0));
  }

  @Test
  void slaStatus_criticalBelow50() {
    assertEquals("critical", CockpitProcessServiceImpl.slaStatus(49.9));
    assertEquals("critical", CockpitProcessServiceImpl.slaStatus(0.0));
  }

  @Test
  void formatCycleTime_minutesOnly() {
    assertEquals("45m", CockpitProcessServiceImpl.formatCycleTime(45.0));
    assertEquals("0m", CockpitProcessServiceImpl.formatCycleTime(0.0));
  }

  @Test
  void formatCycleTime_hoursAndMinutes() {
    assertEquals("2h 30m", CockpitProcessServiceImpl.formatCycleTime(150.0));
    assertEquals("1h", CockpitProcessServiceImpl.formatCycleTime(60.0));
  }

  // ---- Helpers ----

  private static WkfModel createModel(Long id, String code, String name) {
    WkfModel model = mock(WkfModel.class);
    when(model.getId()).thenReturn(id);
    when(model.getCode()).thenReturn(code);
    when(model.getName()).thenReturn(name);
    when(model.getDescription()).thenReturn("Description of " + name);
    when(model.getStatusSelect()).thenReturn(2); // ON_GOING
    when(model.getVersionTag()).thenReturn("1.0");
    return model;
  }
}
