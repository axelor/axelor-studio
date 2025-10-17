/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.constructor.components.expressions.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ValueDto {
  private String from;
  private List<ElementDto> subFields;
  private String value;
  private String query;

  @JsonProperty("selected")
  private void unpackSelectedValue(Map<String, Object> selected) {
    if (selected != null && selected.containsKey("value")) {
      this.value = (String) selected.get("value");
    }
  }
}
