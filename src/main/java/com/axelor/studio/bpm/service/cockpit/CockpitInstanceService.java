/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.cockpit;

import com.axelor.studio.bpm.dto.ActivityDataDto;
import com.axelor.studio.bpm.dto.BranchDistributionDto;
import com.axelor.studio.bpm.dto.InstanceCountsDto;
import com.axelor.studio.bpm.dto.InstanceSummaryDto;
import com.axelor.studio.bpm.dto.NodeDetailDto;
import java.util.List;

/**
 * Domain service for instance-level cockpit views. Orchestrates {@link CockpitCamundaQueryService}
 * queries and WkfInstance/WkfProcess JPA queries to build instance DTOs.
 */
public interface CockpitInstanceService {

  /** Paginated instance list for a process, with linked objects resolved. */
  List<InstanceSummaryDto> getInstances(
      long processId, String status, int offset, int limit, String search);

  /** Total instance count for pagination. */
  long getInstanceCount(long processId, String status, String search);

  /** Instance counts for ProcessHeader. */
  InstanceCountsDto getInstanceCounts(long processId);

  /** Active activities + pass counts for BPMN overlay rendering. */
  List<ActivityDataDto> getInstanceActivities(String processInstanceId);

  /** Full node detail for NodeDetailPanel. */
  NodeDetailDto getNodeDetail(
      String processInstanceId, String activityId, String processDefinitionKey);

  /** Gateway branch distribution. */
  List<BranchDistributionDto> getBranchDistribution(String processDefinitionKey, String gatewayId);

  /** BPMN XML for rendering. */
  String getInstanceXml(long processId);
}
