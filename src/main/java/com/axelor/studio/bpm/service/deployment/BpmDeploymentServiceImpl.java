/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.deployment;

import com.axelor.common.ObjectUtils;
import com.axelor.db.tenants.TenantModule;
import com.axelor.db.tenants.TenantResolver;
import com.axelor.i18n.I18n;
import com.axelor.inject.Beans;
import com.axelor.meta.MetaFiles;
import com.axelor.meta.db.MetaAttrs;
import com.axelor.meta.db.MetaFile;
import com.axelor.meta.db.repo.MetaFileRepository;
import com.axelor.meta.db.repo.MetaJsonModelRepository;
import com.axelor.studio.bpm.exception.BpmExceptionMessage;
import com.axelor.studio.bpm.service.WkfCommonService;
import com.axelor.studio.bpm.service.app.AppBpmService;
import com.axelor.studio.bpm.service.execution.WkfInstanceService;
import com.axelor.studio.bpm.service.execution.WkfUserActionService;
import com.axelor.studio.bpm.service.init.ProcessEngineService;
import com.axelor.studio.bpm.service.init.WkfProcessApplication;
import com.axelor.studio.db.WkfInstance;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.WkfProcess;
import com.axelor.studio.db.WkfProcessConfig;
import com.axelor.studio.db.WkfTaskConfig;
import com.axelor.studio.db.WkfTaskMenu;
import com.axelor.studio.db.repo.WkfInstanceRepository;
import com.axelor.studio.db.repo.WkfModelRepository;
import com.axelor.studio.db.repo.WkfProcessRepository;
import com.axelor.studio.db.repo.WkfTaskConfigRepository;
import com.axelor.studio.db.repo.WkfTaskMenuRepository;
import com.axelor.team.db.TeamTask;
import com.axelor.team.db.repo.TeamTaskRepository;
import com.google.common.base.Strings;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import java.io.ByteArrayInputStream;
import java.lang.invoke.MethodHandles;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.tuple.Pair;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.impl.bpmn.parser.BpmnParser;
import org.camunda.bpm.engine.migration.MigrationPlan;
import org.camunda.bpm.engine.migration.MigrationPlanBuilder;
import org.camunda.bpm.engine.repository.Deployment;
import org.camunda.bpm.engine.repository.DeploymentBuilder;
import org.camunda.bpm.engine.repository.ProcessDefinition;
import org.camunda.bpm.engine.repository.ProcessDefinitionQuery;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.runtime.ProcessInstanceQuery;
import org.camunda.bpm.engine.task.Task;
import org.camunda.bpm.model.bpmn.Bpmn;
import org.camunda.bpm.model.bpmn.BpmnModelInstance;
import org.camunda.bpm.model.bpmn.impl.BpmnModelConstants;
import org.camunda.bpm.model.bpmn.instance.BaseElement;
import org.camunda.bpm.model.bpmn.instance.ExtensionElements;
import org.camunda.bpm.model.bpmn.instance.MultiInstanceLoopCharacteristics;
import org.camunda.bpm.model.dmn.Dmn;
import org.camunda.bpm.model.xml.ModelInstance;
import org.camunda.bpm.model.xml.impl.ModelBuilderImpl;
import org.camunda.bpm.model.xml.instance.ModelElementInstance;
import org.camunda.bpm.model.xml.type.ModelElementType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class BpmDeploymentServiceImpl implements BpmDeploymentService {

  protected static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private static final int INSTANCE_BATCH_SIZE = 50;
  private static final int TASK_BATCH_SIZE = 100;

  private static final int INSTANCE_MIGRATION_MAX_PERCENTAGE = 30;
  private static final int TASK_CANCELLATION_START_PERCENTAGE = 30;
  private static final int TASK_CANCELLATION_MAX_PERCENTAGE = 60;
  private static final int TASK_CREATION_START_PERCENTAGE = 60;
  private static final int COMPLETE_PERCENTAGE = 100;

  protected WkfProcessRepository wkfProcessRepository;
  protected MetaJsonModelRepository metaJsonModelRepository;
  protected MetaAttrsService metaAttrsService;
  protected WkfCommonService wkfService;
  protected MetaFileRepository metaFileRepo;
  protected WkfProcessApplication wkfProcessApplication;
  protected WkfNodeService wkfNodeService;
  protected WkfModelRepository wkfModelRepository;
  protected ProcessEngineService processEngineService;
  protected WkfInstanceService wkfInstanceService;
  protected WkfTaskMenuRepository taskMenuRepo;
  protected WkfTaskConfigRepository taskConfigRepo;
  protected WkfUserActionService wkfUserActionService;
  protected WkfInstanceRepository wkfInstanceRepository;

  protected WkfModel sourceModel;
  protected WkfModel targetModel;

  protected Map<String, Object> migrationMap;

  @Inject
  public BpmDeploymentServiceImpl(
      WkfProcessRepository wkfProcessRepository,
      MetaJsonModelRepository metaJsonModelRepository,
      MetaAttrsService metaAttrsService,
      WkfCommonService wkfService,
      MetaFileRepository metaFileRepo,
      WkfProcessApplication wkfProcessApplication,
      WkfNodeService wkfNodeService,
      WkfModelRepository wkfModelRepository,
      WkfInstanceService wkfInstanceService,
      WkfTaskMenuRepository taskMenuRepo,
      WkfUserActionService WkfUserActionService,
      WkfTaskConfigRepository taskConfigRepo,
      ProcessEngineService processEngineService,
      WkfInstanceRepository wkfInstanceRepository) {

    this.wkfProcessRepository = wkfProcessRepository;
    this.metaJsonModelRepository = metaJsonModelRepository;
    this.metaAttrsService = metaAttrsService;
    this.wkfService = wkfService;
    this.metaFileRepo = metaFileRepo;
    this.wkfProcessApplication = wkfProcessApplication;
    this.wkfNodeService = wkfNodeService;
    this.wkfModelRepository = wkfModelRepository;
    this.wkfInstanceService = wkfInstanceService;
    this.processEngineService = processEngineService;
    this.taskMenuRepo = taskMenuRepo;
    this.taskConfigRepo = taskConfigRepo;
    this.wkfUserActionService = WkfUserActionService;
    this.wkfInstanceRepository = wkfInstanceRepository;
  }

  @Override
  public void deploy(
      WkfModel sourceModel,
      WkfModel targetModel,
      Map<String, Object> migrationMap,
      boolean upgradeToLatest) {

    if (targetModel.getDiagramXml() == null) {
      return;
    }
    setIsMigrationOnGoing(targetModel, true);
    this.sourceModel = ObjectUtils.isEmpty(sourceModel) ? targetModel : sourceModel;
    this.targetModel = targetModel;
    this.migrationMap = migrationMap;

    ProcessEngine engine = processEngineService.getEngine();

    String key = targetModel.getId() + ".bpmn";
    BpmnModelInstance bpmInstance =
        Bpmn.readModelFromStream(new ByteArrayInputStream(targetModel.getDiagramXml().getBytes()));

    DeploymentBuilder deploymentBuilder =
        engine
            .getRepositoryService()
            .createDeployment()
            .addModelInstance(key, bpmInstance)
            .source(key);

    String tenantId = null;
    if (TenantModule.isEnabled()) {
      tenantId =
          TenantResolver.currentTenantIdentifier() + ":" + TenantResolver.currentTenantHost();
      deploymentBuilder = deploymentBuilder.tenantId(tenantId);
    }

    Set<MetaFile> dmnFiles = targetModel.getDmnFileSet();
    if (dmnFiles != null) {
      addDmn(deploymentBuilder, dmnFiles);
    }

    Map<String, String> processMap =
        deployProcess(engine, deploymentBuilder, bpmInstance, tenantId, upgradeToLatest);

    List<MetaAttrs> metaAttrsList =
        wkfNodeService.extractNodes(targetModel, bpmInstance, processMap);

    targetModel.setStatusSelect(WkfModelRepository.STATUS_ON_GOING);

    saveWkfModel(targetModel);

    metaAttrsService.saveMetaAttrs(metaAttrsList, targetModel.getId());

    if (migrationMap == null) {
      setIsMigrationOnGoing(targetModel, false);
      return;
    }

    migrateInstanceTasks(engine);

    String isRemove =
        Optional.ofNullable(migrationMap.get("removeOldVersionMenu"))
            .map(Objects::toString)
            .orElse("false");
    if (isRemove.equals("true") && targetModel.getPreviousVersion() != null) {
      removePreviousVersionMenus(targetModel.getPreviousVersion());
    }
    setIsMigrationOnGoing(targetModel, false);
    // Throw migration error after all migrations have been processed
    Boolean isMigrationError = (Boolean) migrationMap.get("isMigrationError");
    if (isMigrationError != null && isMigrationError) {
      throw new IllegalStateException(I18n.get(BpmExceptionMessage.MIGRATION_ERR));
    }
  }

  @Transactional(rollbackOn = Exception.class)
  @Override
  public void setIsMigrationOnGoing(WkfModel wkfModel, boolean isMigrationOnGoing) {
    wkfModel = wkfModelRepository.find(wkfModel.getId());
    if (wkfModel != null) {
      wkfModel.setIsMigrationOnGoing(isMigrationOnGoing);
      wkfModelRepository.save(wkfModel);
    }
  }

  @Transactional(rollbackOn = Exception.class)
  protected WkfModel saveWkfModel(WkfModel wkfModel) {
    return wkfModelRepository.save(wkfModel);
  }

  protected Map<String, String> deployProcess(
      ProcessEngine engine,
      DeploymentBuilder deploymentBuilder,
      BpmnModelInstance bpmInstance,
      String tenantId,
      boolean force) {
    Deployment deployment = deploymentBuilder.deploy();

    Map<String, String> processMap = new HashMap<>();

    ProcessDefinitionQuery query =
        engine
            .getRepositoryService()
            .createProcessDefinitionQuery()
            .deploymentId(deployment.getId());

    if (tenantId != null) {
      query.tenantIdIn(tenantId);
    }
    List<ProcessDefinition> definitions = query.list();

    Map<String, WkfProcess> migrationProcessMap = new HashMap<>();

    log.debug("Definitions deployed: {}", definitions.size());
    definitions.forEach(
        definition -> {
          WkfProcess process =
              wkfProcessRepository
                  .all()
                  .filter(
                      "self.name = ? and self.wkfModel.id = ?",
                      definition.getKey(),
                      targetModel.getId())
                  .fetchOne();

          if (process == null) {
            process = new WkfProcess();
            targetModel.addWkfProcessListItem(process);
          }

          process.setName(definition.getKey());
          process.setProcessId(definition.getId());
          process.setDescription(definition.getName());

          addProcessConfig(bpmInstance, process);
          addDisplayProperties(bpmInstance, process);

          processMap.put(definition.getKey(), definition.getId());
          migrationProcessMap.put(definition.getId(), process);
        });

    if (sourceModel.getDeploymentId() != null && migrationMap != null) {
      migrateRunningInstances(
          sourceModel.getDeploymentId(), engine, definitions, migrationProcessMap, force);
    }
    targetModel.setDeploymentId(deployment.getId());

    engine
        .getManagementService()
        .registerProcessApplication(deployment.getId(), wkfProcessApplication.getReference());

    return processMap;
  }

  protected void migrateRunningInstances(
      String oldDeploymentId,
      ProcessEngine engine,
      List<ProcessDefinition> definitions,
      Map<String, WkfProcess> migrationProcessMap,
      boolean upgradeToLatest) {

    final AtomicBoolean isMigrationError = new AtomicBoolean(false);
    if (upgradeToLatest) {
      List<WkfInstance> wkfInstances = getAllSourceModelInstances(sourceModel);

      Set<String> processDefinitionIds = extractProcessDefinitionIds(wkfInstances);

      addLatestProcessDefinition(processDefinitionIds, oldDeploymentId, engine);

      List<ProcessDefinition> sortedDefinitions =
          getSortedProcessDefinitions(processDefinitionIds, engine);

      migrateInstancesToLatest(sortedDefinitions, engine, isMigrationError);
    }

    List<ProcessDefinition> oldDefinitions =
        engine
            .getRepositoryService()
            .createProcessDefinitionQuery()
            .deploymentId(oldDeploymentId)
            .list();
    log.debug("Old definition size {}", oldDefinitions.size());
    oldDefinitions.forEach(
        oldDefinition ->
            definitions.stream()
                .filter(newDefinition -> oldDefinition.getKey().equals(newDefinition.getKey()))
                .forEach(
                    newDefinition -> {
                      log.debug(
                          "Migrating from old definition: {}, to new definition: {}",
                          oldDefinition.getKey(),
                          newDefinition.getKey());

                      MigrationPlan plan =
                          createMigrationPlan(engine, oldDefinition, newDefinition);

                      if (plan == null) {
                        return;
                      }

                      computeMigrationInstances(
                          engine,
                          oldDefinition,
                          newDefinition,
                          plan,
                          migrationProcessMap,
                          isMigrationError);
                    }));
    migrationMap.put("isMigrationError", isMigrationError.get());
  }

  private AtomicBoolean computeMigrationInstances(
      ProcessEngine engine,
      ProcessDefinition oldDefinition,
      ProcessDefinition newDefinition,
      MigrationPlan plan,
      Map<String, WkfProcess> migrationProcessMap,
      AtomicBoolean isMigrationError) {

    String instanceId = (String) migrationMap.get("instanceId");
    ProcessInstanceQuery query =
        engine
            .getRuntimeService()
            .createProcessInstanceQuery()
            .processDefinitionId(oldDefinition.getId());

    long nbInstances = query.count();
    int migratedInstances = 0;
    int UnmigratedInstances = 0;
    List<String> migratedInstancesIds = new ArrayList<>();
    if (nbInstances < 1) {
      log.debug("Process instances to migrate: {}", nbInstances);
      return isMigrationError;
    }

    List<String> processInstanceIds = new ArrayList<>();
    if (Strings.isNullOrEmpty(instanceId)) {

      query.list().forEach(it -> processInstanceIds.add(it.getId()));
    } else if (query.processInstanceId(instanceId) != null) {
      processInstanceIds.add(instanceId);
    }

    log.debug("Process instances to migrate: {}", processInstanceIds.size());
    migrationMap.put("totalInstancesToMigrate", processInstanceIds.size());
    // Progress bar on deploy
    Boolean isWebSocketSupported =
        Beans.get(AppBpmService.class).getAppBpm().getUseProgressDeploymentBar();
    String sessionId = null;
    if (isWebSocketSupported) {
      WkfProcess firstProcess = migrationProcessMap.values().stream().findFirst().orElse(null);

      if (firstProcess != null && firstProcess.getWkfModel() != null) {
        Long modelId = firstProcess.getWkfModel().getId();

        sessionId =
            BpmDeploymentWebSocket.sessionMap.keySet().stream()
                .filter(key -> key.equals(String.valueOf(modelId))) // assuming keys are Strings
                .findFirst()
                .orElse(null);
      } else {
        sessionId = null;
      }
    }

    WkfProcess targetProcess = migrationProcessMap.get(newDefinition.getId());
    int iterationNumber = 1;
    List<String> pendingSaves = new ArrayList<>();

    for (String processInstanceId : processInstanceIds) {
      try {
        engine
            .getRuntimeService()
            .newMigration(plan)
            .processInstanceIds(processInstanceId)
            .execute();

        pendingSaves.add(processInstanceId);
        migratedInstances++;
        migratedInstancesIds.add(processInstanceId);

        if (pendingSaves.size() >= INSTANCE_BATCH_SIZE) {
          wkfInstanceService.batchUpdateProcessInstances(
              targetProcess, pendingSaves, WkfInstanceRepository.STATUS_MIGRATED_SUCCESSFULLY);
          pendingSaves.clear();
        }

      } catch (Exception e) {
        isMigrationError.set(true);
        wkfInstanceService.updateProcessInstance(
            null, processInstanceId, WkfInstanceRepository.STATUS_MIGRATION_ERROR);
        UnmigratedInstances++;
      }

      if (isWebSocketSupported && sessionId != null) {
        BpmDeploymentWebSocket.updateProgress(
            sessionId,
            calculateInstanceMigrationPercentage(iterationNumber, processInstanceIds.size()));
      }
      iterationNumber++;
    }

    if (!pendingSaves.isEmpty()) {
      wkfInstanceService.batchUpdateProcessInstances(
          targetProcess, pendingSaves, WkfInstanceRepository.STATUS_MIGRATED_SUCCESSFULLY);
    }
    migrationMap.put("successfulMigrations", migratedInstances);
    migrationMap.put("failedMigrations", UnmigratedInstances);
    migrationMap.put("migratedInstances", migratedInstancesIds);
    return isMigrationError;
  }

  @Transactional(rollbackOn = Exception.class)
  protected void saveTasks(List<TeamTask> newTasks) {
    TeamTaskRepository teamTaskRepository = Beans.get(TeamTaskRepository.class);
    for (TeamTask teamTask : newTasks) {
      teamTaskRepository.save(teamTask);
    }
  }

  @Transactional(rollbackOn = Exception.class)
  protected void cancelTasksBatch(List<Pair<String, String>> taskBatch) {
    wkfUserActionService.updateTasksBatchStatus(taskBatch, "canceled");
  }

  protected int createMigratedTasks(
      List<Task> activeTasks,
      String processInstanceId,
      String sessionId,
      int totalTasks,
      int processedTasks,
      boolean isWebSocketSupported) {

    if (activeTasks == null || activeTasks.isEmpty()) {
      log.debug("No active tasks to update for process instance: {}", processInstanceId);
      return processedTasks;
    }

    ProcessEngine processEngine = processEngineService.getEngine();
    List<TeamTask> newTasks = new ArrayList<>();

    for (Task task : activeTasks) {
      try {
        WkfTaskConfig wkfTaskConfig =
            taskConfigRepo
                .all()
                .autoFlush(false)
                .filter(
                    "self.name = ? AND self.processId = ?",
                    task.getTaskDefinitionKey(),
                    task.getProcessDefinitionId())
                .fetchOne();

        if (wkfTaskConfig == null) {
          continue;
        }

        Optional.ofNullable(
                wkfUserActionService.createTeamTaskFromMigration(
                    task, wkfTaskConfig, processInstanceId, processEngine))
            .ifPresent(newTasks::add);

        processedTasks++;

        if (isWebSocketSupported && sessionId != null && totalTasks > 0) {
          int percentage = calculateTaskCreationPercentage(processedTasks, totalTasks);
          BpmDeploymentWebSocket.updateProgress(sessionId, percentage);
        }

        if (newTasks.size() >= TASK_BATCH_SIZE) {
          saveTasks(newTasks);
          newTasks.clear();
        }

      } catch (Exception e) {
        processedTasks++;
        log.error(
            "Error migrating TeamTask for task '{}' in process '{}': {}",
            task.getTaskDefinitionKey(),
            processInstanceId,
            e.getMessage(),
            e);
      }
    }

    if (!newTasks.isEmpty()) {
      saveTasks(newTasks);
      newTasks.clear();
    }

    return processedTasks;
  }

  protected List<Task> getActiveTasks(ProcessEngine engine, String processInstanceId) {
    return engine
        .getTaskService()
        .createTaskQuery()
        .active()
        .processInstanceId(processInstanceId)
        .list();
  }

  protected MigrationPlan createMigrationPlan(
      ProcessEngine engine, ProcessDefinition oldDefinition, ProcessDefinition newDefinition) {

    Map<String, String> processMap = (Map<String, String>) migrationMap.get(newDefinition.getKey());
    if (processMap == null) {
      return null;
    }

    MigrationPlanBuilder planBuilder =
        engine
            .getRuntimeService()
            .createMigrationPlan(oldDefinition.getId(), newDefinition.getId());

    MigrationPlan plan;

    ModelInstance modelInstance =
        engine.getRepositoryService().getBpmnModelInstance(oldDefinition.getId());

    processMap
        .keySet()
        .forEach(
            key -> {
              long count =
                  engine
                      .getHistoryService()
                      .createHistoricActivityInstanceQuery()
                      .processDefinitionId(oldDefinition.getId())
                      .activityId(key)
                      .unfinished()
                      .count();

              if (count == 0) {
                return;
              }

              ModelElementInstance instance = modelInstance.getModelElementById(key);

              String value = processMap.get(key);
              if (value != null) {
                if (instance
                    .getElementType()
                    .getTypeName()
                    .equals(BpmnModelConstants.BPMN_ELEMENT_INTERMEDIATE_CATCH_EVENT)) {
                  planBuilder.mapActivities(key, value).updateEventTrigger();
                } else {
                  planBuilder.mapActivities(key, value);
                }
              }

              Collection<MultiInstanceLoopCharacteristics> childInstaces =
                  instance.getChildElementsByType(MultiInstanceLoopCharacteristics.class);

              if (childInstaces != null && !childInstaces.isEmpty()) {
                planBuilder.mapActivities(key + "#multiInstanceBody", value + "#multiInstanceBody");
              }
            });

    plan = planBuilder.build();

    return plan;
  }

  protected void addDmn(DeploymentBuilder deploymentBuilder, Set<MetaFile> dmnFiles) {
    dmnFiles.forEach(
        dmnFile ->
            deploymentBuilder.addModelInstance(
                dmnFile.getId() + ".dmn",
                Dmn.readModelFromFile(
                    MetaFiles.getPath(metaFileRepo.find(dmnFile.getId())).toFile())));
  }

  protected void addDisplayProperties(BpmnModelInstance bpmInstance, WkfProcess process) {

    BaseElement processElement = bpmInstance.getModelElementById(process.getName());

    if (processElement != null) {
      wkfService.addProperties(
          WkfPropertyMapper.PROCESS_DISPLAY_PROPERTIES, process, processElement);
    }
  }

  protected void addProcessConfig(BpmnModelInstance bpmInstance, WkfProcess process) {

    BaseElement processElement = bpmInstance.getModelElementById(process.getName());
    ExtensionElements extensionElements = processElement.getExtensionElements();
    if (extensionElements == null) {
      return;
    }

    ModelBuilderImpl builderImpl = new ModelBuilderImpl(null);
    ModelElementType processConfigType =
        builderImpl.defineGenericType(
            "processConfiguration", BpmnParser.CAMUNDA_BPMN_EXTENSIONS_NS);
    List<ModelElementInstance> processConfigElements =
        extensionElements.getElementsQuery().filterByType(processConfigType).list();
    if (processConfigElements == null || processConfigElements.isEmpty()) {
      return;
    }

    ModelElementInstance processConfigElement = processConfigElements.getFirst();

    Map<String, WkfProcessConfig> configMap = createConfigMap(process);

    ModelElementType processConfigParamType =
        builderImpl.defineGenericType(
            "processConfigurationParameter", BpmnParser.CAMUNDA_BPMN_EXTENSIONS_NS);
    Collection<ModelElementInstance> configParams =
        processConfigElement.getChildElementsByType(processConfigParamType);

    configParams.forEach(
        configParam -> {
          WkfProcessConfig config = getProcessCofig(configMap, configParam);
          config =
              (WkfProcessConfig)
                  wkfService.addProperties(
                      WkfPropertyMapper.PROCESS_CONFIG_PROPERTIES, config, configParam);
          process.addWkfProcessConfigListItem(config);
        });
  }

  protected Map<String, WkfProcessConfig> createConfigMap(WkfProcess process) {

    Map<String, WkfProcessConfig> configMap = new HashMap<>();

    if (process.getWkfProcessConfigList() != null) {
      process
          .getWkfProcessConfigList()
          .forEach(
              config -> {
                if (config.getMetaModel() != null) {
                  configMap.put(config.getMetaModel().getName(), config);
                } else if (config.getMetaJsonModel() != null) {
                  configMap.put(config.getMetaJsonModel().getName(), config);
                }
              });
      process.clearWkfProcessConfigList();
    }

    return configMap;
  }

  protected WkfProcessConfig getProcessCofig(
      Map<String, WkfProcessConfig> configMap, ModelElementInstance configParam) {

    String metaModel =
        configParam.getAttributeValueNs(BpmnParser.CAMUNDA_BPMN_EXTENSIONS_NS, "metaModel");
    if (configMap.containsKey(metaModel)) {
      return configMap.get(metaModel);
    }

    String jsonModel =
        configParam.getAttributeValueNs(BpmnParser.CAMUNDA_BPMN_EXTENSIONS_NS, "metaJsonModel");
    if (configMap.containsKey(jsonModel)) {
      return configMap.get(jsonModel);
    }

    return new WkfProcessConfig();
  }

  @Transactional
  protected void removePreviousVersionMenus(WkfModel wkfModel) {
    List<WkfTaskConfig> taskConfigs =
        taskConfigRepo.all().filter("self.wkfModel = ?1", wkfModel).fetch();

    if (CollectionUtils.isNotEmpty(taskConfigs)) {
      List<WkfTaskMenu> taskMenus =
          taskMenuRepo.all().filter("self.wkfTaskConfig IN (?)", taskConfigs).fetch();

      taskMenus.forEach(taskMenu -> taskMenuRepo.remove(taskMenu));
    }
  }

  @Override
  public void forceMigrate(WkfProcess process) {
    String sourceProcessDefinitionKey = process.getName();

    ProcessDefinition latestProcessDefinition =
        processEngineService
            .getEngine()
            .getRepositoryService()
            .createProcessDefinitionQuery()
            .processDefinitionKey(sourceProcessDefinitionKey)
            .latestVersion()
            .singleResult();

    if (latestProcessDefinition == null) {
      return;
    }

    List<ProcessInstance> processInstances =
        processEngineService
            .getEngine()
            .getRuntimeService()
            .createProcessInstanceQuery()
            .processDefinitionKey(sourceProcessDefinitionKey)
            .list();

    log.debug("Instances to migrate: {}", processInstances.size());

    for (ProcessInstance instance : processInstances) {
      String currentProcessDefinitionId = instance.getProcessDefinitionId();

      if (currentProcessDefinitionId.equals(latestProcessDefinition.getId())) {
        continue;
      }
      try {
        MigrationPlan migrationPlan =
            processEngineService
                .getEngine()
                .getRuntimeService()
                .createMigrationPlan(currentProcessDefinitionId, latestProcessDefinition.getId())
                .mapEqualActivities()
                .build();

        processEngineService
            .getEngine()
            .getRuntimeService()
            .newMigration(migrationPlan)
            .processInstanceIds(instance.getId())
            .execute();
        log.debug("Migration done for instance {}", instance.getId());
      } catch (Exception e) {
        log.error("Instance not migrated {} : {}", instance.getId(), e.getMessage());
      }
    }
  }

  private List<WkfInstance> getAllSourceModelInstances(WkfModel sourceModel) {
    return wkfInstanceRepository
        .all()
        .filter(" self.wkfProcess.wkfModel.id = ?", sourceModel.getId())
        .fetch();
  }

  private Set<String> extractProcessDefinitionIds(List<WkfInstance> wkfInstances) {
    return wkfInstances.stream()
        .map(
            instance -> {
              String instanceName = instance.getName();
              String[] parts = instanceName.split(" : ");
              return parts.length > 1 ? parts[0].trim() : null;
            })
        .filter(Objects::nonNull)
        .collect(Collectors.toSet());
  }

  private void addLatestProcessDefinition(
      Set<String> processDefinitionIds, String oldDeploymentId, ProcessEngine engine) {
    List<ProcessDefinition> latestDefinition =
        engine
            .getRepositoryService()
            .createProcessDefinitionQuery()
            .deploymentId(oldDeploymentId)
            .orderByProcessDefinitionVersion()
            .desc()
            .list();
    if (latestDefinition != null) {
      for (ProcessDefinition processDefinition : latestDefinition) {
        processDefinitionIds.add(processDefinition.getId());
      }
    }
  }

  private List<ProcessDefinition> getSortedProcessDefinitions(
      Set<String> processDefinitionIds, ProcessEngine engine) {
    return processDefinitionIds.stream()
        .map(
            id ->
                engine
                    .getRepositoryService()
                    .createProcessDefinitionQuery()
                    .processDefinitionId(id)
                    .singleResult())
        .filter(Objects::nonNull)
        .sorted(Comparator.comparing(ProcessDefinition::getVersion))
        .collect(Collectors.toList());
  }

  private void migrateInstancesToLatest(
      List<ProcessDefinition> sortedDefinitions,
      ProcessEngine engine,
      AtomicBoolean isMigrationError) {
    sortedDefinitions.sort(Comparator.comparing(ProcessDefinition::getVersion));

    ProcessDefinition latestDefinition = sortedDefinitions.getLast();

    for (int i = 0; i < sortedDefinitions.size() - 1; i++) {
      ProcessDefinition fromVersion = sortedDefinitions.get(i);
      ProcessDefinition toVersion = sortedDefinitions.get(i + 1);

      if (latestDefinition != null && latestDefinition.getId().equals(fromVersion.getId())) {
        continue;
      }

      String processKey = fromVersion.getKey();

      log.debug(
          "Migrating from version {} to version {} for process key {}",
          fromVersion.getVersion(),
          toVersion.getVersion(),
          processKey);

      MigrationPlan plan =
          engine
              .getRuntimeService()
              .createMigrationPlan(fromVersion.getId(), toVersion.getId())
              .mapEqualActivities()
              .build();

      if (plan != null) {
        migrateInstancesToNextProcessDefinition(
            engine, plan, fromVersion, toVersion, isMigrationError);
      }
    }

    log.debug("Completed migration to the latest version for all instances.");
  }

  private void migrateInstancesToNextProcessDefinition(
      ProcessEngine engine,
      MigrationPlan plan,
      ProcessDefinition fromVersion,
      ProcessDefinition toVersion,
      AtomicBoolean isMigrationError) {
    List<ProcessInstance> instancesToMigrate =
        engine
            .getRuntimeService()
            .createProcessInstanceQuery()
            .processDefinitionId(fromVersion.getId())
            .list();

    for (ProcessInstance instance : instancesToMigrate) {
      try {
        engine
            .getRuntimeService()
            .newMigration(plan)
            .processInstanceIds(instance.getId())
            .execute();
      } catch (Exception e) {
        isMigrationError.set(true);
        log.error(
            "Migration failed for instance {} from version {} to {} for process key {}",
            instance.getId(),
            fromVersion.getVersion(),
            toVersion.getVersion(),
            fromVersion.getKey(),
            e);
      }
    }

    if (isMigrationError.get()) {
      throw new IllegalStateException(I18n.get(BpmExceptionMessage.MIGRATION_ERR));
    }
  }

  @SuppressWarnings("unchecked")
  private void migrateInstanceTasks(ProcessEngine engine) {
    List<String> migratedInstances = (List<String>) migrationMap.get("migratedInstances");

    Boolean isWebSocketSupported =
        Beans.get(AppBpmService.class).getAppBpm().getUseProgressDeploymentBar();
    final String sessionId;
    if (isWebSocketSupported && targetModel != null) {
      Long modelId = targetModel.getId();
      sessionId =
          BpmDeploymentWebSocket.sessionMap.keySet().stream()
              .filter(key -> key.equals(String.valueOf(modelId)))
              .findFirst()
              .orElse(null);
    } else {
      sessionId = null;
    }

    if (isWebSocketSupported && sessionId != null) {
      BpmDeploymentWebSocket.updateProgress(sessionId, TASK_CANCELLATION_START_PERCENTAGE);
    }

    if (migratedInstances == null || migratedInstances.isEmpty()) {
      if (isWebSocketSupported && sessionId != null) {
        BpmDeploymentWebSocket.updateProgress(sessionId, COMPLETE_PERCENTAGE);
      }
      return;
    }

    int totalTasks = 0;
    for (String instanceId : migratedInstances) {
      List<Task> activeTasks = getActiveTasks(engine, instanceId);
      if (activeTasks != null) {
        totalTasks += activeTasks.size();
      }
    }
    if (totalTasks == 0) {
      if (isWebSocketSupported && sessionId != null) {
        BpmDeploymentWebSocket.updateProgress(sessionId, COMPLETE_PERCENTAGE);
      }
      return;
    }

    int processedTasks = 0;
    List<Pair<String, String>> tasksToCancel = new ArrayList<>();

    for (String instanceId : migratedInstances) {
      try {
        List<Task> activeTasks = getActiveTasks(engine, instanceId);
        if (activeTasks == null || activeTasks.isEmpty()) {
          continue;
        }

        for (Task task : activeTasks) {
          tasksToCancel.add(Pair.of(instanceId, task.getTaskDefinitionKey()));
          processedTasks++;

          if (isWebSocketSupported && sessionId != null && totalTasks > 0) {
            int percentage = calculateTaskCancellationPercentage(processedTasks, totalTasks);
            BpmDeploymentWebSocket.updateProgress(sessionId, percentage);
          }

          if (tasksToCancel.size() >= TASK_BATCH_SIZE) {
            cancelTasksBatch(tasksToCancel);
            tasksToCancel.clear();
          }
        }

      } catch (Exception e) {
        log.error("Error while preparing cancel list for instance: {}", instanceId, e);
      }
    }

    if (!tasksToCancel.isEmpty()) {
      cancelTasksBatch(tasksToCancel);
      tasksToCancel.clear();
    }

    if (isWebSocketSupported && sessionId != null) {
      BpmDeploymentWebSocket.updateProgress(sessionId, TASK_CREATION_START_PERCENTAGE);
    }

    int createdTasks = 0;
    for (String instanceId : migratedInstances) {
      try {
        List<Task> activeTasks = getActiveTasks(engine, instanceId);
        if (activeTasks == null || activeTasks.isEmpty()) {
          continue;
        }

        createdTasks =
            createMigratedTasks(
                activeTasks, instanceId, sessionId, totalTasks, createdTasks, isWebSocketSupported);
      } catch (Exception e) {
        log.error("Error while creating migrated tasks for instance: {}", instanceId, e);
      }
    }

    if (isWebSocketSupported && sessionId != null) {
      BpmDeploymentWebSocket.updateProgress(sessionId, COMPLETE_PERCENTAGE);
    }
  }

  /** Calculate percentage for instance migration (0-30%) */
  private int calculateInstanceMigrationPercentage(double part, double whole) {
    return (int) ((part / whole) * INSTANCE_MIGRATION_MAX_PERCENTAGE);
  }

  /** Calculate percentage for task cancellation (30-60%) */
  private int calculateTaskCancellationPercentage(double part, double whole) {
    int range = TASK_CANCELLATION_MAX_PERCENTAGE - TASK_CANCELLATION_START_PERCENTAGE;
    return TASK_CANCELLATION_START_PERCENTAGE + (int) ((part / whole) * range);
  }

  /** Calculate percentage for task creation (60-100%) */
  private int calculateTaskCreationPercentage(double part, double whole) {
    int range = COMPLETE_PERCENTAGE - TASK_CREATION_START_PERCENTAGE;
    return TASK_CREATION_START_PERCENTAGE + (int) ((part / whole) * range);
  }
}
