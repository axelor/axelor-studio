/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.dto;

import java.util.List;

/** Full detail for a BPMN node: duration, assignee, passages, and branch distribution. */
public record NodeDetailDto(
    String activityId,
    String activityName,
    String activityType,
    NodeDurationDto duration,
    NodeDurationStatsDto durationStats,
    String assignee,
    List<String> candidateGroups,
    String assignmentDate,
    List<PassageDto> passages,
    List<BranchDistributionDto> branches) {}
