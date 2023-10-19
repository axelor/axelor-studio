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

import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.OutputStreamAppender;
import com.axelor.db.EntityHelper;
import com.axelor.db.JPA;
import com.axelor.db.Model;
import com.axelor.i18n.I18n;
import com.axelor.meta.CallMethod;
import com.axelor.meta.MetaFiles;
import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.studio.bpm.context.WkfContextHelper;
import com.axelor.studio.bpm.exception.AxelorScriptEngineException;
import com.axelor.studio.bpm.exception.BpmExceptionMessage;
import com.axelor.studio.bpm.service.WkfCommonService;
import com.axelor.studio.bpm.service.init.ProcessEngineService;
import com.axelor.studio.bpm.service.log.WkfLogService;
import com.axelor.studio.bpm.service.message.BpmErrorMessageService;
import com.axelor.studio.db.WkfInstance;
import com.axelor.studio.db.WkfInstanceMigrationHistory;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.WkfProcess;
import com.axelor.studio.db.WkfProcessConfig;
import com.axelor.studio.db.WkfTaskConfig;
import com.axelor.studio.db.repo.WkfInstanceRepository;
import com.axelor.studio.db.repo.WkfTaskConfigRepository;
import com.axelor.utils.helpers.ExceptionHelper;
import com.axelor.utils.helpers.context.FullContext;
import com.axelor.utils.helpers.context.FullContextHelper;
import com.google.common.base.Strings;
import com.google.common.collect.ImmutableMap;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.io.IOUtils;
import org.camunda.bpm.engine.HistoryService;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.history.HistoricActivityInstanceQuery;
import org.camunda.bpm.engine.history.HistoricProcessInstance;
import org.camunda.bpm.engine.history.HistoricProcessInstanceQuery;
import org.camunda.bpm.engine.history.HistoricVariableInstance;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.runtime.ProcessInstantiationBuilder;
import org.camunda.bpm.engine.variable.Variables;
import org.camunda.bpm.engine.variable.Variables.SerializationDataFormats;
import org.camunda.bpm.model.bpmn.impl.BpmnModelConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class WkfInstanceServiceImpl implements WkfInstanceService {

  protected static final Logger log = LoggerFactory.getLogger(WkfInstanceServiceImpl.class);

  protected ProcessEngineService engineService;

  protected WkfInstanceRepository wkfInstanceRepository;

  protected WkfCommonService wkfService;

  protected MetaFiles metaFiles;

  protected WkfTaskConfigRepository wkfTaskConfigRepository;

  protected WkfTaskService wkfTaskService;

  protected WkfEmailService wkfEmailService;

  protected WkfUserActionService wkfUserActionService;

  protected BpmErrorMessageService bpmErrorMessageService;

  protected WkfLogService wkfLogService;

  @Inject
  public WkfInstanceServiceImpl(
      ProcessEngineService engineService,
      WkfInstanceRepository wkfInstanceRepository,
      WkfCommonService wkfService,
      MetaFiles metaFiles,
      WkfTaskConfigRepository wkfTaskConfigRepository,
      WkfTaskService wkfTaskService,
      WkfEmailService wkfEmailService,
      WkfUserActionService wkfUserActionService,
      BpmErrorMessageService bpmErrorMessageService,
      WkfLogService wkfLogService) {
    this.engineService = engineService;
    this.wkfInstanceRepository = wkfInstanceRepository;
    this.wkfService = wkfService;
    this.metaFiles = metaFiles;
    this.wkfTaskConfigRepository = wkfTaskConfigRepository;
    this.wkfTaskService = wkfTaskService;
    this.wkfEmailService = wkfEmailService;
    this.wkfUserActionService = wkfUserActionService;
    this.bpmErrorMessageService = bpmErrorMessageService;
    this.wkfLogService = wkfLogService;
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public String evalInstance(Model model, String signal) throws ClassNotFoundException {

    model = EntityHelper.getEntity(model);

    String helpText = null;

    OutputStreamAppender<ILoggingEvent> appender = null;
    String processInstanceId = null;
    try {
      if (Strings.isNullOrEmpty(model.getProcessInstanceId())) {
        checkSubProcess(model);
      }

      if (Strings.isNullOrEmpty(model.getProcessInstanceId())) {
        addRelatedProcessInstanceId(model);
        log.debug("Model process instanceId added: {}", model.getProcessInstanceId());
      }

      if (!Strings.isNullOrEmpty(model.getProcessInstanceId())) {

        ProcessEngine engine = engineService.getEngine();

        WkfInstance wkfInstance =
            wkfInstanceRepository.findByInstanceId(model.getProcessInstanceId());

        if (wkfInstance == null) {
          return helpText;
        }

        ProcessInstance processInstance =
            findProcessInstance(wkfInstance.getInstanceId(), engine.getRuntimeService());

        if (processInstance != null && !processInstance.isEnded()) {
          processInstanceId = processInstance.getId();
          appender = wkfLogService.createOrAttachAppender(processInstanceId);
          helpText = wkfTaskService.runTasks(engine, wkfInstance, processInstance, signal, model);
        }
      }
    } catch (Exception e) {
      if (!(e instanceof AxelorScriptEngineException)) {
        WkfProcessConfig wkfProcessConfig = wkfService.findCurrentProcessConfig(model);
        final String finalProcessInstanceId = model.getProcessInstanceId();
        ExecutorService executor = Executors.newCachedThreadPool();
        executor.submit(
            () -> {
              bpmErrorMessageService.sendBpmErrorMessage(
                  null,
                  e.getMessage(),
                  EntityHelper.getEntity(wkfProcessConfig.getWkfProcess().getWkfModel()),
                  finalProcessInstanceId);
              return true;
            });
      }
      throw e;
    } finally {
      if (appender != null) {
        wkfLogService.writeLog(processInstanceId);
      }
    }

    return helpText;
  }

  protected void startInstance(WkfProcessConfig wkfProcessConfig, Model model) {

    WkfProcessConfig previousConfig = wkfService.findOldProcessConfig(model);

    if (previousConfig != null
        && previousConfig.getProcessPath() != null
        && addRelatedInstance(model, previousConfig)) {
      return;
    }

    log.debug(
        "Start instance for the model: {}, id: {}", model.getClass().getName(), model.getId());

    WkfProcess wkfProcess = wkfProcessConfig.getWkfProcess();
    ProcessEngine engine = engineService.getEngine();
    RuntimeService runTimeService = engine.getRuntimeService();

    ProcessInstantiationBuilder builder =
        runTimeService.createProcessInstanceById(wkfProcess.getProcessId());

    Map<String, Object> modelMap = new HashMap<String, Object>();
    modelMap.put(wkfService.getVarName(model), new FullContext(model));
    builder.setVariables(wkfService.createVariables(modelMap));
    ProcessInstance processInstance = builder.executeWithVariablesInReturn();
    WkfInstance instance = wkfInstanceRepository.findByInstanceId(model.getProcessInstanceId());
    if (instance != null) {
      instance.setModelId(model.getId());
      instance.setModelName(model.getClass().getName());
      instance.setProcessInstanceId(processInstance.getId());
    }
    model.setProcessInstanceId(processInstance.getId());
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public WkfInstance createWkfInstance(String processInstanceId, WkfProcess wkfProcess) {

    WkfInstance instance = new WkfInstance();
    instance.setWkfProcess(wkfProcess);
    instance.setInstanceId(processInstanceId);
    instance.setName(wkfProcess.getProcessId() + " : " + processInstanceId);

    return wkfInstanceRepository.save(instance);
  }

  protected void addRelatedProcessInstanceId(Model model) {

    WkfProcessConfig wkfProcessConfig = wkfService.findCurrentProcessConfig(model);

    //    if (wkfProcessConfig == null) {
    //      wkfProcessConfig = wkfService.findOldProcessConfig(model);
    //    }

    if (wkfProcessConfig != null) {
      if (wkfProcessConfig.getIsStartModel()) {
        startInstance(wkfProcessConfig, model);
      } else {
        addRelatedInstance(model, wkfProcessConfig);
      }
    } else {
      log.debug(
          "No active process config found for model: {}, id: {}",
          model.getClass().getName(),
          model.getId());
    }
  }

  protected boolean addRelatedInstance(Model model, WkfProcessConfig wkfProcessConfig) {

    log.debug(
        "Find related instance for the model: {}, id: {}, path: {}",
        model.getClass().getName(),
        model.getId(),
        wkfProcessConfig.getProcessPath());

    Object object = wkfService.findRelatedRecord(model, wkfProcessConfig.getProcessPath());

    if (object instanceof FullContext) {
      FullContext relatedModel = (FullContext) object;
      log.debug(
          "Related instance found with processInstanceId: {}",
          relatedModel.get("processInstanceId"));
      model.setProcessInstanceId((String) relatedModel.get("processInstanceId"));
      return true;
    } else {
      WkfProcessConfig oldProcessConfig = wkfService.findOldProcessConfig(model);
      if (oldProcessConfig == null
          || oldProcessConfig.getProcessPath() == null
          || oldProcessConfig.equals(wkfProcessConfig)) {
        return false;
      }
      return addRelatedInstance(model, oldProcessConfig);
    }
  }

  protected ProcessInstance findProcessInstance(
      String processInstanceId, RuntimeService runTimeService) {
    return runTimeService
        .createProcessInstanceQuery()
        .processInstanceId(processInstanceId)
        .singleResult();
  }

  @Override
  public boolean isActiveProcessInstance(String processInstanceId, RuntimeService runTimeService) {

    long count =
        runTimeService.createProcessInstanceQuery().processInstanceId(processInstanceId).count();

    return count > 0;
  }

  @Override
  public void deleteProcessInstance(String processInstanceId) {
    ProcessEngine engine = engineService.getEngine();

    long activeProcessCount =
        engine
            .getRuntimeService()
            .createProcessInstanceQuery()
            .processInstanceId(processInstanceId)
            .count();

    if (activeProcessCount >= 1) {
      engine
          .getRuntimeService()
          .deleteProcessInstance(processInstanceId, "Removed wkf instance", true, true);

    } else {
      engine.getHistoryService().deleteHistoricProcessInstanceIfExists(processInstanceId);
    }
  }

  @Override
  public boolean isActiveTask(String processInstanceId, String taskId) {

    if (processInstanceId == null || taskId == null) {
      return false;
    }

    long tasks =
        engineService
            .getEngine()
            .getHistoryService()
            .createHistoricActivityInstanceQuery()
            .processInstanceId(processInstanceId)
            .unfinished()
            .activityId(taskId)
            .count();

    return tasks > 0;
  }

  @Override
  public boolean isActiveModelTask(Model model, String taskId) {

    if (model == null || taskId == null) {
      return false;
    }

    Model savedModel = JPA.find(EntityHelper.getEntityClass(model), model.getId());

    return isActiveTask(savedModel.getProcessInstanceId(), taskId);
  }

  @Override
  public boolean isActivatedTask(String processInstanceId, String taskId) {

    if (processInstanceId == null || taskId == null) {
      return false;
    }

    long tasks =
        engineService
            .getEngine()
            .getHistoryService()
            .createHistoricActivityInstanceQuery()
            .processInstanceId(processInstanceId)
            .activityId(taskId)
            .count();

    return tasks > 0;
  }

  @Override
  public boolean isActivatedModelTask(Model model, String taskId) {

    if (model == null || taskId == null) {
      return false;
    }

    Model savedModel = JPA.find(EntityHelper.getEntityClass(model), model.getId());

    return isActivatedTask(savedModel.getProcessInstanceId(), taskId);
  }

  @Override
  @CallMethod
  public List<String> findProcessInstanceByNode(
      String nodeKey, String processId, String type, boolean permanent) {

    HistoricProcessInstanceQuery processInstanceQuery =
        engineService.getEngine().getHistoryService().createHistoricProcessInstanceQuery();

    List<String> processInstanceIds =
        processInstanceQuery
            .processDefinitionId(processId)
            .activeActivityIdIn(nodeKey)
            .unfinished()
            .list()
            .stream()
            .map(HistoricProcessInstance::getId)
            .collect(Collectors.toList());

    if (permanent) {
      processInstanceQuery =
          engineService.getEngine().getHistoryService().createHistoricProcessInstanceQuery();
      processInstanceQuery
          .processDefinitionId(processId)
          .executedActivityIdIn(nodeKey)
          .list()
          .forEach(it -> processInstanceIds.add(it.getId()));
    }

    if (type != null && type.equals(BpmnModelConstants.BPMN_ELEMENT_END_EVENT)) {
      engineService
          .getEngine()
          .getHistoryService()
          .createHistoricProcessInstanceQuery()
          .executedActivityIdIn(nodeKey)
          .completed()
          .or()
          .finished()
          .endOr()
          .processDefinitionKey(processId.substring(0, processId.indexOf(":")))
          .list()
          .forEach(it -> processInstanceIds.add(it.getId()));
    }

    processInstanceIds.add("0");

    return processInstanceIds;
  }

  @Override
  public void onNodeActivation(WkfTaskConfig wkfTaskConfig, DelegateExecution execution) {

    if (wkfTaskConfig == null || execution == null) {
      return;
    }

    if (wkfTaskConfig.getNotificationEmail()
        && wkfTaskConfig.getEmailEvent() != null
        && wkfTaskConfig.getEmailEvent().equals("start")) {
      try {
        wkfEmailService.sendEmail(wkfTaskConfig, execution);
      } catch (Exception e) {
        ExceptionHelper.trace(e);
      }
    }

    if (wkfTaskConfig.getCreateTask()) {
      wkfUserActionService.createUserAction(wkfTaskConfig, execution);
    }
  }

  @Override
  public void onNodeDeactivation(WkfTaskConfig wkfTaskConfig, DelegateExecution execution) {

    if (wkfTaskConfig == null || execution == null) {
      return;
    }

    if (wkfTaskConfig.getNotificationEmail()
        && wkfTaskConfig.getEmailEvent() != null
        && wkfTaskConfig.getEmailEvent().equals("end")) {
      try {
        wkfEmailService.sendEmail(wkfTaskConfig, execution);
      } catch (Exception e) {
        ExceptionHelper.trace(e);
      }
    }
  }

  @Override
  public void terminateAll() {

    RuntimeService runtimeService = engineService.getEngine().getRuntimeService();
    List<ProcessInstance> processInstances =
        runtimeService.createProcessInstanceQuery().active().unlimitedList();

    processInstances.forEach(
        processInstance -> {
          try {
            runtimeService.deleteProcessInstance(
                processInstance.getProcessInstanceId(), "Reset", true, true, false);

          } catch (Exception e) {
            log.debug(
                "Error removing process instance: {}", processInstance.getProcessInstanceId());
          }
        });
  }

  @Override
  public String getInstanceXml(String instanceId) {

    if (!Strings.isNullOrEmpty(instanceId)) {

      String processDefinitionId = null;
      ProcessEngine processEngine = engineService.getEngine();

      HistoricProcessInstance processInstance =
          processEngine
              .getHistoryService()
              .createHistoricProcessInstanceQuery()
              .processInstanceId(instanceId)
              .singleResult();

      if (processInstance != null) {
        processDefinitionId = processInstance.getProcessDefinitionId();
      } else {
        ProcessInstance instance =
            processEngine
                .getRuntimeService()
                .createProcessInstanceQuery()
                .processInstanceId(instanceId)
                .singleResult();
        if (instance != null) {
          processDefinitionId = instance.getProcessDefinitionId();
        }
      }
      if (processDefinitionId != null) {
        InputStream inputStream =
            processEngine.getRepositoryService().getProcessModel(processDefinitionId);
        try {
          return IOUtils.toString(inputStream, StandardCharsets.UTF_8);
        } catch (IOException e) {
          ExceptionHelper.trace(e);
        }
      }
    }
    return null;
  }

  @Override
  public void restart(String processInstanceId, String processName, String activityId) {

    WkfInstance wkfInstance = wkfInstanceRepository.findByInstanceId(processInstanceId);

    if (!wkfInstance.getWkfProcess().getName().equals(processName)) {
      HistoricVariableInstance relatedProcessId =
          engineService
              .getEngine()
              .getHistoryService()
              .createHistoricVariableInstanceQuery()
              .processInstanceId(processInstanceId)
              .variableName(processName)
              .singleResult();

      if (relatedProcessId == null) {
        throw new IllegalStateException(
            I18n.get(BpmExceptionMessage.CANT_RESTART_INACTIVE_PROCESS));
      }
      processInstanceId = (String) relatedProcessId.getValue();
    }

    RuntimeService runtimeService = engineService.getEngine().getRuntimeService();

    long count =
        runtimeService
            .createProcessInstanceQuery()
            .active()
            .processInstanceId(processInstanceId)
            .count();

    if (count == 0) {
      throw new IllegalStateException(I18n.get(BpmExceptionMessage.CANT_RESTART_INACTIVE_PROCESS));
    }

    runtimeService
        .createProcessInstanceModification(processInstanceId)
        .cancelAllForActivity(activityId)
        .startBeforeActivity(activityId)
        .setVariables(createVariables(processInstanceId))
        .execute();
  }

  @Override
  public void cancelNode(String processInstanceId, String activityId) {

    RuntimeService runtimeService = engineService.getEngine().getRuntimeService();

    runtimeService
        .createProcessInstanceModification(processInstanceId)
        .cancelAllForActivity(activityId)
        .execute(true, true);
  }

  protected Map<String, Object> createVariables(String processInstanceId) {

    Map<String, Object> varMap = new HashMap<String, Object>();

    WkfInstance wkfInstance = wkfInstanceRepository.findByInstanceId(processInstanceId);

    if (wkfInstance == null) {
      return varMap;
    }

    wkfInstance
        .getWkfProcess()
        .getWkfProcessConfigList()
        .forEach(
            wkfProcessConfig -> {
              Model model =
                  FullContextHelper.getRepository(wkfProcessConfig.getModel())
                      .all()
                      .filter("self.processInstanceId = ?1", processInstanceId)
                      .fetchOne();

              if (model == null) {
                return;
              }

              Object var =
                  Variables.objectValue(new FullContext(model), true)
                      .serializationDataFormat(SerializationDataFormats.JSON)
                      .create();

              Long id = ((Model) model).getId();

              String varName = wkfService.getVarName(model);
              varMap.put(varName, var);
              varMap.put(varName + "Id", id);
            });

    return varMap;
  }

  @Override
  public List<String> getNodes(String processInstanceId) {

    List<String> nodes = new ArrayList<String>();

    HistoryService historyService = engineService.getEngine().getHistoryService();

    HistoricActivityInstanceQuery query =
        historyService.createHistoricActivityInstanceQuery().processInstanceId(processInstanceId);

    query
        .list()
        .forEach(
            instance -> {
              String name = instance.getActivityName();
              String id = instance.getActivityId();

              if (name != null) {
                id = name + "(" + id + ")";
              }

              nodes.add(id);
            });

    return nodes;
  }

  protected void checkSubProcess(Model model) {

    String chldModel =
        model instanceof MetaJsonRecord
            ? ((MetaJsonRecord) model).getJsonModel()
            : model.getClass().getSimpleName();

    List<WkfTaskConfig> taskConfigs =
        wkfTaskConfigRepository
            .all()
            .filter("self.callModel = ?1 AND self.callLink IS NOT NULL", chldModel)
            .fetch();

    if (taskConfigs.isEmpty()) {
      return;
    }

    FullContext modelCtx = WkfContextHelper.create(model);
    Map<String, Object> ctxMap = ImmutableMap.of(wkfService.getVarName(model), modelCtx);

    for (WkfTaskConfig taskConfig : taskConfigs) {

      if (!evalCondition(ctxMap, taskConfig.getCallLinkCondition())) {
        continue;
      }

      Object parentModel = modelCtx.get(taskConfig.getCallLink());
      if (parentModel instanceof FullContext) {
        Model parent = (Model) ((FullContext) parentModel).getTarget();
        if (!Strings.isNullOrEmpty(parent.getProcessInstanceId())) {
          addChildProcessInstanceId(parent.getProcessInstanceId(), modelCtx, ctxMap);
          break;
        }
      }
    }
  }

  @SuppressWarnings("rawtypes")
  protected void addChildProcessInstanceId(
      String processInstanceId, FullContext modelCtx, Map<String, Object> ctxMap) {

    RuntimeService runtimeService = engineService.getEngine().getRuntimeService();
    List<ProcessInstance> processInstances =
        runtimeService
            .createProcessInstanceQuery()
            .superProcessInstanceId(processInstanceId)
            .list();

    for (ProcessInstance processInstance : processInstances) {
      WkfInstance wkfInstance =
          wkfInstanceRepository.findByInstanceId(processInstance.getProcessInstanceId());
      if (wkfInstance == null) {
        continue;
      }

      List<WkfProcessConfig> processConfigs = wkfInstance.getWkfProcess().getWkfProcessConfigList();

      for (WkfProcessConfig processConfig : processConfigs) {
        String configModel = null;
        if (processConfig.getMetaModel() != null) {
          configModel = processConfig.getMetaModel().getFullName();
        } else if (processConfig.getMetaJsonModel() != null) {
          configModel = processConfig.getMetaJsonModel().getName();
        }

        if (configModel == null) {
          continue;
        }

        Class klass = modelCtx.getContextClass();
        String ctxClass = klass.getName();
        if (klass.equals(MetaJsonRecord.class)) {
          ctxClass = (String) modelCtx.get("jsonModel");
        }
        if (ctxClass.equals(configModel)
            && evalCondition(ctxMap, processConfig.getPathCondition())) {
          modelCtx.put("processInstanceId", wkfInstance.getInstanceId());
          return;
        }
      }
    }
  }

  protected boolean evalCondition(Map<String, Object> ctxMap, String condition) {

    if (condition != null) {
      Object evalCondition = wkfService.evalExpression(ctxMap, condition);
      return evalCondition != null && evalCondition.equals(Boolean.TRUE);
    }

    return true;
  }

  @Transactional
  @Override
  public void updateProcessInstance(
      WkfProcess process, String processInstanceId, int migrationStatus) {

    WkfInstance instance = wkfInstanceRepository.findByInstanceId(processInstanceId);
    if (instance == null) {
      return;
    }

    WkfModel previousModel = instance.getWkfProcess().getWkfModel();
    boolean isSameModel = previousModel.equals(process.getWkfModel());
    instance.addWkfInstanceMigrationHistory(
        createMigrationHistory(instance, previousModel, isSameModel));

    instance.setMigrationStatusSelect(migrationStatus);
    instance.setWkfProcess(process);
    instance.setName(process.getProcessId() + " : " + instance.getInstanceId());
    wkfInstanceRepository.save(instance);
  }

  protected WkfInstanceMigrationHistory createMigrationHistory(
      WkfInstance instance, WkfModel previousModel, boolean isSameModel) {
    WkfInstanceMigrationHistory migrationHistory =
        CollectionUtils.isEmpty(instance.getWkfInstanceMigrationHistory())
            ? null
            : instance.getWkfInstanceMigrationHistory().get(0);

    if (migrationHistory != null && isSameModel) {
      migrationHistory.setMigartionHistoryUpdatedOn(LocalDateTime.now());
    } else {
      migrationHistory = new WkfInstanceMigrationHistory();
      migrationHistory.setWkfInstnace(instance);
      migrationHistory.setVersionCode(previousModel.getCode());
      migrationHistory.setVersionId(previousModel.getId());
    }

    return migrationHistory;
  }
}
