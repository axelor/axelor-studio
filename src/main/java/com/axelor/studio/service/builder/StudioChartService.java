package com.axelor.studio.service.builder;

import com.axelor.meta.CallMethod;
import com.axelor.meta.db.MetaField;
import com.axelor.meta.db.MetaJsonField;
import com.axelor.studio.db.Filter;
import com.axelor.studio.db.StudioChart;
import java.util.List;
import javax.xml.bind.JAXBException;

public interface StudioChartService {

  void build(StudioChart studioChart) throws JAXBException;

  String createXml(StudioChart studioChart, String[] queryString);

  String[] prepareQuery(StudioChart studioChart);

  String createSumQuery(boolean isJson, MetaField metaField, MetaJsonField jsonField);

  String getGroup(
      boolean isJson, MetaField metaField, MetaJsonField jsonField, String dateType, String target);

  String getDateTypeGroup(String dateType, String typeName, String group);

  String getSearchFields();
  //	private void setOnNewAction(StudioChart studioChart) {
  //
  //		if (!onNewFields.isEmpty()) {
  //			onNewAction = new ActionRecord();
  //			onNewAction.setName("action-" + studioChart.getName() + "-default");
  //			onNewAction.setModel(studioChart.getModel());
  //			onNewAction.setFields(onNewFields);
  //		}
  //
  //	}

  void addSearchField(List<Filter> filters);

  String getMetaSearchField(String fieldStr, MetaField field);

  String getJsonSearchField(String fieldStr, MetaJsonField field);

  String getTable(String model);

  @CallMethod
  String getDefaultTarget(MetaField metaField);

  @CallMethod
  String getDefaultTarget(MetaJsonField metaJsonField);

  @CallMethod
  String getTargetType(Object object, String target);
}
