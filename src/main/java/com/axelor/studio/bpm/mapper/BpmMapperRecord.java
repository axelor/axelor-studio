/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.mapper;

import com.axelor.studio.service.mapper.MapperRecord;
import com.axelor.utils.helpers.StringHelper;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Setter
public class BpmMapperRecord extends MapperRecord {

  @Getter protected String processId = null;

  protected boolean createVariable = false;

  @Getter
  @JsonProperty("fields")
  protected List<BpmMapperField> bpmMapperFields = new ArrayList<>();

  public boolean getCreateVariable() {
    return createVariable;
  }

  @Override
  public void addReturn() {

    StringBuilder scriptBuilder = getScriptBuilder();

    String saveStr = "__ctx__.save(" + getTargetVariable() + ")";
    if (!isSave()) {
      saveStr = getTargetVariable();
    }

    if (createVariable) {
      scriptBuilder.append("__ctx__.createObject(").append(saveStr).append(")");

    } else if (isNewRecord() || isSavedRecord() || isSave()) {
      scriptBuilder.append("return ").append(saveStr);
    }
  }

  @Override
  public void addSource() {

    StringBuilder scriptBuilder = getScriptBuilder();

    String src = StringHelper.toFirstLower(getSourceModel());

    if (processId != null) {
      src = "__ctx__.getVariable(" + processId + ",'" + src + "')";
    }

    src = "def src = " + src + "\n";

    scriptBuilder.append(src);
  }

  @Override
  public void addFields() {

    if (bpmMapperFields != null) {
      bpmMapperFields.forEach(
          field ->
              getScriptBuilder()
                  .append(field.toScript(getTargetVariable(), getTargetModel()))
                  .append("\n"));
    }
  }
}
