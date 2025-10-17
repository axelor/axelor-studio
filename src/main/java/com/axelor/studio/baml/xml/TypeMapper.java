/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.baml.xml;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;

public class TypeMapper {

  public static Class<?> getType(String simpleType) {

    return switch (simpleType) {
      case "integer" -> Integer.class;
      case "boolean" -> Boolean.class;
      case "string" -> String.class;
      case "long" -> Long.class;
      case "decimal" -> BigDecimal.class;
      case "date" -> LocalDate.class;
      case "datetime" -> LocalDateTime.class;
      case "zdatetime" -> ZonedDateTime.class;
      default -> null;
    };
  }
}
