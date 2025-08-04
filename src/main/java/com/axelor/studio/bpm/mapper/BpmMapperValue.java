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
package com.axelor.studio.bpm.mapper;

import com.axelor.studio.service.mapper.MapperField;
import com.axelor.studio.service.mapper.MapperValue;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.google.common.base.Joiner;
import java.util.Arrays;
import java.util.Iterator;

@JsonIgnoreProperties(ignoreUnknown = true)
public class BpmMapperValue extends MapperValue {

  @Override
  public String toScript(MapperField parentField) {

    setParentField(parentField);

    StringBuilder stb = new StringBuilder();

    switch (getFrom()) {
      case "process":
        mapProcess(stb);
        break;
      case "dmn":
        mapDmn(stb);
        break;
      default:
        break;
    }

    if (stb.isEmpty()) {
      return super.toScript(parentField);
    }

    return stb.toString();
  }

  protected void mapProcess(StringBuilder stb) {

    String valueStr = super.getSelectedScript();

    BpmMapperField parentField = (BpmMapperField) getParentField();
    String processId = parentField.getProcessId();

    if (processId != null && valueStr != null) {
      Iterator<String> values = Arrays.asList(valueStr.split("\\?")).iterator();

      valueStr = "__ctx__.getVariable(" + processId + ",'" + values.next() + "')";

      if (values.hasNext()) {
        valueStr += "?" + Joiner.on('?').join(values);
      }
    }

    if (MANY_TO_ONE_TYPE.contains(parentField.getType()) && valueStr != null) {
      stb.append("__ctx__.find('")
          .append(parentField.getTarget())
          .append("',")
          .append(valueStr)
          .append("?.id)?.getTarget()");
    } else {
      stb.append(valueStr);
    }
  }

  protected void mapDmn(StringBuilder stb) {

    String value = getSelectedScript();

    BpmMapperField parentField = (BpmMapperField) getParentField();
    if (MANY_TO_ONE_TYPE.contains(parentField.getType())) {
      BpmMapperSearchField searchField = parentField.getSearchField();
      if (searchField != null) {
        String query = "'self." + searchField.getName() + " = ?1'";
        stb.append("__ctx__.filterOne('")
            .append(parentField.getTarget())
            .append("',")
            .append(query)
            .append(",")
            .append(value)
            .append(")?.getTarget()");
      } else {
        if (value != null && !value.endsWith(".id")) {
          value += "?.id";
        }
        stb.append("__ctx__.find('")
            .append(parentField.getTarget())
            .append("',")
            .append(value)
            .append(")?.getTarget()");
      }
    } else {
      stb.append(value);
    }
  }
}
