package com.axelor.studio.service.filter;

import com.axelor.meta.db.MetaField;

public interface FilterCommonService {

  String getTagValue(String value, boolean addColon);

  String getLikeCondition(String conditionField, String value, boolean isLike);

  String getFieldType(MetaField metaField);

  String getFieldType(String type);

  String getCondition(String conditionField, String operator, String value);
}
