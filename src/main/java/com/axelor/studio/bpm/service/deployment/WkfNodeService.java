package com.axelor.studio.bpm.service.deployment;

import com.axelor.meta.db.MetaAttrs;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.WkfTaskConfig;
import java.util.List;
import java.util.Map;
import org.camunda.bpm.model.bpmn.BpmnModelInstance;
import org.camunda.bpm.model.bpmn.instance.FlowNode;

public interface WkfNodeService {

  public List<MetaAttrs> extractNodes(
      WkfModel wkfModel, BpmnModelInstance bpmInstance, Map<String, String> processMap);

  public WkfTaskConfig updateTaskConfig(
      WkfModel wkfModel,
      Map<String, WkfTaskConfig> configMap,
      List<MetaAttrs> metaAttrsList,
      FlowNode activity);
}
