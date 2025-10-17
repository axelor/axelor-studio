/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.execution;

import com.axelor.common.Inflector;
import com.axelor.db.Model;
import com.axelor.inject.Beans;
import com.axelor.meta.MetaStore;
import com.axelor.meta.db.MetaJsonModel;
import com.axelor.meta.db.MetaModel;
import com.axelor.meta.schema.actions.Action;
import com.axelor.meta.schema.actions.Action.Element;
import com.axelor.meta.schema.actions.ActionGroup;
import com.axelor.studio.db.WkfProcess;
import com.axelor.studio.db.WkfProcessConfig;
import com.axelor.studio.db.repo.WkfProcessRepository;
import com.axelor.utils.helpers.context.FullContext;
import com.axelor.utils.service.ActionService;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.camunda.bpm.engine.impl.bpmn.parser.BpmnParse;
import org.camunda.bpm.model.bpmn.instance.BpmnModelElementInstance;

public class WkfActionService implements JavaDelegate {

  @Override
  public void execute(DelegateExecution execution) {
    BpmnModelElementInstance bpmnModelElementInstance = execution.getBpmnModelElementInstance();
    WkfProcess process =
        Beans.get(WkfProcessRepository.class)
            .all()
            .filter("self.processId = ?", execution.getProcessDefinitionId())
            .fetchOne();

    if (process == null) {
      return;
    }

    var processConfigOpt =
        process.getWkfProcessConfigList().stream()
            .filter(WkfProcessConfig::getIsStartModel)
            .findAny();

    if (processConfigOpt.isEmpty()) {
      return;
    }

    var processConfig = processConfigOpt.get();

    MetaModel metaModel = processConfig.getMetaModel();
    MetaJsonModel jsonModel = processConfig.getMetaJsonModel();

    FullContext fullContext;
    if (jsonModel != null) {
      fullContext =
          (FullContext)
              execution.getVariable(Inflector.getInstance().camelize(jsonModel.getName(), true));
    } else {
      fullContext =
          (FullContext)
              execution.getVariable(Inflector.getInstance().camelize(metaModel.getName(), true));
    }

    String value =
        bpmnModelElementInstance.getAttributeValueNs(
            BpmnParse.CAMUNDA_BPMN_EXTENSIONS_NS.getNamespaceUri(), "actions");

    String[] actions = value.split(",");

    executeActions(fullContext, actions);
  }

  protected void executeActions(FullContext fullContext, String[] actions) {

    if (fullContext == null
        || actions == null
        || fullContext.getTarget() == null
        || !(fullContext.getTarget() instanceof Model)) {
      return;
    }

    var actionService = Beans.get(ActionService.class);

    var actionList = List.of(actions);

    actionList = actionList.stream().map(this::extractActions).flatMap(List::stream).toList();

    for (String actionName : actionList) {
      Action action = MetaStore.getAction(actionName);
      if (action != null) {
        actionService.applyActions(actionName, fullContext);
      }
    }
  }

  protected List<String> extractActions(String actionName) {
    var action = MetaStore.getAction(actionName);
    if (action instanceof ActionGroup actionGroup) {
      return actionGroup.getActions().stream().map(Element::getName).collect(Collectors.toList());
    } else {
      return Collections.singletonList(actionName);
    }
  }
}
