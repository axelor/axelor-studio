/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.baml.xml;

import com.axelor.utils.helpers.StringHelper;
import jakarta.xml.bind.annotation.XmlAttribute;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlType;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@XmlType
public class MapperNode extends BaseNode {

  @XmlElement(name = "script", type = String.class)
  protected String script;

  @XmlElement(name = "scriptMeta", type = String.class)
  protected String scriptMeta;

  @XmlAttribute(name = "targetField")
  protected String targetField;

  @XmlAttribute(name = "sourceField")
  protected String sourceField;

  @Override
  public String toCode(boolean dynamic) {

    StringBuilder codeBuilder = new StringBuilder();
    if (script == null) {
      return codeBuilder.toString();
    }

    if (script.substring(script.lastIndexOf("\n") + 1).startsWith("return")) {
      String target = StringHelper.toFirstLower(targetField);
      codeBuilder.append("def ").append(target).append(" = {\n").append(script).append("\n}()\n");
    } else {
      codeBuilder.append("\n").append(script).append("\n");
    }

    return codeBuilder.toString();
  }
}
