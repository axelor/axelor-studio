/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.migration;

import com.axelor.db.JPA;
import com.axelor.i18n.I18n;
import com.axelor.inject.Beans;
import com.axelor.studio.bpm.dto.MigrationResult;
import com.axelor.studio.bpm.exception.BpmExceptionMessage;
import com.axelor.studio.bpm.service.WkfModelService;
import com.axelor.studio.bpm.service.app.AppBpmService;
import com.axelor.studio.bpm.service.deployment.BpmProgressWebSocket;
import com.axelor.studio.bpm.service.execution.WkfInstanceService;
import com.axelor.studio.bpm.service.execution.WkfUserActionService;
import com.axelor.studio.bpm.service.init.ProcessEngineService;
import com.axelor.studio.db.WkfInstance;
import com.axelor.studio.db.WkfMigration;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.WkfProcess;
import com.axelor.studio.db.WkfTaskConfig;
import com.axelor.studio.db.WkfTaskMenu;
import com.axelor.studio.db.repo.WkfInstanceRepository;
import com.axelor.studio.db.repo.WkfMigrationRepository;
import com.axelor.studio.db.repo.WkfModelRepository;
import com.axelor.studio.db.repo.WkfTaskConfigRepository;
import com.axelor.studio.db.repo.WkfTaskMenuRepository;
import com.axelor.team.db.TeamTask;
import com.axelor.team.db.repo.TeamTaskRepository;
import com.axelor.utils.helpers.ExceptionHelper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.base.Strings;
import com.google.inject.persist.Transactional;
import jakarta.inject.Inject;
import java.io.ByteArrayInputStream;
import java.lang.invoke.MethodHandles;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.tuple.Pair;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.migration.MigrationPlan;
import org.camunda.bpm.engine.migration.MigrationPlanBuilder;
import org.camunda.bpm.engine.repository.ProcessDefinition;
import org.camunda.bpm.engine.runtime.ProcessInstanceQuery;
import org.camunda.bpm.engine.task.Task;
import org.camunda.bpm.model.bpmn.Bpmn;
import org.camunda.bpm.model.bpmn.BpmnModelInstance;
import org.camunda.bpm.model.bpmn.impl.BpmnModelConstants;
import org.camunda.bpm.model.bpmn.instance.FlowNode;
import org.camunda.bpm.model.bpmn.instance.MultiInstanceLoopCharacteristics;
import org.camunda.bpm.model.bpmn.instance.Process;
import org.camunda.bpm.model.xml.ModelInstance;
import org.camunda.bpm.model.xml.instance.ModelElementInstance;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class WkfMigrationServiceImpl implements WkfMigrationService {

  protected static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  // --- Constants ---

  private static final int INSTANCE_BATCH_SIZE = 50;
  private static final int TASK_BATCH_SIZE = 100;

  private static final int INSTANCE_MIGRATION_MAX_PERCENTAGE = 30;
  private static final int TASK_CANCELLATION_START_PERCENTAGE = 30;
  private static final int TASK_CANCELLATION_MAX_PERCENTAGE = 60;
  private static final int TASK_CREATION_START_PERCENTAGE = 60;
  private static final int COMPLETE_PERCENTAGE = 100;

  // --- Injected dependencies ---

  protected WkfMigrationRepository wkfMigrationRepo;
  protected WkfModelService wkfModelService;
  protected WkfModelRepository wkfModelRepo;
  protected ProcessEngineService processEngineService;
  protected WkfInstanceService wkfInstanceService;
  protected WkfInstanceRepository wkfInstanceRepository;
  protected WkfUserActionService wkfUserActionService;
  protected WkfTaskConfigRepository taskConfigRepo;
  protected WkfTaskMenuRepository taskMenuRepo;

  @Inject
  public WkfMigrationServiceImpl(
      WkfMigrationRepository wkfMigrationRepo,
      WkfModelService wkfModelService,
      WkfModelRepository wkfModelRepo,
      ProcessEngineService processEngineService,
      WkfInstanceService wkfInstanceService,
      WkfInstanceRepository wkfInstanceRepository,
      WkfUserActionService wkfUserActionService,
      WkfTaskConfigRepository taskConfigRepo,
      WkfTaskMenuRepository taskMenuRepo) {
    this.wkfMigrationRepo = wkfMigrationRepo;
    this.wkfModelService = wkfModelService;
    this.wkfModelRepo = wkfModelRepo;
    this.processEngineService = processEngineService;
    this.wkfInstanceService = wkfInstanceService;
    this.wkfInstanceRepository = wkfInstanceRepository;
    this.wkfUserActionService = wkfUserActionService;
    this.taskConfigRepo = taskConfigRepo;
    this.taskMenuRepo = taskMenuRepo;
  }

  // =====================================================================
  // Public interface methods
  // =====================================================================

  @Override
  public Map<String, Object> generateNodeMap(WkfMigration migration) {
    WkfModel sourceVersion = migration.getSourceVersion();
    WkfModel targetVersion = migration.getTargetVersion();

    BpmnModelInstance sourceBpmInstance =
        Bpmn.readModelFromStream(
            new ByteArrayInputStream(sourceVersion.getDiagramXml().getBytes()));

    BpmnModelInstance targetBpmInstance =
        Bpmn.readModelFromStream(
            new ByteArrayInputStream(targetVersion.getDiagramXml().getBytes()));

    Collection<Process> processList = sourceBpmInstance.getModelElementsByType(Process.class);
    if (CollectionUtils.isEmpty(processList)) {
      return null;
    }

    Map<String, Object> _map = new HashMap<>();
    List<Map<String, Object>> _mapList = new ArrayList<>();

    for (Process process : processList) {
      Map<String, Object> processMap = new LinkedHashMap<>();

      List<Map<String, Object>> nodeMapList = new ArrayList<>();
      Collection<FlowNode> flowNodes = process.getChildElementsByType(FlowNode.class);

      Process targetProcess = targetBpmInstance.getModelElementById(process.getId());

      for (FlowNode node : flowNodes) {
        Map<String, Object> nodeMap = new LinkedHashMap<>();

        List<Map<String, Object>> optionMapList = getTargetNodes(targetProcess, node);

        nodeMap.put("nodeId", node.getId());
        nodeMap.put(
            "nodeName", StringUtils.isNotEmpty(node.getName()) ? node.getName() : node.getId());
        nodeMap.put("options", optionMapList);
        nodeMap.put(
            "selected",
            optionMapList.stream()
                .filter(m -> m.get("nodeId").equals(node.getId()))
                .findAny()
                .orElse(null));
        nodeMapList.add(nodeMap);
      }
      String processId = process.getId();
      String processName = process.getName();
      processId =
          StringUtils.isEmpty(processName) ? processId : processId + " (" + processName + ")";
      processMap.put("processId", processId);
      processMap.put("nodes", nodeMapList);
      _mapList.add(processMap);
    }
    _map.put("values", _mapList);
    _map.put("wkfMigrationId", migration.getId());
    return _map;
  }

  @SuppressWarnings("unchecked")
  @Override
  public List<Long> getTargetVersionIds(WkfModel sourceVersion) {

    return JPA.em()
        .createNativeQuery(
            "WITH RECURSIVE wm AS "
                + "(SELECT id, name, previous_version FROM studio_wkf_model WHERE id = :sourceVersionId "
                + "UNION ALL "
                + "SELECT m.id, m.name, m.previous_version FROM studio_wkf_model m "
                + "JOIN wm s ON s.id = m.previous_version) "
                + "SELECT id FROM wm WHERE id != :sourceVersionId")
        .setParameter("sourceVersionId", sourceVersion.getId())
        .getResultList();
  }

  @SuppressWarnings({"unchecked", "rawtypes"})
  @Override
  public void migrate(WkfMigration migration, Map<String, Object> contextMap) {

    List<Map<String, Object>> valuesMapList = (List<Map<String, Object>>) contextMap.get("values");

    WkfModel sourceModel = wkfModelRepo.find(migration.getSourceVersion().getId());
    WkfModel targetModel = wkfModelRepo.find(migration.getTargetVersion().getId());

    // Precondition: target must be already deployed
    if (targetModel.getStatusSelect() < WkfModelRepository.STATUS_ON_GOING) {
      throw new IllegalStateException(
          "Target model must be deployed before migration. Deploy the target model first.");
    }

    Map<String, Object> migrationMap = new HashMap<>();

    for (Map<String, Object> valMap : valuesMapList) {
      if (valMap.get("processId") == null) {
        continue;
      }
      String processId = (String) valMap.get("processId");

      Map<String, String> nodeMap = new LinkedHashMap<>();

      List<Map<String, Object>> nodes = (List<Map<String, Object>>) valMap.get("nodes");
      nodes.forEach(
          node -> {
            String sourceNodeId = (String) node.get("nodeId");
            Map<String, Object> targetNodeMap = (Map) node.get("selected");
            String targetNodeId =
                Optional.ofNullable(targetNodeMap).map(m -> (String) m.get("nodeId")).orElse(null);
            nodeMap.put(sourceNodeId, targetNodeId);
          });
      migrationMap.put(processId, nodeMap);
    }

    migrationMap.put("removeOldVersionMenu", migration.getRemoveOldVersionMenu());
    migrationMap.put("instanceId", contextMap.get("instanceId"));

    // Perform migration directly -- no longer delegates to bpmDeploymentService.deploy()
    MigrationResult migrationResult = new MigrationResult();
    setIsMigrationOnGoing(targetModel, true);
    try {
      ProcessEngine engine = processEngineService.getEngine();

      if (sourceModel.getDeploymentId() != null) {
        List<ProcessDefinition> definitions =
            engine
                .getRepositoryService()
                .createProcessDefinitionQuery()
                .deploymentId(targetModel.getDeploymentId())
                .list();

        Map<String, WkfProcess> migrationProcessMap = new HashMap<>();
        definitions.forEach(
            definition -> {
              WkfProcess process =
                  Beans.get(com.axelor.studio.db.repo.WkfProcessRepository.class)
                      .all()
                      .filter(
                          "self.name = ? and self.wkfModel.id = ?",
                          definition.getKey(),
                          targetModel.getId())
                      .fetchOne();
              if (process != null) {
                migrationProcessMap.put(definition.getId(), process);
              }
            });

        migrationResult =
            migrateRunningInstances(
                sourceModel.getDeploymentId(),
                engine,
                definitions,
                migrationProcessMap,
                sourceModel,
                migrationMap);

        migrateInstanceTasks(engine, targetModel);

        String isRemove =
            Optional.ofNullable(migrationMap.get("removeOldVersionMenu"))
                .map(Objects::toString)
                .orElse("false");
        if (isRemove.equals("true") && targetModel.getPreviousVersion() != null) {
          removePreviousVersionMenus(targetModel.getPreviousVersion());
        }

        // Throw migration error after all migrations have been processed
        if (migrationResult.isMigrationError()) {
          throw new IllegalStateException(I18n.get(BpmExceptionMessage.MIGRATION_ERR));
        }
      }
    } finally {
      setIsMigrationOnGoing(targetModel, false);
    }

    migration = wkfMigrationRepo.find(migration.getId());
    migration.setTotalInstancesToMigrate(migrationResult.getTotalInstancesToMigrate());
    migration.setSuccessfulMigrations(migrationResult.getSuccessfulMigrations());
    migration.setFailedMigrations(migrationResult.getFailedMigrations());

    try {
      migration.setMapping(new ObjectMapper().writeValueAsString(contextMap));
    } catch (JsonProcessingException e) {
      ExceptionHelper.error(e);
    }
    saveMigration(migration);
  }

  // =====================================================================
  // Core migration orchestration
  // =====================================================================

  @Override
  public MigrationResult migrateRunningInstances(
      String oldDeploymentId,
      ProcessEngine engine,
      List<ProcessDefinition> definitions,
      Map<String, WkfProcess> migrationProcessMap,
      WkfModel sourceModel,
      Map<String, Object> nodeMappings) {

    MigrationResult result = new MigrationResult();
    final AtomicBoolean isMigrationError = new AtomicBoolean(false);

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
                          createMigrationPlan(engine, oldDefinition, newDefinition, nodeMappings);

                      if (plan == null) {
                        return;
                      }

                      computeMigrationInstances(
                          engine,
                          oldDefinition,
                          newDefinition,
                          plan,
                          migrationProcessMap,
                          isMigrationError,
                          nodeMappings,
                          result);
                    }));
    if (isMigrationError.get()) {
      result.markMigrationError();
    }
    return result;
  }

  @Override
  public void migrateInstanceTasks(ProcessEngine engine, WkfModel targetModel) {
    List<WkfInstance> inProgressInstances =
        wkfInstanceRepository
            .all()
            .filter("self.wkfProcess.wkfModel = :model AND self.migrationStatusSelect = :status")
            .bind("model", targetModel)
            .bind("status", WkfInstanceRepository.STATUS_MIGRATION_IN_PROGRESS)
            .fetch();

    List<String> migratedInstances =
        inProgressInstances.stream().map(WkfInstance::getInstanceId).collect(Collectors.toList());

    Boolean isWebSocketSupported =
        Beans.get(AppBpmService.class).getAppBpm().getUseProgressDeploymentBar();
    final String sessionId;
    if (isWebSocketSupported && targetModel != null) {
      Long modelId = targetModel.getId();
      sessionId =
          BpmProgressWebSocket.sessionMap.keySet().stream()
              .filter(key -> key.equals(String.valueOf(modelId)))
              .findFirst()
              .orElse(null);
    } else {
      sessionId = null;
    }

    if (isWebSocketSupported && sessionId != null) {
      BpmProgressWebSocket.updateProgress(sessionId, TASK_CANCELLATION_START_PERCENTAGE);
    }

    if (migratedInstances.isEmpty()) {
      if (isWebSocketSupported && sessionId != null) {
        BpmProgressWebSocket.updateProgress(sessionId, COMPLETE_PERCENTAGE);
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
    // No active tasks — migration is trivially complete, update all instances to status 2
    if (totalTasks == 0) {
      wkfInstanceService.batchUpdateProcessInstances(
          null, migratedInstances, WkfInstanceRepository.STATUS_MIGRATED_SUCCESSFULLY);
      if (isWebSocketSupported && sessionId != null) {
        BpmProgressWebSocket.updateProgress(sessionId, COMPLETE_PERCENTAGE);
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
            BpmProgressWebSocket.updateProgress(sessionId, percentage);
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
      BpmProgressWebSocket.updateProgress(sessionId, TASK_CREATION_START_PERCENTAGE);
    }

    // Pass 2: create tasks + batch status-2 updates (crash-recovery safe)
    List<String> pendingStatusUpdates = new ArrayList<>();
    int createdTasks = 0;
    for (String instanceId : migratedInstances) {
      try {
        List<Task> activeTasks = getActiveTasks(engine, instanceId);
        if (activeTasks == null || activeTasks.isEmpty()) {
          // No tasks to create, but instance migration succeeded -- mark as done
          pendingStatusUpdates.add(instanceId);
        } else {
          createdTasks =
              createMigratedTasks(
                  activeTasks,
                  instanceId,
                  sessionId,
                  totalTasks,
                  createdTasks,
                  isWebSocketSupported);
          pendingStatusUpdates.add(instanceId);
        }

        if (pendingStatusUpdates.size() >= INSTANCE_BATCH_SIZE) {
          wkfInstanceService.batchUpdateProcessInstances(
              null, pendingStatusUpdates, WkfInstanceRepository.STATUS_MIGRATED_SUCCESSFULLY);
          pendingStatusUpdates.clear();
        }
      } catch (Exception e) {
        log.error("Error while creating migrated tasks for instance: {}", instanceId, e);
        // Instance stays at status 4 -- retryable on next run
      }
    }

    // Flush remaining status-2 batch
    if (!pendingStatusUpdates.isEmpty()) {
      wkfInstanceService.batchUpdateProcessInstances(
          null, pendingStatusUpdates, WkfInstanceRepository.STATUS_MIGRATED_SUCCESSFULLY);
    }

    if (isWebSocketSupported && sessionId != null) {
      BpmProgressWebSocket.updateProgress(sessionId, COMPLETE_PERCENTAGE);
    }
  }

  @Transactional(rollbackOn = Exception.class)
  @Override
  public void setIsMigrationOnGoing(WkfModel wkfModel, boolean isMigrationOnGoing) {
    wkfModel = wkfModelRepo.find(wkfModel.getId());
    if (wkfModel != null) {
      wkfModel.setIsMigrationOnGoing(isMigrationOnGoing);
      wkfModelRepo.save(wkfModel);
    }
  }

  @Transactional
  @Override
  public void removePreviousVersionMenus(WkfModel wkfModel) {
    List<WkfTaskConfig> taskConfigs =
        taskConfigRepo.all().filter("self.wkfModel = ?1", wkfModel).fetch();

    if (CollectionUtils.isNotEmpty(taskConfigs)) {
      List<WkfTaskMenu> taskMenus =
          taskMenuRepo.all().filter("self.wkfTaskConfig IN (?)", taskConfigs).fetch();

      taskMenus.forEach(taskMenu -> taskMenuRepo.remove(taskMenu));
    }
  }

  // =====================================================================
  // Instance migration
  // =====================================================================

  private void computeMigrationInstances(
      ProcessEngine engine,
      ProcessDefinition oldDefinition,
      ProcessDefinition newDefinition,
      MigrationPlan plan,
      Map<String, WkfProcess> migrationProcessMap,
      AtomicBoolean isMigrationError,
      Map<String, Object> nodeMappings,
      MigrationResult result) {

    String instanceId = (String) nodeMappings.get("instanceId");
    ProcessInstanceQuery query =
        engine
            .getRuntimeService()
            .createProcessInstanceQuery()
            .processDefinitionId(oldDefinition.getId());

    long nbInstances = query.count();
    int migratedInstances = 0;
    int unmigratedInstances = 0;
    if (nbInstances < 1) {
      log.debug("Process instances to migrate: {}", nbInstances);
      return;
    }

    List<String> processInstanceIds = new ArrayList<>();
    if (Strings.isNullOrEmpty(instanceId)) {

      query.list().forEach(it -> processInstanceIds.add(it.getId()));
    } else if (query.processInstanceId(instanceId) != null) {
      processInstanceIds.add(instanceId);
    }

    log.debug("Process instances to migrate: {}", processInstanceIds.size());
    result.setTotalInstancesToMigrate(processInstanceIds.size());
    // Progress bar on deploy
    Boolean isWebSocketSupported =
        Beans.get(AppBpmService.class).getAppBpm().getUseProgressDeploymentBar();
    String sessionId = null;
    if (isWebSocketSupported) {
      WkfProcess firstProcess = migrationProcessMap.values().stream().findFirst().orElse(null);

      if (firstProcess != null && firstProcess.getWkfModel() != null) {
        Long modelId = firstProcess.getWkfModel().getId();

        sessionId =
            BpmProgressWebSocket.sessionMap.keySet().stream()
                .filter(key -> key.equals(String.valueOf(modelId)))
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

        if (pendingSaves.size() >= INSTANCE_BATCH_SIZE) {
          wkfInstanceService.batchUpdateProcessInstances(
              targetProcess, pendingSaves, WkfInstanceRepository.STATUS_MIGRATION_IN_PROGRESS);
          pendingSaves.clear();
        }

      } catch (Exception e) {
        isMigrationError.set(true);
        wkfInstanceService.updateProcessInstance(
            null, processInstanceId, WkfInstanceRepository.STATUS_MIGRATION_ERROR);
        unmigratedInstances++;
      }

      if (isWebSocketSupported && sessionId != null) {
        BpmProgressWebSocket.updateProgress(
            sessionId,
            calculateInstanceMigrationPercentage(iterationNumber, processInstanceIds.size()));
      }
      iterationNumber++;
    }

    if (!pendingSaves.isEmpty()) {
      wkfInstanceService.batchUpdateProcessInstances(
          targetProcess, pendingSaves, WkfInstanceRepository.STATUS_MIGRATION_IN_PROGRESS);
    }
    result.setSuccessfulMigrations(migratedInstances);
    result.setFailedMigrations(unmigratedInstances);
  }

  // =====================================================================
  // Task migration
  // =====================================================================

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
          BpmProgressWebSocket.updateProgress(sessionId, percentage);
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

  protected List<Task> getActiveTasks(ProcessEngine engine, String processInstanceId) {
    return engine
        .getTaskService()
        .createTaskQuery()
        .active()
        .processInstanceId(processInstanceId)
        .list();
  }

  // =====================================================================
  // Helper / utility
  // =====================================================================

  @SuppressWarnings("unchecked")
  protected MigrationPlan createMigrationPlan(
      ProcessEngine engine,
      ProcessDefinition oldDefinition,
      ProcessDefinition newDefinition,
      Map<String, Object> migrationMap) {

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

  // =====================================================================
  // Progress calculation
  // =====================================================================

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

  // =====================================================================
  // Existing methods (unchanged)
  // =====================================================================

  private List<Map<String, Object>> getTargetNodes(Process targetProcess, FlowNode sourceNode) {

    List<Map<String, Object>> optionMapList = new ArrayList<>();

    if (targetProcess != null) {
      String nodeType = getType(sourceNode);
      Collection<FlowNode> targetNodes = targetProcess.getChildElementsByType(FlowNode.class);
      targetNodes.forEach(
          targetNode -> {
            if (getType(targetNode).equals(nodeType)) {
              Map<String, Object> optionMap = new HashMap<>();
              optionMap.put("nodeId", targetNode.getId());
              optionMap.put(
                  "nodeName",
                  StringUtils.isNotEmpty(targetNode.getName())
                      ? targetNode.getName()
                      : targetNode.getId());
              optionMapList.add(optionMap);
            }
          });
    }
    return optionMapList;
  }

  private String getType(FlowNode node) {
    String type = node.getElementType().getTypeName().toLowerCase();

    if (type.contains("task")) {
      return "task";
    } else if (type.contains("event")) {
      return "event";
    } else if (type.contains("gateway")) {
      return "gateway";
    } else if (type.contains("subprocess")) {
      return "subprocess";
    } else {
      return type;
    }
  }

  @Transactional
  protected WkfMigration saveMigration(WkfMigration wkfMigration) {
    return wkfMigrationRepo.save(wkfMigration);
  }
}
