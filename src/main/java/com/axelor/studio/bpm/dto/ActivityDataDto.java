/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.dto;

/** Activity data for BPMN overlay rendering (pass count, active state, duration). */
public record ActivityDataDto(
    String activityId,
    String activityName,
    String activityType,
    boolean isActive,
    int passCount,
    Long durationMs) {}
