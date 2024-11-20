/*
 * Axelor Business Solutions
 *
 * Copyright (C) 2022 Axelor (<http://axelor.com>).
 *
 * This program is free software: you can redistribute it and/or  modify
 * it under the terms of the GNU Affero General Public License, version 3,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package com.axelor.studio.service.mapper;

import com.axelor.common.Inflector;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.apache.commons.lang3.StringUtils;

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

  public String getDataPath() {
    return dataPath;
  }

  public void setDataPath(String dataPath) {
    this.dataPath = dataPath;
  }

  public String getType() {
    return type;
  }

  public void setType(String type) {
    this.type = type;
  }

  public String getTarget() {
    return target;
  }

  public void setTarget(String target) {
    this.target = target;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getParent() {
    return parent;
  }

  public void setParent(String parent) {
    this.parent = parent;
  }

  public MapperValue getValue() {
    return value;
  }

  public void setValue(MapperValue value) {
    this.value = value;
  }

  public String getJsonModel() {
    return jsonModel;
  }

  public void setJsonModel(String jsonModel) {
    this.jsonModel = jsonModel;
  }

  public String getCondition() {
    return condition;
  }

  public void setCondition(String condition) {
    this.condition = condition;
  }

  public String toScript(String parent, String targetModel) {

    this.parent = parent;
    StringBuilder stb = new StringBuilder();

    String field = parent + "." + name;
    stb.append(field + " = ");
    if ("self".equals(value.getFrom())) {
      stb.append(Inflector.getInstance().camelize(targetModel, true));
      stb.append(".");
    }
    stb.append(value.toScript(this));

    if (!StringUtils.isBlank(condition)) {
      return "if (" + condition + ") {\n\t" + stb.toString() + "\n}";
    }

    return stb.toString();
  }
}
