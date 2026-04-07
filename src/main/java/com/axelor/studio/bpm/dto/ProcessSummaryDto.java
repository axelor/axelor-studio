/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.dto;

import java.util.List;

/** Process list item DTO with KPI values for time and quality dimensions. */
public record ProcessSummaryDto(
    Long id,
    String code,
    String name,
    String description,
    int statusSelect,
    String versionTag,
    List<KpiValueDto> kpiTime,
    List<KpiValueDto> kpiQuality) {}
