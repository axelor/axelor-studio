/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.baml.xml;

import jakarta.xml.bind.annotation.XmlType;

@XmlType
public class NewRecordNode extends BaseTaskNode {

  @Override
  public String toCode(boolean dynamic) {
    if (getTarget() == null || getExpression() == null) {
      return "";
    }

    String target = getTarget();

    if (!target.contains(".")) {
      target = "def " + target;
    }

    String expression = "new " + getExpression() + "()";

    if (dynamic) {
      expression = "WkfContextHelper.create('" + getExpression() + "')";
    }

    return "\n" + target + " = " + expression;
  }
}
