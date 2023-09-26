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
package com.axelor.studio.bpm.service.deployment;

import com.axelor.common.ObjectUtils;
import com.axelor.db.tenants.TenantModule;
import com.axelor.db.tenants.TenantResolver;
import com.axelor.i18n.I18n;
import com.axelor.meta.MetaFiles;
import com.axelor.meta.db.MetaAttrs;
import com.axelor.meta.db.MetaFile;
import com.axelor.meta.db.repo.MetaFileRepository;
import com.axelor.meta.db.repo.MetaJsonModelRepository;
import com.axelor.studio.bpm.exception.BpmExceptionMessage;
import com.axelor.studio.bpm.service.WkfCommonService;
import com.axelor.studio.bpm.service.execution.WkfInstanceService;
import com.axelor.studio.bpm.service.init.ProcessEngineService;
import com.axelor.studio.bpm.service.init.WkfProcessApplication;
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
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import java.io.ByteArrayInputStream;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;
import org.apache.commons.collections.CollectionUtils;
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

  protected Logger log = LoggerFactory.getLogger(BpmDeploymentServiceImpl.class);

  protected WkfProcessRepository wkfProcessRepository;
  protected MetaJsonModelRepository metaJsonModelRepository;
  protected MetaAttrsService metaAttrsService;
  protected WkfCommonService wkfService;
  protected MetaFileRepository metaFileRepo;
  protected WkfProcessApplication wkfProcessApplication;
  protected WkfNodeService wkfNodeService;
  protected WkfModelRepository wkfModelRepository;
  protected ProcessEngineService processEngineService;

  @Inject protected WkfTaskConfigRepository taskConfigRepo;

  @Inject protected WkfTaskMenuRepository taskMenuRepo;

  @Inject protected WkfInstanceService wkfInstanceService;

  @Inject protected WkfModelRepository wkfModelRepo;

  protected WkfModel sourceModel;
  protected WkfModel targetModel;

  protected Map<String, Map<String, String>> migrationMap;

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
      ProcessEngineService processEngineService) {

    this.wkfProcessRepository = wkfProcessRepository;
    this.metaJsonModelRepository = metaJsonModelRepository;
    this.metaAttrsService = metaAttrsService;
    this.wkfService = wkfService;
    this.metaFileRepo = metaFileRepo;
    this.wkfProcessApplication = wkfProcessApplication;
    this.wkfNodeService = wkfNodeService;
    this.wkfModelRepository = wkfModelRepository;
    this.processEngineService = processEngineService;
  }

  @Override
  public void deploy(
      WkfModel sourceModel, WkfModel targetModel, Map<String, Map<String, String>> migrationMap) {

    if (targetModel.getDiagramXml() == null) {
      return;
    }

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
        deployProcess(engine, deploymentBuilder, bpmInstance, tenantId);

    List<MetaAttrs> metaAttrsList =
        wkfNodeService.extractNodes(targetModel, bpmInstance, processMap);

    saveWkfModel(targetModel);

    metaAttrsService.saveMetaAttrs(metaAttrsList, targetModel.getId());

    if (migrationMap == null) {
      return;
    }

    String isRemove = migrationMap.get("props").get("removeOldVersionMenu");
    if (isRemove.equals("true") && targetModel.getPreviousVersion() != null) {
      removePreviousVersionMenus(targetModel.getPreviousVersion());
    }
  }

  @Transactional(rollbackOn = Exception.class)
  protected WkfModel saveWkfModel(WkfModel wkfModel) {
    return wkfModelRepo.save(wkfModel);
  }

  protected Map<String, String> deployProcess(
      ProcessEngine engine,
      DeploymentBuilder deploymentBuilder,
      BpmnModelInstance bpmInstance,
      String tenantId) {

    Deployment deployment = deploymentBuilder.deploy();

    Map<String, String> processMap = new HashMap<String, String>();

    ProcessDefinitionQuery query =
        engine
            .getRepositoryService()
            .createProcessDefinitionQuery()
            .deploymentId(deployment.getId());

    if (tenantId != null) {
      query.tenantIdIn(tenantId);
    }
    List<ProcessDefinition> definitions = query.list();

    Map<String, WkfProcess> migrationProcessMap = new HashMap<String, WkfProcess>();

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
          sourceModel.getDeploymentId(), engine, definitions, migrationProcessMap);
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
      Map<String, WkfProcess> migrationProcessMap) {

    List<ProcessDefinition> oldDefinitions =
        engine
            .getRepositoryService()
            .createProcessDefinitionQuery()
            .deploymentId(oldDeploymentId)
            .list();

    final AtomicBoolean isMigrationError = new AtomicBoolean(false);
    log.debug("Old definition size " + oldDefinitions.size());
    oldDefinitions.forEach(
        oldDefinition ->
            definitions.stream()
                .filter(newDefinition -> oldDefinition.getKey().equals(newDefinition.getKey()))
                .forEach(
                    newDefinition -> {
                      log.debug(
                          "Migrating from old defintion: {}, to new definition: {}",
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
    if (isMigrationError.get()) {
      throw new IllegalStateException(I18n.get(BpmExceptionMessage.MIGRATION_ERR));
    }
  }

  private AtomicBoolean computeMigrationInstances(
      ProcessEngine engine,
      ProcessDefinition oldDefinition,
      ProcessDefinition newDefinition,
      MigrationPlan plan,
      Map<String, WkfProcess> migrationProcessMap,
      AtomicBoolean isMigrationError) {

    ProcessInstanceQuery query =
        engine
            .getRuntimeService()
            .createProcessInstanceQuery()
            .processDefinitionId(oldDefinition.getId());

    long nbInstances = query.count();
    log.debug("Process instances to migrate: {}", nbInstances);

    if (nbInstances < 1) {
      return isMigrationError;
    }

    WkfProcess targetProcess = migrationProcessMap.get(newDefinition.getId());

    List<ProcessInstance> processInstances = query.list();

    for (ProcessInstance instance : processInstances) {
      try {
        engine
            .getRuntimeService()
            .newMigration(plan)
            .processInstanceIds(instance.getId())
            .execute();

        wkfInstanceService.updateProcessInstance(
            targetProcess, instance.getId(), WkfInstanceRepository.STATUS_MIGRATED_SUCCESSFULLY);

      } catch (Exception e) {
        isMigrationError.set(true);
        wkfInstanceService.updateProcessInstance(
            null, instance.getId(), WkfInstanceRepository.STATUS_MIGRATION_ERROR);
      }
    }
    return isMigrationError;
  }

  protected MigrationPlan createMigrationPlan(
      ProcessEngine engine, ProcessDefinition oldDefinition, ProcessDefinition newDefinition) {

    Map<String, String> processMap = migrationMap.get(newDefinition.getKey());
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
    if (processConfigElements == null || processConfigElements.size() == 0) {
      return;
    }

    ModelElementInstance processConfigElement = processConfigElements.get(0);

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

    Map<String, WkfProcessConfig> configMap = new HashMap<String, WkfProcessConfig>();

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
}
