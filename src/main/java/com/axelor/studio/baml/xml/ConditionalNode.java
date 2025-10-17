/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.baml.xml;

import jakarta.xml.bind.annotation.XmlAttribute;
import jakarta.xml.bind.annotation.XmlType;
import lombok.Getter;

@XmlType
public class ConditionalNode extends ProcessActionNode {

  @Getter
  @XmlAttribute(name = "expression")
  protected String expression;

  @XmlAttribute(name = "expressionValue")
  protected String expressionValue;

  public String expressionValue() {
    return expressionValue;
  }

  @Override
  public String toCode(boolean dynamic) {
    return expression == null ? "" : "\nif(" + expression + ") {" + super.toCode(dynamic) + "\n}";
  }
}
