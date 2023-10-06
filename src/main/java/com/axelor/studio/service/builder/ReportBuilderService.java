package com.axelor.studio.service.builder;

import com.axelor.meta.db.MetaField;
import com.axelor.meta.db.MetaView;
import com.axelor.meta.schema.views.AbstractWidget;
import com.axelor.meta.schema.views.Panel;
import com.axelor.meta.schema.views.PanelField;
import com.axelor.meta.schema.views.PanelRelated;
import java.util.List;
import javax.xml.bind.JAXBException;

public interface ReportBuilderService {

  String generateTemplate(MetaView metaView);

  void processView(String xml) throws JAXBException;

  void processAbstractWidget(AbstractWidget widget, Boolean sidePanel);

  void processPanel(Panel panel, Boolean sidePanel);

  void processField(PanelField field, Boolean sidePanel);

  String processRelational(String name, MetaField metaField);

  String getNameColumn(String name, MetaField metaField);

  void generateHtml(boolean sidePanel);

  String getFieldTitle(String name, MetaField metaField);

  MetaField getMetaField(String name, String modelName);

  void processPanelRelated(PanelRelated panelRelated, Boolean sidePanel, String colSpan);

  String createTable(PanelRelated panelRelated, String refModel);

  String getHtmlTable(String fieldName, List<AbstractWidget> widgets, String refModel);

  MetaView findGridView(String gridName, String refModel);

  String getRefModel(String refModel);
}
