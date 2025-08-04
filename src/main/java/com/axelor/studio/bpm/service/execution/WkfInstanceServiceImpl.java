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
import com.axelor.common.ObjectUtils;
import com.axelor.db.EntityHelper;
import com.axelor.db.JPA;
import com.axelor.db.Model;
import com.axelor.db.Query;
import com.axelor.db.tenants.TenantAware;
import com.axelor.i18n.I18n;
import com.axelor.meta.CallMethod;
import com.axelor.meta.MetaFiles;
import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.meta.db.MetaModel;
import com.axelor.studio.baml.tools.BpmTools;
import com.axelor.studio.bpm.context.WkfContextHelper;
import com.axelor.studio.bpm.exception.AxelorScriptEngineException;
import com.axelor.studio.bpm.exception.BpmExceptionMessage;
import com.axelor.studio.bpm.service.WkfCommonService;
import com.axelor.studio.bpm.service.init.ProcessEngineService;
import com.axelor.studio.bpm.service.log.WkfLogService;
import com.axelor.studio.bpm.service.message.BpmErrorMessageService;
import com.axelor.studio.db.WkfInstance;
import com.axelor.studio.db.WkfInstanceMigrationHistory;
import com.axelor.studio.db.WkfInstanceVariable;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.WkfProcess;
import com.axelor.studio.db.WkfProcessConfig;
import com.axelor.studio.db.WkfTaskConfig;
import com.axelor.studio.db.repo.WkfInstanceRepository;
import com.axelor.studio.db.repo.WkfTaskConfigRepository;
import com.axelor.studio.service.AppSettingsStudioService;
import com.axelor.utils.helpers.ExceptionHelper;
import com.axelor.utils.helpers.context.FullContext;
import com.axelor.utils.helpers.context.FullContextHelper;
import com.google.common.base.Strings;
import com.google.common.collect.ImmutableMap;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStream;
import java.lang.invoke.MethodHandles;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.io.IOUtils;
import org.camunda.bpm.engine.ManagementService;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.ProcessEngines;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.history.HistoricProcessInstance;
import org.camunda.bpm.engine.history.HistoricProcessInstanceQuery;
import org.camunda.bpm.engine.history.HistoricVariableInstance;
import org.camunda.bpm.engine.runtime.Job;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.runtime.ProcessInstantiationBuilder;
import org.camunda.bpm.engine.variable.VariableMap;
import org.camunda.bpm.engine.variable.Variables;
import org.camunda.bpm.engine.variable.Variables.SerializationDataFormats;
import org.camunda.bpm.model.bpmn.impl.BpmnModelConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class WkfInstanceServiceImpl implements WkfInstanceService {

  // XXX this value might need to be reviewed based on our user experience feedbacks
  protected static final int FETCH_SIZE_FOR_EVAL_INSTANCE_BATCH = 5;

  protected static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  protected ProcessEngineService engineService;
  protected WkfInstanceRepository wkfInstanceRepository;
  protected WkfCommonService wkfService;
  protected WkfTaskConfigRepository wkfTaskConfigRepository;
  protected WkfTaskService wkfTaskService;
  protected WkfEmailService wkfEmailService;
  protected WkfUserActionService wkfUserActionService;
  protected BpmErrorMessageService bpmErrorMessageService;
  protected WkfLogService wkfLogService;
  protected AppSettingsStudioService appSettingsStudioService;

  public static final int EXECUTION_SOURCE_LISTENER = 0;
  public static final int EXECUTION_SOURCE_OBSERVER = 1;

  @Inject
  public WkfInstanceServiceImpl(
      ProcessEngineService engineService,
      WkfInstanceRepository wkfInstanceRepository,
      WkfCommonService wkfService,
      WkfTaskConfigRepository wkfTaskConfigRepository,
      WkfTaskService wkfTaskService,
      WkfEmailService wkfEmailService,
      WkfUserActionService wkfUserActionService,
      BpmErrorMessageService bpmErrorMessageService,
      WkfLogService wkfLogService,
      AppSettingsStudioService appSettingsStudioService) {
    this.engineService = engineService;
    this.wkfInstanceRepository = wkfInstanceRepository;
    this.wkfService = wkfService;
    this.wkfTaskConfigRepository = wkfTaskConfigRepository;
    this.wkfTaskService = wkfTaskService;
    this.wkfEmailService = wkfEmailService;
    this.wkfUserActionService = wkfUserActionService;
    this.bpmErrorMessageService = bpmErrorMessageService;
    this.wkfLogService = wkfLogService;
    this.appSettingsStudioService = appSettingsStudioService;
  }

  @Override
  public String evalInstance(Model model, String signal, Integer source)
      throws ClassNotFoundException {
    WkfInstance wkfInstance = null;
    if (model.getProcessInstanceId() != null) {
      wkfInstance = wkfInstanceRepository.findByInstanceId(model.getProcessInstanceId());
    }
    WkfProcessConfig wkfProcessConfig = wkfService.findCurrentProcessConfig(model);
    boolean executeProcess = false;
    if (wkfProcessConfig != null || wkfInstance != null) {
      WkfProcess wkfProcess =
          wkfProcessConfig != null ? wkfProcessConfig.getWkfProcess() : wkfInstance.getWkfProcess();
      executeProcess =
          (!wkfProcess.getOnlyOnClientChange() && EXECUTION_SOURCE_LISTENER == source)
              || (source == EXECUTION_SOURCE_OBSERVER && wkfProcess.getOnlyOnClientChange());
    }
    if (executeProcess) {
      return evalInstance(model, signal);
    }
    return null;
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public String evalInstance(Model model, String signal) throws ClassNotFoundException {

    model = EntityHelper.getEntity(model);

    String helpText = null;

    OutputStreamAppender<ILoggingEvent> appender = null;

    String processInstanceId = null;
    WkfInstance wkfInstance = null;

    try {
      if (Strings.isNullOrEmpty(model.getProcessInstanceId())) {
        checkSubProcess(model);
      }

      if (Strings.isNullOrEmpty(model.getProcessInstanceId())) {
        addRelatedProcessInstanceId(model);
        log.debug("Model process instanceId added: {}", model.getProcessInstanceId());
      }

      if (Strings.isNullOrEmpty(model.getProcessInstanceId())) {
        return helpText;
      }

      ProcessEngine engine = engineService.getEngine();

      wkfInstance = wkfInstanceRepository.findByInstanceId(model.getProcessInstanceId());

      if (wkfInstance == null) {
        return helpText;
      }
      setWkfInstanceError(wkfInstance, false, null);
      try {
        ProcessInstance processInstance =
            findProcessInstance(wkfInstance.getInstanceId(), engine.getRuntimeService());

        if (processInstance != null && !processInstance.isEnded()) {
          processInstanceId = processInstance.getId();
          boolean isLog = appSettingsStudioService.isAddBpmLog();
          if (isLog) {
            appender = wkfLogService.createOrAttachAppender(processInstanceId);
          }
          helpText = wkfTaskService.runTasks(engine, wkfInstance, processInstance, signal, model);
        }
      } catch (Exception e) {
        setWkfInstanceError(wkfInstance, true, e.getMessage());
        throw e;
      }

    } catch (Exception e) {
      if (!(e instanceof AxelorScriptEngineException)) {
        WkfProcessConfig wkfProcessConfig = wkfService.findCurrentProcessConfig(model);
        final String finalProcessInstanceId = model.getProcessInstanceId();
        var executorService = Executors.newSingleThreadExecutor();
        executorService.submit(
            () ->
                new TenantAware(
                        () ->
                            bpmErrorMessageService.sendBpmErrorMessage(
                                null,
                                e.getMessage(),
                                EntityHelper.getEntity(
                                    wkfProcessConfig.getWkfProcess().getWkfModel()),
                                finalProcessInstanceId))
                    .withTransaction(false)
                    .tenantId(BpmTools.getCurentTenant())
                    .run());
      }
      WkfProcess wkfProcess = wkfService.findCurrentProcessConfig(model).getWkfProcess();
      removeRelatedFailedInstance(model, wkfProcess);
      ExceptionHelper.error(e);

    } finally {
      wkfTaskService.reset();
      if (appender != null) {
        wkfLogService.writeLog(processInstanceId);
      }
    }

    return helpText;
  }

  @Override
  public void evalInstance(WkfInstance instance) throws ClassNotFoundException {
    List<WkfProcessConfig> wkfProcessConfigs = instance.getWkfProcess().getWkfProcessConfigList();
    if (wkfProcessConfigs.isEmpty()) {
      return;
    }

    String classFullName = wkfProcessConfigs.getFirst().getMetaModel().getFullName();
    Class<? extends Model> klass = Class.forName(classFullName).asSubclass(Model.class);
    Model model =
        Query.of(klass)
            .filter("self.processInstanceId = :instanceId")
            .bind("instanceId", instance.getInstanceId())
            .fetchOne();

    if (model == null) {
      throw new RuntimeException("Model not found");
    }
    evalInstance(model, null);
  }

  @Override
  public void evalInstancesFromWkfModel(WkfModel wkfModel) {
    wkfModel.getWkfProcessList().forEach(this::evalInstancesFromProcess);
  }

  protected void evalInstancesFromProcess(WkfProcess process) {
    List<WkfProcessConfig> wkfProcessConfigs =
        process.getWkfProcessConfigList().stream()
            .filter(WkfProcessConfig::getIsStartModel)
            .collect(Collectors.toList());
    if (wkfProcessConfigs.isEmpty()) {
      return;
    }

    try {
      int offset = 0;

      MetaModel metaModel = wkfProcessConfigs.getFirst().getMetaModel();
      Class<? extends Model> klass = Class.forName(metaModel.getFullName()).asSubclass(Model.class);

      List<? extends Model> models =
          fetchModelWithInstanceProcessId(klass, FETCH_SIZE_FOR_EVAL_INSTANCE_BATCH, offset);

      while (ObjectUtils.notEmpty(models)) {
        for (Model model : models) {
          log.debug("Update process instance for model {}", model.getId());
          this.evalInstance(model, null);
          offset++;
        }

        if (models.size() < FETCH_SIZE_FOR_EVAL_INSTANCE_BATCH) {
          return;
        }

        JPA.clear();
        models = fetchModelWithInstanceProcessId(klass, FETCH_SIZE_FOR_EVAL_INSTANCE_BATCH, offset);
      }
    } catch (ClassNotFoundException e) {
      throw new RuntimeException(e);
    }
  }

  protected <T extends Model> List<T> fetchModelWithInstanceProcessId(
      Class<T> klass, int limit, int offset) {
    return Query.of(klass)
        .filter("self.processInstanceId IS NOT NULL")
        .order("id")
        .fetch(limit, offset);
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

    Map<String, Object> modelMap = new HashMap<>();
    modelMap.put(wkfService.getVarName(model), new FullContext(model));
    modelMap.put("modelId", model.getId());
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

    if (object instanceof FullContext relatedModel) {
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
        ExceptionHelper.error(e);
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
        ExceptionHelper.error(e);
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
          ExceptionHelper.error(e);
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

    Map<String, Object> varMap = new HashMap<>();

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

    if (process != null) {
      instance.addWkfInstanceMigrationHistory(
          createMigrationHistory(instance, process.getWkfModel()));
      instance.setWkfProcess(process);
      instance.setName(process.getProcessId() + " : " + instance.getInstanceId());
    }

    instance.setMigrationStatusSelect(migrationStatus);
    wkfInstanceRepository.save(instance);
  }

  @Override
  public List<WkfInstanceVariable> getWkfInstanceVariables(WkfInstance instance) {
    String processInstanceId = instance.getInstanceId();
    ProcessEngine processEngine = ProcessEngines.getDefaultProcessEngine();
    RuntimeService runtimeService = processEngine.getRuntimeService();
    ProcessInstance processInstance =
        runtimeService
            .createProcessInstanceQuery()
            .processInstanceId(processInstanceId)
            .singleResult();
    List<WkfInstanceVariable> wkfInstanceVariables = new ArrayList<>();
    if (processInstance != null) {
      getVariables(processInstanceId, runtimeService, wkfInstanceVariables);
    }
    return wkfInstanceVariables;
  }

  protected void getVariables(
      String processInstanceId,
      RuntimeService runtimeService,
      List<WkfInstanceVariable> wkfInstanceVariables) {
    VariableMap variables = runtimeService.getVariablesLocalTyped(processInstanceId);
    variables.forEach(
        (name, value) -> {
          WkfInstanceVariable instanceVariable = new WkfInstanceVariable(name);
          instanceVariable.setValue(String.valueOf(value));
          wkfInstanceVariables.add(instanceVariable);
        });
  }

  protected WkfInstanceMigrationHistory createMigrationHistory(
      WkfInstance instance, WkfModel currentModel) {
    WkfModel previousModel = instance.getWkfProcess().getWkfModel();
    WkfInstanceMigrationHistory migrationHistory =
        CollectionUtils.isEmpty(instance.getWkfInstanceMigrationHistory())
            ? null
            : instance.getWkfInstanceMigrationHistory().getFirst();

    if (migrationHistory != null && currentModel.equals(previousModel)) {
      migrationHistory.setMigrationHistoryUpdatedOn(LocalDateTime.now());
    } else {
      migrationHistory = new WkfInstanceMigrationHistory();
      migrationHistory.setWkfInstance(instance);
      migrationHistory.setVersionCode(previousModel.getCode());
      migrationHistory.setVersionId(previousModel.getId());
    }

    return migrationHistory;
  }

  @Transactional(rollbackOn = Exception.class)
  protected void removeRelatedFailedInstance(Model model, WkfProcess wkfProcess) {
    List<WkfInstance> instances =
        wkfInstanceRepository
            .all()
            .filter(
                "self.modelId = ? and self.wkfProcess.processId = ?",
                model.getId(),
                wkfProcess.getProcessId())
            .fetch();
    for (WkfInstance instance : instances) {
      if (engineService
              .getEngine()
              .getHistoryService()
              .createHistoricProcessInstanceQuery()
              .processInstanceId(instance.getInstanceId())
              .singleResult()
          == null) {
        wkfInstanceRepository.remove(instance);
      }
    }
  }

  protected void setWkfInstanceError(WkfInstance wkfInstance, boolean value, String error) {
    boolean enableNodeErrorMarking = appSettingsStudioService.isEnabledBpmErrorTracking();
    if (enableNodeErrorMarking) {
      error = (error == null || error.length() <= 250) ? error : error.substring(0, 250);
      JPA.em().refresh(wkfInstance);
      wkfInstance.setInstanceError(value);
      wkfInstance.setCurrentError(error);
    }
  }

  @Override
  public String getInstanceLogs(
      WkfInstance instance, String filter, String startString, String endString, Integer minutes) {
    String result = "";
    if (Integer.parseInt(filter) == 1 && startString != null && endString != null) {
      DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSX");
      LocalDateTime startDate = LocalDateTime.parse(startString, formatter);
      LocalDateTime endDate = LocalDateTime.parse(endString, formatter);
      result = getFilteredLogText(instance, startDate, endDate);
    }
    if (Integer.parseInt(filter) == 2 && minutes != null) {
      result =
          getFilteredLogText(
              instance, LocalDateTime.now().minusMinutes(minutes), LocalDateTime.now());
    }
    if (Integer.parseInt(filter) == 3) {
      result = getAllLogText(instance);
    }
    return result;
  }

  public String getAllLogText(WkfInstance instance) {
    try {
      String result = "";
      if (instance.getLogFile() != null) {
        BufferedReader reader =
            new BufferedReader(new FileReader(MetaFiles.getPath(instance.getLogFile()).toString()));
        StringBuilder logBuilder = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
          logBuilder.append(line).append(System.lineSeparator());
        }
        result = logBuilder.toString();
        reader.close();
      }
      return result;
    } catch (Exception e) {
      throw new IllegalStateException(e.getMessage());
    }
  }

  public String getFilteredLogText(WkfInstance wkfInstance, LocalDateTime from, LocalDateTime to) {
    validate(from, to);
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");
    StringBuilder result = new StringBuilder();
    try {
      if (wkfInstance.getLogFile() != null) {
        LocalDateTime lastValidDateTime = null;
        BufferedReader reader =
            new BufferedReader(
                new FileReader(MetaFiles.getPath(wkfInstance.getLogFile()).toString()));
        String line;
        while ((line = reader.readLine()) != null) {
          if (isLogDetails(line)) {
            if (isLogDetailsIncluded(lastValidDateTime, from, to)) {
              result.append(line).append(System.lineSeparator());
            }
            continue;
          }
          String logDateTimeStr = line.substring(0, 23);
          LocalDateTime logDateTime = LocalDateTime.parse(logDateTimeStr, formatter);

          if (logDateTime.isAfter(from) && logDateTime.isBefore(to)) {
            result.append(line).append(System.lineSeparator());
          }

          lastValidDateTime = logDateTime;
        }
        reader.close();
      }
      return result.toString();

    } catch (Exception e) {
      throw new IllegalStateException(e.getMessage());
    }
  }

  protected void validate(LocalDateTime infDate, LocalDateTime supDate) {
    if (infDate.isAfter(supDate)) {
      throw new IllegalArgumentException(
          String.format(I18n.get(BpmExceptionMessage.BPM_LOG_INVALID_DATES)));
    }
  }

  protected boolean isLogDetails(String line) {
    return line.length() < 23 || !Character.isDigit(line.charAt(0));
  }

  protected boolean isLogDetailsIncluded(
      LocalDateTime validDateTime, LocalDateTime inf, LocalDateTime sup) {
    return validDateTime != null && validDateTime.isBefore(sup) && validDateTime.isAfter(inf);
  }

  public List<String> getBlockedInstancesOnTimer() {
    ProcessEngine engine = engineService.getEngine();
    ManagementService managementService = engine.getManagementService();
    List<String> strings = new ArrayList<>();
    List<Job> timerJobs =
        managementService.createJobQuery().timers().active().noRetriesLeft().list();
    for (Job job : timerJobs) {
      strings.add(job.getProcessInstanceId());
    }
    return strings;
  }

  public void unblockTimers(Integer id) {
    WkfInstance wkfInstance = wkfInstanceRepository.find(id.longValue());
    if (wkfInstance == null) {
      return;
    }
    ProcessEngine engine = engineService.getEngine();
    ManagementService managementService = engine.getManagementService();

    List<Job> timerJobs =
        managementService
            .createJobQuery()
            .processInstanceId(wkfInstance.getInstanceId())
            .timers()
            .active()
            .noRetriesLeft()
            .list();
    if (timerJobs.isEmpty()) {
      log.debug("No stucked timer found for instance{} ", wkfInstance.getInstanceId());
    }

    for (Job job : timerJobs) {
      if (job.getRetries() == 0) {
        managementService.setJobRetries(job.getId(), 3);
        log.debug("Unblocked timer job ID: {} by resetting retries to 3", job.getId());
      }
    }
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public void setInstanceStateStopped(String processInstanceId) {
    WkfInstance wkfInstance = wkfInstanceRepository.findByInstanceId(processInstanceId);
    if (wkfInstance == null) {
      return;
    }
    wkfInstance.setStatusSelect(WkfInstanceRepository.STATUS_STOPPED);
    wkfInstanceRepository.save(wkfInstance);
  }
}
