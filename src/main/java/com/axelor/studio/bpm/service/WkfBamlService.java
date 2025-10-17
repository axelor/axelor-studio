/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service;

import com.axelor.db.Model;
import com.axelor.inject.Beans;
import com.axelor.studio.baml.service.BamlService;
import com.axelor.studio.bpm.context.WkfContextHelper;
import com.axelor.studio.db.BamlModel;
import com.axelor.studio.db.repo.BamlModelRepository;
import com.axelor.utils.helpers.context.FullContext;
import java.lang.invoke.MethodHandles;
import java.util.HashMap;
import java.util.Map;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.camunda.bpm.engine.impl.bpmn.parser.BpmnParse;
import org.camunda.bpm.model.bpmn.instance.BpmnModelElementInstance;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class WkfBamlService implements JavaDelegate {

  protected static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  @Override
  public void execute(DelegateExecution execution) throws Exception {

    BpmnModelElementInstance bpmnModelElementInstance = execution.getBpmnModelElementInstance();

    String baml =
        bpmnModelElementInstance.getAttributeValueNs(
            BpmnParse.CAMUNDA_BPMN_EXTENSIONS_NS.getNamespaceUri(), "baml");

    if (Boolean.parseBoolean(baml)) {
      String model =
          bpmnModelElementInstance.getAttributeValueNs(
              BpmnParse.CAMUNDA_BPMN_EXTENSIONS_NS.getNamespaceUri(), "bamlModel");
      BamlModel bamlModel = Beans.get(BamlModelRepository.class).findByName(model);
      if (bamlModel != null) {
        executeBaml(execution, bamlModel);
      }
    }
  }

  protected void executeBaml(DelegateExecution execution, BamlModel bamlModel) {

    Map<String, Object> context = createContext(execution);

    Model record = Beans.get(BamlService.class).execute(bamlModel, context);
    log.debug("Record created from BAML: {}", record);

    if (record != null) {
      String varName = Beans.get(WkfCommonService.class).getVarName(record);
      Map<String, Object> modelMap = new HashMap<>();
      modelMap.put(varName, record);
      execution
          .getProcessInstance()
          .setVariables(Beans.get(WkfCommonService.class).createVariables(modelMap));
    }
  }

  protected Map<String, Object> createContext(DelegateExecution execution) {

    Map<String, Object> variables = execution.getVariables();

    Map<String, Object> context = new HashMap<>();

    variables.forEach(
        (key, value) -> {
          Object variable = value;
          if (variable instanceof FullContext fullContext) {
            context.put(key, fullContext.getTarget());
          } else {
            context.put(key, variable);
          }
        });
    context.put("__ctx__", WkfContextHelper.class);

    log.debug("Context keys for BAML execution: {}", context.keySet());

    return context;
  }
}
