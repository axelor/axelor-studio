/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.dto;

import java.util.List;

/** Global adoption KPIs for the cockpit overview section. */
public record AdoptionOverviewDto(
    long totalProcesses,
    long currentlyRunning,
    long endedInPeriod,
    List<MonthlyProcessCountDto> monthlyCounts) {}
