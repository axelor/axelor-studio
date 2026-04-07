/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.dto;

/** A single day entry for calendar heatmap charts. */
public record CalendarHeatmapDto(String date, int count) {}
