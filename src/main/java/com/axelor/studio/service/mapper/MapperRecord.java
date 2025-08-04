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

import com.axelor.utils.helpers.StringHelper;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.google.common.base.Strings;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@JsonIgnoreProperties(ignoreUnknown = true)
public class MapperRecord {

  @Setter protected String targetModel = null;

  @Setter protected String sourceModel = null;

  @Setter protected boolean newRecord = true;

  @Setter protected boolean savedRecord = false;

  @Setter protected boolean save = true;

  @Setter protected String targetVariable = "rec";

  protected StringBuilder scriptBuilder = new StringBuilder();

  @Setter protected List<MapperField> fields = new ArrayList<>();

  public String toScript() {

    scriptBuilder = new StringBuilder();

    addTarget();

    if (!Strings.isNullOrEmpty(sourceModel)) {

      addSource();
    }

    addFields();

    addReturn();

    return scriptBuilder.toString();
  }

  public void addSource() {

    String src = StringHelper.toFirstLower(sourceModel);

    src = "def src = " + src + "\n";

    scriptBuilder.append(src);
  }

  public StringBuilder addTarget() {

    if (newRecord) {
      scriptBuilder
          .append("def ")
          .append(targetVariable)
          .append(" = __ctx__.create('")
          .append(targetModel)
          .append("')\n");
    } else if (savedRecord) {
      scriptBuilder
          .append("def ")
          .append(targetVariable)
          .append(" = __ctx__.find('")
          .append(targetModel)
          .append("',")
          .append(StringHelper.toFirstLower(targetModel))
          .append("Id)\n");
    } else {
      targetVariable = StringHelper.toFirstLower(targetModel);
    }

    return scriptBuilder;
  }

  public void addFields() {

    if (fields != null) {
      fields.forEach(
          field -> scriptBuilder.append(field.toScript(targetVariable, targetModel)).append("\n"));
    }
  }

  public void addReturn() {

    String saveStr = "__ctx__.save(" + targetVariable + ")";
    if (!save) {
      saveStr = targetVariable;
    }

    if (newRecord || savedRecord || save) {
      scriptBuilder.append("return ").append(saveStr);
    }
  }
}
