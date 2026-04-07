/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.dto;

import java.util.List;

/** Aggregated task counters and instance status breakdown. */
public record TaskStatsDto(
    long tasksDueToday,
    long tasksOverdue,
    long tasksUpcoming,
    List<StatusCountDto> instancesByStatus) {}
