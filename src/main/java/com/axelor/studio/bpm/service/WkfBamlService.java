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
package com.axelor.studio.bpm.service;

import com.axelor.db.Model;
import com.axelor.studio.baml.service.BamlService;
import com.axelor.studio.bpm.context.WkfContextHelper;
import com.axelor.studio.db.BamlModel;
import com.axelor.studio.db.repo.BamlModelRepository;
import com.axelor.utils.context.FullContext;
import com.google.inject.Inject;
import java.util.HashMap;
import java.util.Map;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.camunda.bpm.engine.impl.bpmn.parser.BpmnParse;
import org.camunda.bpm.model.bpmn.instance.BpmnModelElementInstance;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class WkfBamlService implements JavaDelegate {

  protected static final Logger log = LoggerFactory.getLogger(WkfBamlService.class);

  protected BamlModelRepository bamlModelRepo;
  protected BamlService bamlService;
  protected WkfCommonService wkfCommonService;

  @Inject
  public WkfBamlService(
      BamlModelRepository bamlModelRepo,
      BamlService bamlService,
      WkfCommonService wkfCommonService) {
    this.bamlModelRepo = bamlModelRepo;
    this.bamlService = bamlService;
    this.wkfCommonService = wkfCommonService;
  }

  @Override
  public void execute(DelegateExecution execution) throws Exception {

    BpmnModelElementInstance bpmnModelElementInstance = execution.getBpmnModelElementInstance();

    String baml =
        bpmnModelElementInstance.getAttributeValueNs(
            BpmnParse.CAMUNDA_BPMN_EXTENSIONS_NS.getNamespaceUri(), "baml");

    if (baml != null && Boolean.parseBoolean(baml)) {
      String model =
          bpmnModelElementInstance.getAttributeValueNs(
              BpmnParse.CAMUNDA_BPMN_EXTENSIONS_NS.getNamespaceUri(), "bamlModel");
      BamlModel bamlModel = bamlModelRepo.findByName(model);
      if (bamlModel != null) {
        executeBaml(execution, bamlModel);
      }
    }
  }

  protected void executeBaml(DelegateExecution execution, BamlModel bamlModel) {

    Map<String, Object> context = createContext(execution);

    Model record = bamlService.execute(bamlModel, context);
    log.debug("Record created from BAML: {}", record);

    if (record != null) {
      String varName = wkfCommonService.getVarName(record);
      Map<String, Object> modelMap = new HashMap<String, Object>();
      modelMap.put(varName, record);
      execution.getProcessInstance().setVariables(wkfCommonService.createVariables(modelMap));
    }
  }

  protected Map<String, Object> createContext(DelegateExecution execution) {

    Map<String, Object> variables = execution.getVariables();

    Map<String, Object> context = new HashMap<String, Object>();

    for (String varName : variables.keySet()) {
      Object variable = variables.get(varName);
      if (variable instanceof FullContext) {
        context.put(varName, ((FullContext) variable).getTarget());
      } else {
        context.put(varName, variable);
      }
    }
    context.put("$ctx", WkfContextHelper.class);

    log.debug("Context keys for BAML execution: {}", context.keySet());

    return context;
  }
}
