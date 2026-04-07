/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.dto;

/** Throughput statistics for a task assignee within a process. */
public record AssigneeThroughputDto(
    String assignee, int taskCount, long avgDuration, long totalDuration) {}
