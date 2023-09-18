/*
 * Axelor Business Solutions
 *
 * Copyright (C) 2022 Axelor (<http://axelor.com>).
 *
 * This program is free software: you can redistribute it and/or  modify
 * it under the terms of the GNU Affero General Public License, version 3,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

package com.axelor.studio.bpm.service.execution;

import com.axelor.db.Model;
import com.axelor.inject.Beans;
import com.axelor.meta.MetaStore;
import com.axelor.meta.db.MetaJsonModel;
import com.axelor.meta.db.MetaModel;
import com.axelor.meta.schema.actions.Action;
import com.axelor.studio.bpm.service.action.WkfActionGroup;
import com.axelor.studio.db.WkfProcess;
import com.axelor.studio.db.WkfProcessConfig;
import com.axelor.studio.db.repo.WkfProcessRepository;
import com.axelor.utils.context.FullContext;
import com.axelor.utils.service.ActionService;
import com.google.inject.Inject;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.camunda.bpm.engine.impl.bpmn.parser.BpmnParse;
import org.camunda.bpm.model.bpmn.instance.BpmnModelElementInstance;

public class WkfActionService implements JavaDelegate {

  @Inject protected WkfActionGroup wkfActionGroup;

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

    WkfProcessConfig processConfig =
        process.getWkfProcessConfigList().stream()
            .filter(config -> config.getIsStartModel())
            .findAny()
            .get();

    MetaModel metaModel = processConfig.getMetaModel();
    MetaJsonModel jsonModel = processConfig.getMetaJsonModel();

    FullContext fullContext = null;
    if (jsonModel != null) {
      fullContext = (FullContext) execution.getVariable(jsonModel.getName().toLowerCase());
    } else {
      fullContext = (FullContext) execution.getVariable(metaModel.getName().toLowerCase());
    }

    String value =
        bpmnModelElementInstance.getAttributeValueNs(
            BpmnParse.CAMUNDA_BPMN_EXTENSIONS_NS.getNamespaceUri(), "actions");

    String[] actions = value.split(",");

    executeActions(fullContext, actions);
  }

  protected FullContext executeActions(FullContext fullContext, String[] actions) {

    if (fullContext == null || actions == null) {
      return fullContext;
    }

    for (String actionName : actions) {
      Action action = MetaStore.getAction(actionName);
      if (action != null) {
        Model model = (Model) fullContext.getTarget();

        Beans.get(ActionService.class).applyActions(actionName, model);
      }
    }

    return fullContext;
  }
}
