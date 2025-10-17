/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.filter;

import com.axelor.meta.db.MetaField;
import com.axelor.meta.db.MetaJsonField;
import com.axelor.studio.db.Filter;
import com.google.inject.Inject;
import java.lang.invoke.MethodHandles;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This service class use to generate groovy expression from chart filters.
 *
 * @author axelor
 */
public class FilterJpqlServiceImpl implements FilterJpqlService {

  protected static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  protected FilterCommonService filterCommonService;

  @Inject
  public FilterJpqlServiceImpl(FilterCommonService filterCommonService) {
    this.filterCommonService = filterCommonService;
  }

  @Override
  public String getJpqlFilters(List<Filter> filterList) {

    StringBuilder filters = null;

    if (filterList == null) {
      return filters.toString();
    }

    for (Filter filter : filterList) {

      MetaField field = filter.getMetaField();

      if (filter.getValue() != null) {
        String value = filter.getValue();
        value = value.replaceAll("\"", "");
        value = value.replaceAll("'", "");

        if (filter.getOperator().contains("like") && !value.contains("%")) {
          value = "%" + value + "%";
        }
        filter.setValue("'" + value + "'");
      }
      String relationship = field.getRelationship();
      String fieldName =
          relationship != null ? filter.getTargetField() : filter.getMetaField().getName();
      fieldName = "self." + fieldName;
      String fieldValue;
      if (filter.getTargetType().equals("String")) {
        fieldName = "LOWER(" + fieldName + ")";
        fieldValue = "LOWER(" + filter.getValue() + ")";
      } else {
        fieldValue = filter.getValue();
      }
      String condition =
          filterCommonService.getCondition(fieldName, filter.getOperator(), fieldValue);

      if (filters == null) {
        filters = new StringBuilder(condition);
      } else {
        String opt = filter.getLogicOp() != null && filter.getLogicOp() == 0 ? " AND " : " OR ";
        filters.append(opt).append(condition);
      }
    }

    log.debug("JPQL filter: {}", filters.toString());
    return filters.toString();
  }

  @Override
  public String getJsonJpql(MetaJsonField jsonField) {

    return switch (jsonField.getType()) {
      case "integer" -> "json_extract_integer";
      case "decimal" -> "json_extract_decimal";
      case "boolean" -> "json_extract_boolean";
      default -> "json_extract";
    };
  }
}
