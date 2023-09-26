package com.axelor.studio.service.filter;

import com.axelor.meta.db.MetaField;
import com.axelor.meta.db.MetaJsonField;
import com.axelor.studio.db.Filter;
import java.util.List;

public interface FilterGroovyService {

  String getGroovyFilters(
      List<Filter> conditions, String parentField, boolean isButton, boolean isField);

  String createGroovyFilter(
      Filter filter, String parentField, boolean isButton, boolean isField);

  String getJsonFieldType(MetaJsonField jsonField, String targetField);

  String getMetaFieldType(MetaField field, String targetField, boolean isJson);

  String processValue(Filter filter);

  String getConditionExpr(
      String operator, String field, String fieldType, String value, boolean isButton);
}
