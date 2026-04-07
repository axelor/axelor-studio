/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.cockpit;

import com.axelor.studio.bpm.dto.AdoptionOverviewDto;
import com.axelor.studio.bpm.dto.ProcessSummaryDto;
import java.util.List;

/** Domain service for process list with KPIs — delegates to CockpitCamundaQueryService. */
public interface CockpitProcessService {

  /** Returns all deployed processes with their KPI badges. */
  List<ProcessSummaryDto> getProcessList(String period);

  /** Returns adoption overview KPIs for the cockpit dashboard. */
  AdoptionOverviewDto getAdoptionOverview(String period);
}
