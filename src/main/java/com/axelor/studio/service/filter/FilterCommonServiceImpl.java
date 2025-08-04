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
package com.axelor.studio.service.filter;

import com.axelor.meta.db.MetaField;
import java.util.Arrays;

public class FilterCommonServiceImpl implements FilterCommonService {

  /**
   * It will return value of tag used by filter 'value'.
   *
   * @param value Value of chart filter.
   * @return Context variable to use instead of tag.
   */
  @Override
  public String getTagValue(String value, boolean addColon) {

    if (value != null) {
      if (addColon) {
        value = value.replace("$user", ":__user__");
        value = value.replace("$date", ":__date__");
        value = value.replace("$time", ":__datetime__");
      } else {
        value = value.replace("$user", "__user__");
        value = value.replace("$date", "__date__");
        value = value.replace("$time", "__datetime__");
      }
    }

    return value;
  }

  /**
   * Method create like condition for filter with string field.
   *
   * @param conditionField Chart filter field name
   * @param value Value of input in chart filter.
   * @param isLike boolean to check if condition is like or notLike
   * @return String condition.
   */
  @Override
  public String getLikeCondition(String conditionField, String value, boolean isLike) {

    String likeCondition = null;

    String likeOpr = "LIKE";
    if (!isLike) {
      likeOpr = "NOT LIKE";
    }

    if (value.contains(",")) {
      for (String val : Arrays.asList(value.split(","))) {
        if (likeCondition == null) {
          likeCondition = conditionField + " " + likeOpr + " " + val;
        } else {
          likeCondition += " OR " + conditionField + " " + likeOpr + " " + val;
        }
      }
    } else {
      likeCondition = conditionField + " " + likeOpr + " " + value;
    }

    return likeCondition;
  }

  /**
   * Get simple field type from typeName of MetaField
   *
   * @param metaField MetaField to check for typeName.
   * @return Simple field type.
   */
  @Override
  public String getFieldType(MetaField metaField) {

    String relationship = metaField.getRelationship();

    if (relationship != null) {
      switch (relationship) {
        case "OneToMany":
          return "one-to-many";
        case "ManyToMany":
          return "many-to-many";
        case "ManyToOne":
          return "many-to-one";
      }
    }

    return getFieldType(metaField.getTypeName());
  }

  @Override
  public String getFieldType(String type) {

    return switch (type) {
      case "String" -> "string";
      case "Integer" -> "integer";
      case "Boolean" -> "boolean";
      case "BigDecimal" -> "decimal";
      case "Long" -> "long";
      case "byte[]" -> "binary";
      case "LocalDate" -> "date";
      case "ZonedDateTime" -> "datetime";
      case "LocalDateTime" -> "datetime";
      default -> "string";
    };
  }

  @Override
  public String getCondition(String conditionField, String operator, String value) {

    value = getTagValue(value, true);

    String[] values = new String[] {""};
    if (value != null) {
      values = value.split(",");
    }

    return switch (operator) {
      case "like" -> getLikeCondition(conditionField, value, true);
      case "notLike" -> getLikeCondition(conditionField, value, false);
      case "in" -> conditionField + " IN" + " (" + value + ") ";
      case "notIn" -> conditionField + " NOT IN" + " (" + value + ") ";
      case "isNull" -> conditionField + " IS NULL ";
      case "notNull" -> conditionField + " IS NOT NULL ";
      case "between" -> {
        if (values.length > 1) {
          yield conditionField + " BETWEEN  " + values[0] + " AND " + values[1];
        }
        yield conditionField + " BETWEEN  " + values[0] + " AND " + values[0];
      }
      case "notBetween" -> {
        if (values.length > 1) {
          yield conditionField + " NOT BETWEEN  " + values[0] + " AND " + values[1];
        }
        yield conditionField + " NOT BETWEEN  " + values[0] + " AND " + values[0];
      }
      case "isTrue" -> conditionField + " IS TRUE ";
      case "isFalse" -> conditionField + " IS FALSE ";
      default -> conditionField + " " + operator + " " + value;
    };
  }
}
