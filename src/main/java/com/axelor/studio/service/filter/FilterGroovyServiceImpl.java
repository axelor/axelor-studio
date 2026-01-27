/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.filter;

import com.axelor.common.ObjectUtils;
import com.axelor.meta.db.MetaField;
import com.axelor.meta.db.MetaJsonField;
import com.axelor.meta.db.MetaModel;
import com.axelor.meta.db.repo.MetaJsonFieldRepository;
import com.axelor.meta.db.repo.MetaModelRepository;
import com.axelor.studio.db.Filter;
import com.google.common.base.Strings;
import jakarta.inject.Inject;
import java.lang.invoke.MethodHandles;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class FilterGroovyServiceImpl implements FilterGroovyService {

  protected static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  protected FilterCommonService filterCommonService;

  protected MetaModelRepository metaModelRepo;

  protected MetaJsonFieldRepository metaJsonFieldRepo;

  protected FilterSqlService filterSqlService;

  @Inject
  public FilterGroovyServiceImpl(
      FilterCommonService filterCommonService,
      MetaModelRepository metaModelRepo,
      MetaJsonFieldRepository metaJsonFieldRepo,
      FilterSqlService filterSqlService) {
    this.filterCommonService = filterCommonService;
    this.metaModelRepo = metaModelRepo;
    this.metaJsonFieldRepo = metaJsonFieldRepo;
    this.filterSqlService = filterSqlService;
  }

  /**
   * Method to convert chart filter list to groovy expression string. Each filter of list will be
   * joined by logical operator(logicalOp) selected.
   *
   * @param conditions List for chart filters.
   * @param parentField Field that represent parent.
   * @return Groovy expression string.
   */
  @Override
  public String getGroovyFilters(
      List<Filter> conditions, String parentField, boolean isButton, boolean isField) {

    if (ObjectUtils.isEmpty(conditions)) {
      return null;
    }

    StringBuilder condition = new StringBuilder();

    for (Filter filter : conditions) {
      String activeFilter = createGroovyFilter(filter, parentField, isButton, isField);
      log.debug("Active filter: {}", filter);

      if (condition.isEmpty()) {
        condition.append("(").append(activeFilter);
      } else if (filter.getLogicOp() > 0) {
        condition.append(") || (").append(activeFilter);
      } else {
        condition.append(" && ").append(activeFilter);
      }
    }

    return condition + ")";
  }

  /**
   * Method to generate groovy expression for a single chart filter.
   *
   * @param filter Filter to use.
   * @param parentField Parent field.
   * @return Groovy expression string.
   */
  @Override
  public String createGroovyFilter(
      Filter filter, String parentField, boolean isButton, boolean isField) {

    boolean isJson =
        (filter.getIsJson() || filter.getMetaField() == null)
            && filter.getIsJson()
            && filter.getMetaJsonField() != null;

    String fieldType =
        !isJson
            ? this.getMetaFieldType(filter.getMetaField(), filter.getTargetField(), true)
            : this.getJsonFieldType(filter.getMetaJsonField(), filter.getTargetField());

    String targetField = filter.getTargetField();
    targetField = !isButton ? targetField.replace(".", "?.") : targetField;

    String value = processValue(filter);
    String operator = filter.getOperator();

    if (isButton || isField) {
      if (isJson && !Strings.isNullOrEmpty(parentField)) {
        boolean isModelFieldSame =
            ("$" + filter.getMetaJsonField().getModelField()).equals(parentField);
        if (!isModelFieldSame && isButton) {
          targetField =
              "$record." + "$" + filter.getMetaJsonField().getModelField() + "." + targetField;
        } else if (isField) {
          targetField = "$" + filter.getMetaJsonField().getModelField() + "." + targetField;
        }
      } else if (!isJson && isButton) {
        targetField = "$record." + targetField;
      }
    }

    return getConditionExpr(operator, targetField, fieldType, value, isButton);
  }

  @Override
  public String getJsonFieldType(MetaJsonField jsonField, String targetField) {

    if (targetField == null || !targetField.contains(".")) {
      return jsonField.getType();
    }

    targetField = targetField.substring(targetField.indexOf(".") + 1);
    String targetName =
        targetField.contains(".")
            ? targetField.substring(0, targetField.indexOf("."))
            : targetField;

    if (jsonField.getTargetJsonModel() != null) {
      MetaJsonField subJson =
          metaJsonFieldRepo
              .all()
              .filter(
                  "self.name = ?1 and self.jsonModel = ?2",
                  targetName,
                  jsonField.getTargetJsonModel())
              .fetchOne();
      if (subJson == null) {
        throw new IllegalStateException(
            "No sub field found model: %s field %s "
                .formatted(jsonField.getTargetJsonModel().getName(), targetName));
      }
      return getJsonFieldType(subJson, targetField);

    } else {
      MetaField subMeta = filterSqlService.findMetaField(targetName, jsonField.getTargetModel());
      if (subMeta == null) {
        throw new IllegalStateException(
            "No sub field found model: %s field %s "
                .formatted(jsonField.getTargetModel(), targetName));
      }
      return getMetaFieldType(subMeta, targetField, true);
    }
  }

  @Override
  public String getMetaFieldType(MetaField field, String targetField, boolean isJson) {

    if (targetField == null || !targetField.contains(".")) {
      return field.getTypeName();
    }

    targetField = targetField.substring(targetField.indexOf(".") + 1);
    String targetName =
        targetField.contains(".")
            ? targetField.substring(0, targetField.indexOf("."))
            : targetField;

    MetaModel model = metaModelRepo.findByName(field.getTypeName());
    if (model == null) {
      throw new IllegalStateException("No model found: %s ".formatted(field.getName()));
    }

    MetaField subMeta = filterSqlService.findMetaField(targetName, model.getFullName());
    if (subMeta != null) {
      return getMetaFieldType(subMeta, targetField, isJson);
    } else if (isJson) {
      MetaJsonField subJson = filterSqlService.findJsonField(targetName, model.getName());
      if (subJson != null) {
        return getJsonFieldType(subJson, targetField);
      }
    }
    throw new IllegalStateException(
        "No sub field found field: %s model: %s ".formatted(targetName, model.getFullName()));
  }

  @Override
  public String processValue(Filter filter) {

    String value = filter.getValue();
    if (value == null) {
      return value;
    }

    value = value.replace("$$", "__parent__.");

    return filterCommonService.getTagValue(value, false);
  }

  @Override
  public String getConditionExpr(
      String operator, String field, String fieldType, String value, boolean isButton) {

    if (operator.equals("isNull")) {
      return field + " == null";
    } else if (operator.equals("notNull")) {
      return field + " != null";
    }

    if (isButton) {
      switch (fieldType) {
        case "date", "datetime", "LocalDate", "LocalDateTime":
          value = "$moment(" + value + ")";
          field = "$moment(" + field + ")";

          if (operator.equals("=")) {
            return field + ".isSame(" + value + ", 'days')";
          } else if (operator.equals("!=")) {
            return "!" + field + ".isSame(" + value + ", 'days')";
          }
      }
    }

    return switch (operator) {
      case "=" -> field + " == " + value;
      case "empty" -> field + ".empty";
      case "notEmpty" -> "!" + field + ".empty";
      case "isTrue" -> field;
      case "isFalse" -> "!" + field;
      default -> field + " " + operator + " " + value;
    };
  }
}
