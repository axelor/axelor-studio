/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.dto;

/** A single time-bucket data point for status trend charts. */
public record StatusTrendDto(String timeBucket, int running, int completed, int failed) {}
