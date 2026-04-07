/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.dto;

/** Aggregate duration statistics for a node across all instances of a process. */
public record NodeDurationStatsDto(long avg, long min, long max, int count) {}
