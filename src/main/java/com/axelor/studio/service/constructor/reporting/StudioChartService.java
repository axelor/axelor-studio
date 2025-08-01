package com.axelor.studio.service.constructor.reporting;

import com.axelor.meta.CallMethod;
import com.axelor.meta.db.MetaField;
import com.axelor.meta.db.MetaJsonField;
import com.axelor.studio.db.Filter;
import com.axelor.studio.db.StudioChart;
import jakarta.xml.bind.JAXBException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public interface StudioChartService {

  void build(StudioChart studioChart) throws JAXBException;

  String createXml(StudioChart studioChart, Map<String, Object> queryString);

  Map<String, Object> prepareQuery(StudioChart studioChart);

  String getSumField(boolean isJson, MetaField metaField, MetaJsonField jsonField);

  String getGroup(
      boolean isJson, MetaField metaField, MetaJsonField jsonField, String dateType, String target);

  String getDateTypeGroup(String dateType, String typeName, String group);

  void addSearchField(List<Filter> filters);

  HashMap<String, Object> getMetaSearchField(
      String fieldStr, MetaField field, HashMap<String, Object> searchFieldMap);

  HashMap<String, Object> getJsonSearchField(
      String fieldStr, MetaJsonField field, HashMap<String, Object> searchFieldMap);

  String getTable(String model);

  @CallMethod
  String getDefaultTarget(MetaField metaField);

  @CallMethod
  String getDefaultTarget(MetaJsonField metaJsonField);

  @CallMethod
  String getTargetType(Object object, String target);
}
