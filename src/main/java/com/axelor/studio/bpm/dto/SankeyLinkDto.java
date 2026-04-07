/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.dto;

/** A directed link between two BPMN activities with a transition count for Sankey diagrams. */
public record SankeyLinkDto(String source, String target, int value) {}
