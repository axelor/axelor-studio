/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.dto;

/**
 * Percentile-enriched duration statistics for a BPMN activity across all instances of a process.
 * Field names aligned with TypeScript {@code AnalyticsNodeDuration} interface for zero-mapping JSON
 * serialization.
 */
public record AnalyticsNodeDurationDto(
    String activityId,
    String activityName,
    String activityType,
    long avg,
    long min,
    long max,
    int count,
    long p50,
    long p95,
    long p99,
    long totalDuration,
    long workDuration,
    long idleDuration) {}
