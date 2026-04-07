/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.dto;

/** A single execution passage through a BPMN node. */
public record PassageDto(String startTime, String endTime, long durationMs, String assignee) {}
