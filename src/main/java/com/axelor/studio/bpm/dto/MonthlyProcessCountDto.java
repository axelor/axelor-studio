/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.dto;

/** Monthly instance count for a specific process, used for trend charts. */
public record MonthlyProcessCountDto(String month, String processName, long count) {}
