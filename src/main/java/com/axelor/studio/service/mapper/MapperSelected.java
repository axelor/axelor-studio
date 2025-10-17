/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.mapper;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@JsonIgnoreProperties(ignoreUnknown = true)
public class MapperSelected {

  protected String value = null;

  protected String targetName = null;

  public String toScript() {
    String script = value;
    if (targetName != null && !targetName.equals("_selectId")) {
      script = targetName + "," + script;
    }

    return script;
  }
}
