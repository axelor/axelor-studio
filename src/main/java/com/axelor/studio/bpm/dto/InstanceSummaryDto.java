/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.dto;

import java.util.List;

/** Summary of a single process instance for the cockpit instance list. */
public record InstanceSummaryDto(
    String instanceId,
    String processDefinitionKey,
    String status,
    String startTime,
    String endTime,
    long durationMs,
    double progress,
    List<LinkedObjectDto> linkedObjects,
    boolean hasError,
    String errorMessage,
    String currentNode) {}
