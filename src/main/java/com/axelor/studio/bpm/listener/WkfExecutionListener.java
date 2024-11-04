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
package com.axelor.studio.bpm.listener;

import com.axelor.db.JPA;
import com.axelor.db.tenants.TenantResolver;
import com.axelor.i18n.I18n;
import com.axelor.studio.bpm.service.execution.WkfInstanceService;
import com.axelor.studio.bpm.service.log.WkfLogService;
import com.axelor.studio.db.WkfInstance;
import com.axelor.studio.db.WkfProcess;
import com.axelor.studio.db.WkfTaskConfig;
import com.axelor.studio.db.repo.WkfInstanceRepository;
import com.axelor.studio.db.repo.WkfProcessRepository;
import com.axelor.studio.db.repo.WkfTaskConfigRepository;
import com.axelor.studio.service.AppSettingsStudioService;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import java.lang.invoke.MethodHandles;
import java.util.Collection;
import javax.persistence.FlushModeType;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaUpdate;
import javax.persistence.criteria.Root;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.ExecutionListener;
import org.camunda.bpm.engine.impl.persistence.entity.ExecutionEntity;
import org.camunda.bpm.engine.impl.persistence.entity.ProcessDefinitionEntity;
import org.camunda.bpm.engine.runtime.MessageCorrelationBuilder;
import org.camunda.bpm.engine.runtime.MessageCorrelationResult;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.model.bpmn.impl.BpmnModelConstants;
import org.camunda.bpm.model.bpmn.instance.FlowElement;
import org.camunda.bpm.model.bpmn.instance.MessageEventDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class WkfExecutionListener implements ExecutionListener {

  protected static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  protected WkfInstanceRepository wkfInstanceRepo;
  protected WkfInstanceService wkfInstanceService;
  protected WkfProcessRepository wkfProcessRepo;
  protected WkfTaskConfigRepository wkfTaskConfigRepo;
  protected WkfLogService wkfLogService;
  protected AppSettingsStudioService appSettingsStudioService;

  @Inject
  public WkfExecutionListener(
      WkfInstanceRepository wkfInstanceRepo,
      WkfInstanceService wkfInstanceService,
      WkfProcessRepository wkfProcessRepo,
      WkfTaskConfigRepository wkfTaskConfigRepo,
      WkfLogService wkfLogService,
      AppSettingsStudioService appSettingsStudioService) {

    this.wkfInstanceRepo = wkfInstanceRepo;
    this.wkfInstanceService = wkfInstanceService;
    this.wkfProcessRepo = wkfProcessRepo;
    this.wkfTaskConfigRepo = wkfTaskConfigRepo;
    this.wkfLogService = wkfLogService;
    this.appSettingsStudioService = appSettingsStudioService;
  }

  @Override
  public void notify(DelegateExecution execution) throws Exception {

    String eventName = execution.getEventName();
    var executionEntity = (ExecutionEntity) execution;

    if (execution.getTenantId() != null) {
      String tenantId = execution.getTenantId();
      String host = tenantId.substring(tenantId.indexOf(":") + 1);
      tenantId = tenantId.substring(0, tenantId.indexOf(":"));
      TenantResolver.setCurrentTenant(tenantId, host);
    }

    if (eventName.equals(EVENTNAME_START)) {

      if (execution.getProcessInstance().getActivityInstanceId() == null) {
        createWkfInstance(execution);
      } else {
        processNodeStart(execution);
      }

    } else if (eventName.equals(EVENTNAME_END)) {
      processNodeEnd(execution);

      if (executionEntity.getEventSource() instanceof ProcessDefinitionEntity) {
        wkfLogService.clearLog(execution.getProcessInstanceId());
      }
    }
    if (executionEntity.isEnded() && executionEntity.getParent() == null) {
      wkfInstanceService.setInstanceStateStopped(executionEntity.getProcessInstanceId());
    }
  }

  protected void checkDMNValue(DelegateExecution execution) {

    String compulsory =
        execution
            .getBpmnModelElementInstance()
            .getAttributeValueNs(BpmnModelConstants.CAMUNDA_NS, "compulsory");

    if (compulsory != null && compulsory.equals("true")) {
      String varName =
          execution
              .getBpmnModelElementInstance()
              .getAttributeValueNs(
                  BpmnModelConstants.CAMUNDA_NS,
                  BpmnModelConstants.CAMUNDA_ATTRIBUTE_RESULT_VARIABLE);
      if (execution.getVariable(varName) == null) {
        throw new IllegalStateException(
            String.format(I18n.get("No result from DMN : %s"), execution.getCurrentActivityName()));
      }
    }
  }

  protected void createWkfInstance(DelegateExecution execution) {
    String instanceId = execution.getProcessInstanceId();
    WkfInstance wkfInstance = wkfInstanceRepo.findByInstanceId(instanceId);
    log.debug("Process called with related wkfInstance: {}", wkfInstance);
    if (wkfInstance == null) {
      execution.setVariable(
          getProcessKey(execution, execution.getProcessDefinitionId()),
          execution.getProcessInstanceId());
      wkfInstance = createWkfInstance(execution, instanceId, wkfInstanceRepo);
    }
  }

  protected void processNodeStart(DelegateExecution execution) {

    FlowElement flowElement = execution.getBpmnModelElementInstance();
    if (flowElement == null) {
      return;
    }

    String type = flowElement.getElementType().getTypeName();

    boolean blocking = blockingNode(type);
    String instanceId = execution.getProcessInstanceId();

    setInstanceCurrentNode(instanceId, flowElement.getId());

    log.debug("Executing: id={},name={}", flowElement.getId(), flowElement.getName());
    boolean isLog = appSettingsStudioService.isAddBpmLog();
    if (!blocking && isLog) {
      wkfLogService.createOrAttachAppender(instanceId);
    }

    if (type.equals(BpmnModelConstants.BPMN_ELEMENT_INTERMEDIATE_THROW_EVENT)) {
      sendMessage(flowElement, execution);

    } else if (blocking) {
      wkfLogService.writeLog(instanceId);
      if (type.equals(BpmnModelConstants.BPMN_ELEMENT_END_EVENT)) {
        sendMessage(flowElement, execution);
      }
      WkfTaskConfig wkfTaskConfig = getWkfTaskConfig(execution);
      wkfInstanceService.onNodeActivation(wkfTaskConfig, execution);
    }
  }

  protected void removeInstanceVariables(DelegateExecution execution) {
    RuntimeService runtimeService = execution.getProcessEngineServices().getRuntimeService();
    String processInstanceId = execution.getProcessInstanceId();
    ProcessInstance processInstance =
        runtimeService
            .createProcessInstanceQuery()
            .processInstanceId(processInstanceId)
            .singleResult();
    if (processInstance == null || processInstance.isEnded()) {
      runtimeService.removeVariables(
          processInstanceId, runtimeService.getVariables(processInstanceId).keySet());
    }
  }

  @Transactional(rollbackOn = Exception.class)
  protected void setInstanceCurrentNode(String instanceId, String flowElementId) {
    CriteriaBuilder cb = JPA.em().getCriteriaBuilder();
    CriteriaUpdate<WkfInstance> update = cb.createCriteriaUpdate(WkfInstance.class);
    Root<WkfInstance> root = update.from(WkfInstance.class);
    update.set(root.get("node"), flowElementId);
    update.where(cb.equal(root.get("instanceId"), instanceId));
    JPA.em().createQuery(update).setFlushMode(FlushModeType.COMMIT).executeUpdate();
  }

  protected void processNodeEnd(DelegateExecution execution) {

    FlowElement flowElement = execution.getBpmnModelElementInstance();
    if (flowElement == null) {
      return;
    }

    String type = flowElement.getElementType().getTypeName();

    if (type.equals(BpmnModelConstants.BPMN_ELEMENT_BUSINESS_RULE_TASK)) {
      checkDMNValue(execution);

    } else if (blockingNode(type)) {
      WkfTaskConfig wkfTaskConfig = getWkfTaskConfig(execution);
      wkfInstanceService.onNodeDeactivation(wkfTaskConfig, execution);
    }
    if (type.equals(BpmnModelConstants.BPMN_ELEMENT_END_EVENT)) {
      removeInstanceVariables(execution);
    }
  }

  protected void sendMessage(FlowElement flowElement, DelegateExecution execution) {

    Collection<MessageEventDefinition> messageDefinitions =
        flowElement.getChildElementsByType(MessageEventDefinition.class);

    if (messageDefinitions.isEmpty()) {
      return;
    }

    MessageEventDefinition messageDefinition = messageDefinitions.iterator().next();

    String message = messageDefinition.getMessage().getName();

    if (message.contains("${")) {
      String[] msg = message.split("\\$\\{");
      String expr = msg[1].replace("}", "");
      message = msg[0] + execution.getVariable(expr);
    }
    log.debug("Sending message: {}", message);

    MessageCorrelationBuilder msgBuilder =
        execution.getProcessEngineServices().getRuntimeService().createMessageCorrelation(message);

    if (execution.getTenantId() != null) {
      msgBuilder = msgBuilder.tenantId(execution.getTenantId());
    }

    String processKey = getProcessKey(execution, execution.getProcessDefinitionId());
    log.debug("Process key: {}", processKey);

    msgBuilder.setVariable(processKey, execution.getProcessInstanceId());

    Collection<MessageCorrelationResult> results = msgBuilder.correlateAllWithResult();
    log.debug("Message result : {}", results.size());

    results.forEach(
        result -> {
          ProcessInstance resultInstance = result.getProcessInstance();
          log.debug("Resulted process instance: {}", resultInstance);
          if (resultInstance != null) {
            execution.setVariable(
                getProcessKey(execution, resultInstance.getProcessDefinitionId()),
                resultInstance.getId());
          }
        });
  }

  protected String getProcessKey(DelegateExecution execution, String processDefinitionId) {

    return execution
        .getProcessEngineServices()
        .getRepositoryService()
        .getProcessDefinition(processDefinitionId)
        .getKey();
  }

  @Transactional(rollbackOn = Exception.class)
  public WkfInstance createWkfInstance(
      DelegateExecution execution, String instanceId, WkfInstanceRepository instanceRepo) {

    WkfInstance wkfInstance;
    wkfInstance = new WkfInstance();
    wkfInstance.setInstanceId(instanceId);
    WkfProcess wkfProcess =
        wkfProcessRepo
            .all()
            .filter("self.processId = ?1", execution.getProcessDefinitionId())
            .fetchOne();
    wkfInstance.setName(wkfProcess.getProcessId() + " : " + instanceId);
    wkfInstance.setWkfProcess(wkfProcess);
    wkfInstance.setModelId((Long) execution.getVariable("modelId"));
    return instanceRepo.save(wkfInstance);
  }

  protected WkfTaskConfig getWkfTaskConfig(DelegateExecution execution) {
    WkfTaskConfig wkfTaskConfig =
        wkfTaskConfigRepo
            .all()
            .autoFlush(false)
            .filter(
                "self.name = ? and self.wkfModel.id = (select wkfModel.id from WkfProcess where processId = ?)",
                execution.getCurrentActivityId(),
                execution.getProcessDefinitionId())
            .fetchOne();

    log.debug(
        "Task config searched with taskId: {}, processInstanceId: {}, found:{}",
        execution.getCurrentActivityId(),
        execution.getProcessInstanceId(),
        wkfTaskConfig);

    return wkfTaskConfig;
  }

  protected boolean blockingNode(String type) {

    boolean blockinNode = false;
    switch (type) {
      case (BpmnModelConstants.BPMN_ELEMENT_USER_TASK):
      case (BpmnModelConstants.BPMN_ELEMENT_CATCH_EVENT):
      case (BpmnModelConstants.BPMN_ELEMENT_CALL_ACTIVITY):
      case (BpmnModelConstants.BPMN_ELEMENT_END_EVENT):
        blockinNode = true;
        break;
    }

    return blockinNode;
  }
}
