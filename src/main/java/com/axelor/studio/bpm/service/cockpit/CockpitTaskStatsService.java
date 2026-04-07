/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.cockpit;

import com.axelor.studio.bpm.dto.TaskStatsDto;

/** Domain service for task statistics — delegates to CockpitCamundaQueryService. */
public interface CockpitTaskStatsService {

  /** Returns aggregated task counters and instance-by-status breakdown. */
  TaskStatsDto getTaskStats();
}
