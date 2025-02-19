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

@JsonIgnoreProperties(ignoreUnknown = true)
public class MapperRecord {

  protected String targetModel = null;

  protected String sourceModel = null;

  protected boolean newRecord = true;

  protected boolean savedRecord = false;

  protected boolean save = true;

  protected String targetVariable = "rec";

  protected StringBuilder scriptBuilder = new StringBuilder();

  protected List<MapperField> fields = new ArrayList<MapperField>();

  public String getTargetModel() {
    return targetModel;
  }

  public void setTargetModel(String targetModel) {
    this.targetModel = targetModel;
  }

  public boolean isNewRecord() {
    return newRecord;
  }

  public void setNewRecord(boolean newRecord) {
    this.newRecord = newRecord;
  }

  public boolean isSavedRecord() {
    return savedRecord;
  }

  public void setSavedRecord(boolean savedRecord) {
    this.savedRecord = savedRecord;
  }

  public boolean isSave() {
    return save;
  }

  public void setSave(boolean save) {
    this.save = save;
  }

  public List<MapperField> getFields() {
    return fields;
  }

  public void setFields(List<MapperField> fields) {
    this.fields = fields;
  }

  public String getSourceModel() {
    return sourceModel;
  }

  public void setSourceModel(String sourceModel) {
    this.sourceModel = sourceModel;
  }

  public StringBuilder getScriptBuilder() {
    return this.scriptBuilder;
  }

  public String getTargetVariable() {
    return targetVariable;
  }

  public void setTargetVariable(String targetVariable) {
    this.targetVariable = targetVariable;
  }

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
      scriptBuilder.append("def " + targetVariable + " = __ctx__.create('" + targetModel + "')\n");
    } else if (savedRecord) {
      scriptBuilder.append(
          "def "
              + targetVariable
              + " = __ctx__.find('"
              + targetModel
              + "',"
              + StringHelper.toFirstLower(targetModel)
              + "Id)\n");
    } else {
      targetVariable = StringHelper.toFirstLower(targetModel);
    }

    return scriptBuilder;
  }

  public void addFields() {

    if (fields != null) {
      fields.forEach(
          field -> scriptBuilder.append(field.toScript(targetVariable, targetModel) + "\n"));
    }
  }

  public void addReturn() {

    String saveStr = "__ctx__.save(" + targetVariable + ")";
    if (!save) {
      saveStr = targetVariable;
    }

    if (newRecord || savedRecord || save) {
      scriptBuilder.append("return " + saveStr);
    }
  }
}
