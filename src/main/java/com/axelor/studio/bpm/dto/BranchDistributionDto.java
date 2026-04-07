/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.dto;

/** Distribution of executions through a gateway branch (target activity + count + percentage). */
public record BranchDistributionDto(
    String targetActivityId, String targetActivityName, int count, double percentage) {}
