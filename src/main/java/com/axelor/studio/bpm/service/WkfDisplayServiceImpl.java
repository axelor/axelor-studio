/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service;

import com.axelor.auth.AuthUtils;
import com.axelor.auth.db.User;
import com.axelor.db.JPA;
import com.axelor.db.Model;
import com.axelor.meta.CallMethod;
import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.studio.bpm.service.execution.WkfInstanceService;
import com.axelor.studio.bpm.service.init.ProcessEngineService;
import com.axelor.studio.db.WkfInstance;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.WkfProcess;
import com.axelor.studio.db.WkfTaskConfig;
import com.axelor.studio.db.repo.WkfInstanceRepository;
import com.axelor.studio.db.repo.WkfTaskConfigRepository;
import com.google.common.base.Joiner;
import com.google.inject.Inject;
import java.lang.invoke.MethodHandles;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.camunda.bpm.engine.ActivityTypes;
import org.camunda.bpm.engine.HistoryService;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.history.HistoricActivityInstance;
import org.camunda.bpm.engine.history.HistoricProcessInstanceQuery;
import org.camunda.bpm.engine.history.HistoricVariableInstance;
import org.camunda.bpm.engine.history.HistoricVariableInstanceQuery;
import org.camunda.bpm.model.bpmn.BpmnModelInstance;
import org.camunda.bpm.model.bpmn.instance.Process;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class WkfDisplayServiceImpl implements WkfDisplayService {

  protected static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  protected ProcessEngineService engineService;

  protected WkfInstanceService wkfInstanceService;

  protected WkfTaskConfigRepository wkfTaskConfigRepository;

  protected WkfInstanceRepository wkfInstanceRepo;

  @Inject
  public WkfDisplayServiceImpl(
      ProcessEngineService engineService,
      WkfInstanceService wkfInstanceService,
      WkfTaskConfigRepository wkfTaskConfigRepository,
      WkfInstanceRepository wkfInstanceRepo) {
    this.engineService = engineService;
    this.wkfInstanceService = wkfInstanceService;
    this.wkfTaskConfigRepository = wkfTaskConfigRepository;
    this.wkfInstanceRepo = wkfInstanceRepo;
  }

  @Override
  @CallMethod
  public String getInstanceUrl(WkfInstance wkfInstance) {

    try {

      ProcessEngine engine = engineService.getEngine();

      String processInstanceId = wkfInstance.getInstanceId();
      List<String> activeIds = getActivityIds(processInstanceId);

      Map<String, Integer> activityCountMap = new HashMap<>();
      getActivityPassCount(wkfInstance.getInstanceId(), activityCountMap);

      WkfProcess wkfProcess = wkfInstance.getWkfProcess();
      BpmnModelInstance modelInstance =
          engine.getRepositoryService().getBpmnModelInstance(wkfProcess.getProcessId());

      Iterator<Process> processIter =
          modelInstance.getModelElementsByType(Process.class).iterator();
      HistoricVariableInstanceQuery variableQuery =
          engine
              .getHistoryService()
              .createHistoricVariableInstanceQuery()
              .processInstanceId(processInstanceId);

      while (processIter.hasNext()) {
        Process process = processIter.next();
        if (process.getId().equals(wkfProcess.getName())) {
          continue;
        }
        HistoricVariableInstance variableInstance =
            variableQuery.variableName(process.getId()).singleResult();
        if (variableInstance != null) {
          activeIds.addAll(getActivityIds((String) variableInstance.getValue()));
          getActivityPassCount((String) variableInstance.getValue(), activityCountMap);
        }
      }

      String activityCount =
          activityCountMap.keySet().stream()
              .map(it -> it + ":" + activityCountMap.get(it))
              .collect(Collectors.joining(","));

      log.trace("Active node ids: {}", activeIds);

      String url =
          engineService
              .getWkfViewerUrl()
              .formatted(
                  "instanceId=" + wkfInstance.getInstanceId(),
                  Joiner.on(",").join(activeIds),
                  activityCount,
                  null);
      if (wkfInstance.getInstanceError()) {
        url =
            engineService
                .getWkfViewerUrl()
                .formatted(
                    "instanceId=" + wkfInstance.getInstanceId(),
                    Joiner.on(",").join(activeIds),
                    activityCount,
                    wkfInstance.getNode());
      }
      log.debug("Url created: {}", url);

      return url;
    } catch (Exception e) {

    }

    return null;
  }

  protected List<String> getTerminatedActivityIds(String instanceId) {

    HistoricProcessInstanceQuery query =
        engineService.getEngine().getHistoryService().createHistoricProcessInstanceQuery();
    query.processInstanceId(instanceId);
    query.completed();

    List<String> activityIds = new ArrayList<>();

    query.list().forEach(instance -> activityIds.add(instance.getEndActivityId()));

    return activityIds;
  }

  protected List<String> getActivityIds(String instanceId) {

    RuntimeService runtimeService = engineService.getEngine().getRuntimeService();

    List<String> activityIds = getTerminatedActivityIds(instanceId);

    if (wkfInstanceService.isActiveProcessInstance(instanceId, runtimeService)) {
      activityIds.addAll(runtimeService.getActiveActivityIds(instanceId));
    }

    return activityIds;
  }

  protected void getActivityPassCount(String instanceId, Map<String, Integer> activityCountMap) {

    HistoryService historyService = engineService.getEngine().getHistoryService();
    if (instanceId == null) {
      return;
    }

    List<HistoricActivityInstance> activityInstances =
        historyService.createHistoricActivityInstanceQuery().processInstanceId(instanceId).list();

    Set<String> multiInstanceIds = new HashSet<>();
    activityInstances.forEach(
        historicActivityInstance -> {
          int count = 0;
          String activityId = historicActivityInstance.getActivityId();

          if (historicActivityInstance
              .getActivityType()
              .equals(ActivityTypes.MULTI_INSTANCE_BODY)) {
            activityId = activityId.split("#")[0];
            if (!multiInstanceIds.contains(activityId)) {
              multiInstanceIds.add(activityId);
              activityCountMap.remove(activityId);
            }
          } else if (multiInstanceIds.contains(activityId)) {
            return;
          }
          if (activityCountMap.containsKey(activityId)) {
            count = activityCountMap.get(activityId);
          }
          count += 1;
          activityCountMap.put(activityId, count);
        });
  }

  @Override
  @CallMethod
  public String getWkfNodeCountUrl(WkfModel wkfModel) {

    try {

      Map<String, Integer> activityCountMap = new HashMap<>();

      List<WkfInstance> instances =
          wkfInstanceRepo
              .all()
              .filter("self.wkfProcess.wkfModel.id = ?1", wkfModel.getId())
              .fetch();

      log.trace("Total process instances: {}", instances.size());
      instances.forEach(
          instance -> getActivityPassCount(instance.getInstanceId(), activityCountMap));

      log.trace("Count map: {}", activityCountMap);
      String activityCount =
          activityCountMap.keySet().stream()
              .map(it -> it + ":" + activityCountMap.get(it))
              .collect(Collectors.joining(","));

      String url =
          engineService
              .getWkfViewerUrl()
              .formatted("id=" + wkfModel.getId(), null, activityCount, null);

      log.trace("Url created: {}", url);

      return url;

    } catch (Exception e) {

    }

    return null;
  }

  @Override
  public List<Map<String, Object>> getWkfStatus(Class<?> klass, Long id) {

    List<Map<String, Object>> statusList = new ArrayList<>();

    if (klass == null || id == null) {
      return statusList;
    }

    Model model = (Model) JPA.em().find(klass, id);

    if (model == null) {
      return statusList;
    }

    String processInstanceId = model.getProcessInstanceId();

    log.debug("Display wkf nodes of processInstanceId: {}", processInstanceId);

    if (processInstanceId != null) {

      WkfInstance wkfInstance = wkfInstanceRepo.findByInstanceId(processInstanceId);

      if (wkfInstance == null) {
        return statusList;
      }

      String klassName = klass.getSimpleName();
      if (model instanceof MetaJsonRecord metaJsonRecord) {
        klassName = metaJsonRecord.getJsonModel();
      }

      boolean valid = isValidDisplayModel(klassName, wkfInstance);

      log.debug("Is valid model to display wkf nodes : {}", valid);
      if (!valid) {
        return statusList;
      }

      addActiveNodes(statusList, wkfInstance, klassName);
    }

    return statusList;
  }

  protected boolean isValidDisplayModel(String klassName, WkfInstance wkfInstance) {

    WkfProcess wkfProcess = wkfInstance.getWkfProcess();

    if (wkfProcess.getDisplayStatus()) {
      if (wkfProcess.getDisplayOnModels() != null) {
        return containsModel(wkfProcess.getDisplayOnModels(), klassName);
      }
      return true;
    }

    return false;
  }

  protected boolean containsModel(String models, String klassName) {

    if (models != null) {
      for (String model : models.split(",")) {
        if (model.equals(klassName)) {
          return true;
        }
      }
    }

    return false;
  }

  protected void addActiveNodes(
      List<Map<String, Object>> statusList, WkfInstance wkfInstance, String klassName) {

    HistoryService historyService = engineService.getEngine().getHistoryService();

    List<HistoricActivityInstance> activeNodes =
        historyService
            .createHistoricActivityInstanceQuery()
            .processInstanceId(wkfInstance.getInstanceId())
            .unfinished()
            .list();

    if (activeNodes.isEmpty()) {

      List<String> terminatedNodeIds = getTerminatedActivityIds(wkfInstance.getInstanceId());
      if (!terminatedNodeIds.isEmpty()) {
        activeNodes =
            historyService
                .createHistoricActivityInstanceQuery()
                .activityId(terminatedNodeIds.getFirst())
                .processInstanceId(wkfInstance.getInstanceId())
                .list();
      }
    }

    User activeUser = AuthUtils.getUser();

    activeNodes.forEach(
        node -> {
          boolean valid = isValidNode(node.getActivityId(), wkfInstance.getWkfProcess(), klassName);
          if (!valid) {
            return;
          }
          String title = node.getActivityName();
          if (title == null) {
            title = node.getActivityId();
          }

          String color = wkfInstance.getWkfProcess().getWkfModel().getWkfStatusColor();
          if (color == null) {
            color = "green";
          }

          Map<String, Object> statusMap = new HashMap<>();
          statusMap.put("name", node.getActivityId());
          statusMap.put("title", title);
          statusMap.put("color", color);
          if (!activeUser.getNoHelp()) {
            WkfTaskConfig config =
                wkfTaskConfigRepository
                    .all()
                    .filter(
                        "self.name = ? and self.wkfModel.id = ?",
                        node.getActivityId(),
                        wkfInstance.getWkfProcess().getWkfModel().getId())
                    .fetchOne();
            if (config != null) {
              statusMap.put("help", config.getHelpText());
            }
          }
          statusList.add(statusMap);
        });
  }

  protected boolean isValidNode(String activityId, WkfProcess wkfProcess, String klassName) {

    WkfTaskConfig wkfTaskConfig =
        wkfTaskConfigRepository
            .all()
            .filter("self.processId = ?1 and self.name = ?2", wkfProcess.getProcessId(), activityId)
            .fetchOne();

    if (wkfTaskConfig != null && wkfTaskConfig.getDisplayStatus()) {
      if (wkfTaskConfig.getDisplayOnModels() != null) {
        return containsModel(wkfTaskConfig.getDisplayOnModels(), klassName);
      }
      return true;
    }

    return false;
  }
}
