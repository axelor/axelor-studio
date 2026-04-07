/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.dto;

/** Aggregated instance counts by status for the process header. */
public record InstanceCountsDto(long running, long completed, long failed, long suspended) {}
