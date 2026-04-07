/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.dto;

import java.util.List;

/** Aggregated Sankey diagram data: nodes and links. */
public record SankeyDataDto(List<SankeyNodeDto> nodes, List<SankeyLinkDto> links) {

  /** A node in the Sankey diagram with internal ID and display name. */
  public record SankeyNodeDto(String name, String displayName) {}
}
