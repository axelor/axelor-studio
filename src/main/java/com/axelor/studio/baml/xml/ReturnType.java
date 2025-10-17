/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.baml.xml;

import jakarta.xml.bind.annotation.XmlEnum;

@XmlEnum()
public enum ReturnType {
  SINGLE,
  MULTIPLE,
  MAP
}
