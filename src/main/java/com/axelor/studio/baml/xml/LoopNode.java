/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.baml.xml;

import jakarta.xml.bind.annotation.XmlAttribute;
import jakarta.xml.bind.annotation.XmlType;
import lombok.Getter;

@Getter
@XmlType
public class LoopNode extends ProcessActionNode {

  @XmlAttribute(name = "target")
  protected String target;

  @XmlAttribute(name = "expression")
  protected String expression;

  @Override
  public String toCode(boolean dynamic) {

    StringBuilder codeBuilder = new StringBuilder();

    if (target != null && expression != null) {
      codeBuilder.append("\nfor (").append(target).append(" in ").append(expression).append("){\n");
      codeBuilder.append(super.toCode(dynamic));
      codeBuilder.append("\n}");
    }

    return codeBuilder.toString();
  }
}
