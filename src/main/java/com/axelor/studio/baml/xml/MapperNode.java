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
