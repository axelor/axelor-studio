/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.cockpit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.axelor.studio.bpm.dto.StatusCountDto;
import com.axelor.studio.bpm.dto.TaskStatsDto;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class CockpitTaskStatsServiceTest {

  private CockpitTaskStatsServiceImpl service;
  private CockpitCamundaQueryService queryService;

  @BeforeEach
  void setUp() {
    queryService = mock(CockpitCamundaQueryService.class);
    service = new CockpitTaskStatsServiceImpl(queryService);
  }

  @Test
  void getTaskStats_assemblesCorrectDto() {
    when(queryService.countTasksDueToday()).thenReturn(5L);
    when(queryService.countTasksOverdue()).thenReturn(2L);
    when(queryService.countTasksUpcoming(7)).thenReturn(12L);
    when(queryService.countInstancesByStatus())
        .thenReturn(
            List.of(new StatusCountDto("ACTIVE", 30), new StatusCountDto("COMPLETED", 100)));

    TaskStatsDto result = service.getTaskStats();

    assertEquals(5L, result.tasksDueToday());
    assertEquals(2L, result.tasksOverdue());
    assertEquals(12L, result.tasksUpcoming());
    assertEquals(2, result.instancesByStatus().size());
    assertEquals("ACTIVE", result.instancesByStatus().get(0).status());
    assertEquals(30L, result.instancesByStatus().get(0).count());
  }

  @Test
  void getTaskStats_callsUpcomingWith7Days() {
    when(queryService.countTasksDueToday()).thenReturn(0L);
    when(queryService.countTasksOverdue()).thenReturn(0L);
    when(queryService.countTasksUpcoming(7)).thenReturn(0L);
    when(queryService.countInstancesByStatus()).thenReturn(List.of());

    service.getTaskStats();

    verify(queryService).countTasksUpcoming(7);
  }
}
