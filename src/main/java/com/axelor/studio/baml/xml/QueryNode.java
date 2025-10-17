/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.baml.xml;

import com.axelor.meta.db.MetaJsonRecord;
import com.google.common.base.Strings;
import jakarta.xml.bind.annotation.XmlAttribute;
import jakarta.xml.bind.annotation.XmlType;
import lombok.Getter;

@XmlType
public class QueryNode extends BaseTaskNode {

  @Getter
  @XmlAttribute(name = "returnType")
  protected ReturnType returnType;

  @Getter
  @XmlAttribute(name = "model")
  protected String model;

  @XmlAttribute(name = "isJson")
  protected boolean isJson;

  public boolean getIsJson() {
    return isJson;
  }

  @Override
  public String toCode(boolean dynamic) {

    StringBuilder codeBuilder = new StringBuilder();

    String model = getModel();

    if (dynamic) {
      addDynamicQuery(codeBuilder, model);
    } else {
      addQuery(codeBuilder, model);
    }

    String target = getTarget();

    if (!target.contains(".")) {
      target = "def " + target;
    }

    return "\n" + target + " = " + codeBuilder;
  }

  protected void addQuery(StringBuilder codeBuilder, String model) {

    String filter = getExpression();

    StringBuilder params = new StringBuilder();

    if (isJson) {
      if (!Strings.isNullOrEmpty(filter)) {
        filter = "(" + filter + ") AND ";
      }
      filter += "self.jsonModel = :jsonModel";
      params.append(".bind('jsonModel', '").append(model).append("')");
      model = MetaJsonRecord.class.getName();
    }

    codeBuilder.append("com.axelor.db.Query.of(").append(model).append(")");

    if (!Strings.isNullOrEmpty(filter)) {
      codeBuilder.append(".filter(").append(filter).append(")");
      codeBuilder.append(params);
    }

    if (returnType.equals(ReturnType.SINGLE)) {
      codeBuilder.append(".fetchOne()\n");
    } else {
      codeBuilder.append(".fetch()\n");
    }
  }

  protected void addDynamicQuery(StringBuilder codeBuilder, String model) {

    String filter = getExpression();

    if (returnType.equals(ReturnType.SINGLE)) {
      codeBuilder
          .append("WkfContextHelper.filterOne('")
          .append(model)
          .append("',")
          .append(filter)
          .append(")\n");
    } else {
      codeBuilder
          .append("WkfContextHelper.filter('")
          .append(model)
          .append("',")
          .append(filter)
          .append(")\n");
    }
  }
}
