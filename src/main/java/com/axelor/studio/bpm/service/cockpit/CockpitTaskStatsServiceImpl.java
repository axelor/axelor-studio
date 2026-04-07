/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.cockpit;

import com.axelor.studio.bpm.dto.StatusCountDto;
import com.axelor.studio.bpm.dto.TaskStatsDto;
import jakarta.inject.Inject;
import java.util.List;

/** Assembles {@link TaskStatsDto} by orchestrating calls to {@link CockpitCamundaQueryService}. */
public class CockpitTaskStatsServiceImpl implements CockpitTaskStatsService {

  private static final int UPCOMING_DAYS_AHEAD = 7;

  protected final CockpitCamundaQueryService queryService;

  @Inject
  public CockpitTaskStatsServiceImpl(CockpitCamundaQueryService queryService) {
    this.queryService = queryService;
  }

  @Override
  public TaskStatsDto getTaskStats() {
    long tasksDueToday = queryService.countTasksDueToday();
    long tasksOverdue = queryService.countTasksOverdue();
    long tasksUpcoming = queryService.countTasksUpcoming(UPCOMING_DAYS_AHEAD);
    List<StatusCountDto> instancesByStatus = queryService.countInstancesByStatus();

    return new TaskStatsDto(tasksDueToday, tasksOverdue, tasksUpcoming, instancesByStatus);
  }
}
