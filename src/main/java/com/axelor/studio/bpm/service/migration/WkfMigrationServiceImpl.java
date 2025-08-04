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
package com.axelor.studio.bpm.service.migration;

import com.axelor.db.JPA;
import com.axelor.studio.bpm.service.WkfModelService;
import com.axelor.studio.bpm.service.deployment.BpmDeploymentService;
import com.axelor.studio.db.WkfMigration;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.repo.WkfMigrationRepository;
import com.axelor.studio.db.repo.WkfModelRepository;
import com.axelor.utils.helpers.ExceptionHelper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import java.io.ByteArrayInputStream;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.camunda.bpm.model.bpmn.Bpmn;
import org.camunda.bpm.model.bpmn.BpmnModelInstance;
import org.camunda.bpm.model.bpmn.instance.FlowNode;
import org.camunda.bpm.model.bpmn.instance.Process;

public class WkfMigrationServiceImpl implements WkfMigrationService {

  protected BpmDeploymentService bpmDeploymentService;

  protected WkfMigrationRepository wkfMigrationRepo;

  protected WkfModelService wkfModelService;

  protected WkfModelRepository wkfModelRepo;

  @Inject
  public WkfMigrationServiceImpl(
      BpmDeploymentService bpmDeploymentService,
      WkfMigrationRepository wkfMigrationRepo,
      WkfModelService wkfModelService,
      WkfModelRepository wkfModelRepo) {
    this.bpmDeploymentService = bpmDeploymentService;
    this.wkfMigrationRepo = wkfMigrationRepo;
    this.wkfModelService = wkfModelService;
    this.wkfModelRepo = wkfModelRepo;
  }

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
    boolean upgradeToLatest = migration.getUpgradeAllInstances();

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
            Map<String, Object> targetNodeMap =
                (Map) Optional.ofNullable(node.get("selected")).orElse(null);
            String targetNodeId =
                Optional.ofNullable(targetNodeMap).map(m -> (String) m.get("nodeId")).orElse(null);
            nodeMap.put(sourceNodeId, targetNodeId);
          });
      migrationMap.put(processId, nodeMap);
    }

    if (targetModel.getStatusSelect() < WkfModelRepository.STATUS_ON_GOING) {
      wkfModelService.start(sourceModel, targetModel);
    }

    migrationMap.put("removeOldVersionMenu", migration.getRemoveOldVersionMenu());
    migrationMap.put("instanceId", contextMap.get("instanceId"));

    bpmDeploymentService.deploy(sourceModel, targetModel, migrationMap, upgradeToLatest);
    migration.setTotalInstancesToMigrate((Integer) migrationMap.get("totalInstancesToMigrate"));
    migration.setSuccessfulMigrations((Integer) migrationMap.get("successfulMigrations"));
    migration.setFailedMigrations((Integer) migrationMap.get("failedMigrations"));

    try {
      migration.setMapping(new ObjectMapper().writeValueAsString(contextMap));
    } catch (JsonProcessingException e) {
      ExceptionHelper.error(e);
    }
    saveMigration(migration);
  }

  @Transactional
  protected WkfMigration saveMigration(WkfMigration wkfMigration) {
    return wkfMigrationRepo.save(wkfMigration);
  }
}
