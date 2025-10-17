/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
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
