/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.mapper;

import com.axelor.common.Inflector;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;
import org.apache.commons.lang3.StringUtils;

@Setter
@Getter
@JsonIgnoreProperties(ignoreUnknown = true)
public class MapperField {

  protected String dataPath = null;

  protected String type = null;

  protected String target = null;

  protected String jsonModel = null;

  protected String name = null;

  protected String parent = null;

  protected MapperValue value = null;

  protected String condition = null;

  public String toScript(String parent, String targetModel) {

    this.parent = parent;
    StringBuilder stb = new StringBuilder();

    String field = parent + "." + name;
    stb.append(field).append(" = ");
    if ("self".equals(value.getFrom())) {
      stb.append(Inflector.getInstance().camelize(targetModel, true));
      stb.append(".");
    }
    stb.append(value.toScript(this));

    if (!StringUtils.isBlank(condition)) {
      return "if (" + condition + ") {\n\t" + stb + "\n}";
    }

    return stb.toString();
  }
}
