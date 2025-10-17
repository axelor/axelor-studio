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
public abstract class BaseNode {

  @XmlAttribute(name = "id")
  protected String id;

  @XmlAttribute(name = "name")
  protected String name;

  public abstract String toCode(boolean dynamic);
}
