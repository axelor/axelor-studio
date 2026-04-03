/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.deployment;

import com.axelor.db.tenants.TenantModule;
import com.axelor.db.tenants.TenantResolver;
import com.axelor.meta.MetaFiles;
import com.axelor.meta.db.MetaAttrs;
import com.axelor.meta.db.MetaFile;
import com.axelor.meta.db.repo.MetaFileRepository;
import com.axelor.meta.db.repo.MetaJsonModelRepository;
import com.axelor.studio.bpm.dto.DeploymentResult;
import com.axelor.studio.bpm.service.WkfCommonService;
import com.axelor.studio.bpm.service.authorization.BpmAuthorizationService;
import com.axelor.studio.bpm.service.authorization.BpmPermissionService;
import com.axelor.studio.bpm.service.identity.WkfIdentityService;
import com.axelor.studio.bpm.service.init.ProcessEngineService;
import com.axelor.studio.bpm.service.init.WkfProcessApplication;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.WkfProcess;
import com.axelor.studio.db.WkfProcessConfig;
import com.axelor.studio.db.repo.WkfModelRepository;
import com.axelor.studio.db.repo.WkfProcessRepository;
import com.google.inject.persist.Transactional;
import jakarta.inject.Inject;
import java.io.ByteArrayInputStream;
import java.lang.invoke.MethodHandles;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.impl.bpmn.parser.BpmnParser;
import org.camunda.bpm.engine.repository.Deployment;
import org.camunda.bpm.engine.repository.DeploymentBuilder;
import org.camunda.bpm.engine.repository.ProcessDefinition;
import org.camunda.bpm.engine.repository.ProcessDefinitionQuery;
import org.camunda.bpm.model.bpmn.Bpmn;
import org.camunda.bpm.model.bpmn.BpmnModelInstance;
import org.camunda.bpm.model.bpmn.instance.BaseElement;
import org.camunda.bpm.model.bpmn.instance.ExtensionElements;
import org.camunda.bpm.model.dmn.Dmn;
import org.camunda.bpm.model.xml.impl.ModelBuilderImpl;
import org.camunda.bpm.model.xml.instance.ModelElementInstance;
import org.camunda.bpm.model.xml.type.ModelElementType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class BpmDeploymentServiceImpl implements BpmDeploymentService {

  protected static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  protected WkfProcessRepository wkfProcessRepository;
  protected MetaJsonModelRepository metaJsonModelRepository;
  protected MetaAttrsService metaAttrsService;
  protected WkfCommonService wkfService;
  protected MetaFileRepository metaFileRepo;
  protected WkfProcessApplication wkfProcessApplication;
  protected WkfNodeService wkfNodeService;
  protected WkfModelRepository wkfModelRepository;
  protected ProcessEngineService processEngineService;
  protected WkfIdentityService identityService;
  protected BpmPermissionService bpmPermissionService;
  protected BpmAuthorizationService bpmAuthorizationService;

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
      ProcessEngineService processEngineService,
      WkfIdentityService identityService,
      BpmPermissionService bpmPermissionService,
      BpmAuthorizationService bpmAuthorizationService) {

    this.wkfProcessRepository = wkfProcessRepository;
    this.metaJsonModelRepository = metaJsonModelRepository;
    this.metaAttrsService = metaAttrsService;
    this.wkfService = wkfService;
    this.metaFileRepo = metaFileRepo;
    this.wkfProcessApplication = wkfProcessApplication;
    this.wkfNodeService = wkfNodeService;
    this.wkfModelRepository = wkfModelRepository;
    this.processEngineService = processEngineService;
    this.identityService = identityService;
    this.bpmPermissionService = bpmPermissionService;
    this.bpmAuthorizationService = bpmAuthorizationService;
  }

  @Override
  public DeploymentResult deploy(WkfModel targetModel) {

    if (targetModel.getDiagramXml() == null) {
      return null;
    }

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
      tenantId = TenantResolver.currentTenantIdentifier();
      deploymentBuilder = deploymentBuilder.tenantId(tenantId);
    }

    Set<MetaFile> dmnFiles = targetModel.getDmnFileSet();
    if (dmnFiles != null) {
      addDmn(deploymentBuilder, dmnFiles);
    }

    DeploymentResult result =
        deployProcess(targetModel, engine, deploymentBuilder, bpmInstance, tenantId);

    // Reload targetModel after deployment
    targetModel = wkfModelRepository.find(targetModel.getId());

    List<MetaAttrs> metaAttrsList =
        wkfNodeService.extractNodes(targetModel, bpmInstance, result.getProcessMap());

    targetModel.setStatusSelect(WkfModelRepository.STATUS_ON_GOING);

    saveWkfModel(targetModel);

    bpmPermissionService.syncPermissions(targetModel);
    bpmAuthorizationService.invalidateCache(targetModel);

    metaAttrsService.saveMetaAttrs(metaAttrsList, targetModel.getId());

    syncIdentities(targetModel);

    return result;
  }

  @Transactional(rollbackOn = Exception.class)
  protected WkfModel saveWkfModel(WkfModel wkfModel) {
    return wkfModelRepository.save(wkfModel);
  }

  /**
   * Synchronizes identities to Camunda after deployment.
   *
   * @param model the workflow model
   */
  protected void syncIdentities(WkfModel model) {
    try {
      log.info("Synchronizing identities for model: {}", model.getCode());
      identityService.syncModelIdentities(model);
    } catch (IllegalStateException e) {
      log.error("Identity synchronization failed: {}", e.getMessage(), e);
      model.setSyncStatus(WkfModelRepository.SYNC_STATUS_ERROR);
      model.setSyncLog("Synchronization failed: " + e.getMessage());
    }
  }

  protected DeploymentResult deployProcess(
      WkfModel targetModel,
      ProcessEngine engine,
      DeploymentBuilder deploymentBuilder,
      BpmnModelInstance bpmInstance,
      String tenantId) {
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

    // Save targetModel (with new processes) while still managed
    saveWkfModel(targetModel);

    targetModel.setDeploymentId(deployment.getId());

    engine
        .getManagementService()
        .registerProcessApplication(deployment.getId(), wkfProcessApplication.getReference());

    // Derive oldDeploymentId from previous version (null for first deploy)
    String oldDeploymentId =
        targetModel.getPreviousVersion() != null
            ? targetModel.getPreviousVersion().getDeploymentId()
            : null;

    return new DeploymentResult(
        deployment.getId(), processMap, migrationProcessMap, oldDeploymentId, definitions);
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
}
