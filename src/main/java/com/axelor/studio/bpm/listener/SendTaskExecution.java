/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.listener;

import java.lang.invoke.MethodHandles;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.camunda.bpm.engine.impl.bpmn.parser.BpmnParse;
import org.camunda.bpm.engine.impl.cfg.StandaloneProcessEngineConfiguration;
import org.camunda.bpm.engine.impl.el.JuelExpressionManager;
import org.camunda.bpm.impl.juel.jakarta.el.ELContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class SendTaskExecution implements JavaDelegate {

  protected static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  @Override
  public void execute(DelegateExecution execution) throws Exception {

    String message = null;

    message =
        execution
            .getBpmnModelElementInstance()
            .getAttributeValueNs(
                BpmnParse.CAMUNDA_BPMN_EXTENSIONS_NS.getNamespaceUri(), "messageName");

    log.debug("Message to send: {}", message);
    if (message != null) {
      StandaloneProcessEngineConfiguration configuration =
          (StandaloneProcessEngineConfiguration)
              execution.getProcessEngine().getProcessEngineConfiguration();
      JuelExpressionManager manager = (JuelExpressionManager) configuration.getExpressionManager();
      ELContext elContext = manager.getElContext(execution);
      String msg = (String) manager.createValueExpression(message).getValue(elContext);
      log.debug("Message after eval expression: {}", msg);
      execution
          .getProcessEngineServices()
          .getRuntimeService()
          .createMessageCorrelation(msg)
          .correlateAll();
    }
  }
}
