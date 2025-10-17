/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.baml.xml;

import jakarta.xml.bind.annotation.XmlAttribute;
import jakarta.xml.bind.annotation.XmlType;
import lombok.Getter;
import lombok.Setter;

@XmlType
@Getter
@Setter
public class ParameterLineType {

  @XmlAttribute(name = "id")
  protected String id;

  @XmlAttribute(name = "expression")
  protected String expression;

  @XmlAttribute(name = "target")
  protected String target;
}
