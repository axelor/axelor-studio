package com.axelor.studio.bpm.service.deployment;

import com.axelor.meta.db.MetaAttrs;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.WkfTaskConfig;
import com.axelor.studio.db.WkfTaskMenu;
import com.axelor.studio.db.WkfTaskMenuContext;
import com.google.inject.persist.Transactional;
import java.util.List;
import java.util.Map;
import org.camunda.bpm.model.bpmn.BpmnModelInstance;
import org.camunda.bpm.model.bpmn.instance.ExtensionElements;
import org.camunda.bpm.model.bpmn.instance.FlowNode;
import org.camunda.bpm.model.bpmn.instance.Process;
import org.camunda.bpm.model.xml.impl.ModelBuilderImpl;
import org.camunda.bpm.model.xml.instance.ModelElementInstance;

public interface WkfNodeService {

  List<MetaAttrs> extractNodes(
      WkfModel wkfModel, BpmnModelInstance bpmInstance, Map<String, String> processMap);

  Process findProcess(FlowNode activity);

  @Transactional
  WkfTaskConfig updateTaskConfig(
      WkfModel wkfModel,
      Map<String, WkfTaskConfig> configMap,
      List<MetaAttrs> metaAttrsList,
      FlowNode activity);

  void computeTaskMenu(ExtensionElements extensionElements, WkfTaskConfig config);

  WkfTaskMenu updateTaskMenu(
      ModelElementInstance menu, Map<String, WkfTaskMenu> menuMap, ModelBuilderImpl builderImpl);

  void computeMenuContext(
      ModelElementInstance menu, WkfTaskMenu taskMenu, ModelBuilderImpl builderImpl);

  WkfTaskMenuContext updateMenuContext(
      ModelElementInstance context, Map<String, WkfTaskMenuContext> contextMap);

  void updateMenus(WkfTaskConfig taskConfig, boolean remove);
}
