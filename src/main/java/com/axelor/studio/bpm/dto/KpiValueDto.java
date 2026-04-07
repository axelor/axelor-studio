/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.dto;

/** Single KPI value with name, value, target, and status indicator. */
public record KpiValueDto(
    String name, String displayValue, double rawValue, Double target, String status) {}
