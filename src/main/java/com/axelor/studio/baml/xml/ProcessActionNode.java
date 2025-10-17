/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.baml.xml;

import jakarta.xml.bind.annotation.XmlAttribute;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlElements;
import jakarta.xml.bind.annotation.XmlType;
import java.util.List;
import lombok.Getter;

@XmlType
public class ProcessActionNode extends BaseNode {

  @Getter
  @XmlElements(
      value = {
        @XmlElement(name = "new-record", type = NewRecordNode.class),
        @XmlElement(name = "mapper", type = MapperNode.class),
        @XmlElement(name = "loop", type = LoopNode.class),
        @XmlElement(name = "conditional", type = ConditionalNode.class),
        @XmlElement(name = "query", type = QueryNode.class),
        @XmlElement(name = "function", type = FunctionNode.class)
      })
  protected List<BaseNode> nodes;

  @Getter
  @XmlAttribute(name = "sourceModel")
  protected String sourceModel;

  @Getter
  @XmlAttribute(name = "targetModel")
  protected String targetModel;

  @XmlAttribute(name = "staticCompile")
  protected boolean staticCompile;

  public boolean getStaticCompile() {
    return staticCompile;
  }

  @Override
  public String toCode(boolean dynamic) {

    if (nodes == null) {
      return "";
    }

    StringBuilder codeBuilder = new StringBuilder();
    nodes.forEach(baseNode -> codeBuilder.append(baseNode.toCode(dynamic)));

    return codeBuilder.toString();
  }
}
