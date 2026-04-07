/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.dto;

/** Duration breakdown for a node: total elapsed, active work, and idle time. */
public record NodeDurationDto(long total, long work, long idle) {}
