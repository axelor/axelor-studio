package com.axelor.studio.service.filter;

import com.axelor.meta.db.MetaField;
import com.axelor.meta.db.MetaJsonField;
import com.axelor.meta.db.MetaJsonModel;
import com.axelor.studio.db.Filter;
import java.util.List;

public interface FilterSqlService {

  String getColumn(String model, String field);

  String getColumn(MetaField metaField);

  String getSqlType(String type);

  String getSqlFilters(List<Filter> filterList, List<String> joins, boolean checkJson);

  String checkDateTime(String[] fields);

  String[] getSqlField(Object target, String source, List<String> joins);

  String getParam(boolean isParam, String value, Long filterId, String type);

  String[] getDefaultTarget(String fieldName, String modelName);

  String[] getDefaultTargetJson(String fieldName, MetaJsonModel targetModel);

  Object getTargetField(
      StringBuilder parent, Filter filter, List<String> joins, boolean checkJson);

  String getTargetType(Object target);

  Object parseMetaField(
      MetaField field, String target, List<String> joins, StringBuilder parent, boolean checkJson);

  Object parseJsonField(
      MetaJsonField field, String target, List<String> joins, StringBuilder parent);

  MetaField findMetaField(String name, String model);

  MetaJsonField findJsonField(String name, String model);

  void addJoin(MetaField field, List<String> joins, StringBuilder parent);

  void addJoin(MetaJsonField field, List<String> joins, StringBuilder parent);
}
