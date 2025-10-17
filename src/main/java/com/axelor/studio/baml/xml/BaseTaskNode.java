/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.baml.xml;

import jakarta.xml.bind.annotation.XmlAttribute;
import jakarta.xml.bind.annotation.XmlType;
import lombok.Getter;
import org.apache.commons.text.StringEscapeUtils;

@XmlType
public abstract class BaseTaskNode extends BaseNode {

  @Getter
  @XmlAttribute(name = "target")
  protected String target;

  @XmlAttribute(name = "expression")
  protected String expression;

  public String getExpression() {
    if (expression == null) {
      return null;
    }
    return StringEscapeUtils.unescapeXml(expression);
  }
}
