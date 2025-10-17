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
public class FunctionNode extends BaseTaskNode {

  @XmlAttribute(name = "returnType")
  protected ReturnType returnType;

  @Override
  public String toCode(boolean dynamic) {
    return "";
  }
}
