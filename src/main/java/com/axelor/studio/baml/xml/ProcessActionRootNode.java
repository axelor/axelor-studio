/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.baml.xml;

import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlElements;
import jakarta.xml.bind.annotation.XmlRootElement;
import jakarta.xml.bind.annotation.XmlType;
import java.util.List;
import lombok.Getter;

@Getter
@XmlType
@XmlRootElement(name = "process-actions")
public class ProcessActionRootNode {

  @XmlElements({@XmlElement(name = "process-action", type = ProcessActionNode.class)})
  protected List<ProcessActionNode> processActions;
}
