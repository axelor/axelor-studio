/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.dmn.service;

import com.axelor.meta.db.MetaJsonModel;
import com.axelor.meta.db.MetaModel;
import com.axelor.meta.db.repo.MetaJsonModelRepository;
import com.axelor.meta.db.repo.MetaModelRepository;
import com.axelor.studio.bpm.service.init.ProcessEngineService;
import com.axelor.studio.db.DmnField;
import com.axelor.studio.db.DmnTable;
import com.axelor.studio.db.WkfDmnModel;
import com.axelor.studio.db.repo.WkfDmnModelRepository;
import com.google.inject.persist.Transactional;
import jakarta.inject.Inject;
import java.io.ByteArrayInputStream;
import java.lang.invoke.MethodHandles;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.repository.DeploymentBuilder;
import org.camunda.bpm.model.dmn.Dmn;
import org.camunda.bpm.model.dmn.DmnModelInstance;
import org.camunda.bpm.model.dmn.instance.DecisionTable;
import org.camunda.bpm.model.dmn.instance.Definitions;
import org.camunda.bpm.model.dmn.instance.Output;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DmnDeploymentServiceImpl implements DmnDeploymentService {

  protected static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  protected WkfDmnModelRepository wkfDmnModelRepo;
  protected ProcessEngineService processEngineService;
  protected MetaModelRepository metaModelRepo;
  protected MetaJsonModelRepository metaJsonModelRepo;

  @Inject
  public DmnDeploymentServiceImpl(
      WkfDmnModelRepository wkfDmnModelRepo,
      ProcessEngineService processEngineService,
      MetaModelRepository metaModelRepository,
      MetaJsonModelRepository metaJsonModelRepo) {
    this.wkfDmnModelRepo = wkfDmnModelRepo;
    this.processEngineService = processEngineService;
    this.metaModelRepo = metaModelRepository;
    this.metaJsonModelRepo = metaJsonModelRepo;
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public void deploy(WkfDmnModel wkfDmnModel) {

    if (wkfDmnModel.getDiagramXml() == null) {
      return;
    }

    ProcessEngine engine = processEngineService.getEngine();

    String key = wkfDmnModel.getId() + ".dmn";
    DmnModelInstance dmnModelInstance =
        Dmn.readModelFromStream(new ByteArrayInputStream(wkfDmnModel.getDiagramXml().getBytes()));

    DeploymentBuilder deploymentBuilder =
        engine.getRepositoryService().createDeployment().addModelInstance(key, dmnModelInstance);

    deploymentBuilder.deploy();

    setModels(wkfDmnModel, dmnModelInstance);
    setDecisionTables(wkfDmnModel, dmnModelInstance);

    wkfDmnModelRepo.save(wkfDmnModel);
  }

  protected void setModels(WkfDmnModel wkfDmnModel, DmnModelInstance dmnModelInstance) {

    Definitions definitions = dmnModelInstance.getDefinitions();

    String metaModels = definitions.getAttributeValueNs(definitions.getNamespace(), "metaModels");
    String jsonModels =
        definitions.getAttributeValueNs(definitions.getNamespace(), "metaJsonModels");

    if (metaModels != null) {

      List<String> models = Arrays.asList(metaModels.split(","));
      Set<MetaModel> metaModelSet =
          new HashSet<>(
              models.stream()
                  .map(modelName -> metaModelRepo.findByName(modelName))
                  .filter(Objects::nonNull)
                  .collect(Collectors.toSet()));
      wkfDmnModel.setMetaModelSet(metaModelSet);

    } else if (jsonModels != null) {

      List<String> models = Arrays.asList(jsonModels.split(","));
      Set<MetaJsonModel> jsonModelSet =
          new HashSet<>(
              models.stream()
                  .map(modelName -> metaJsonModelRepo.findByName(modelName))
                  .filter(Objects::nonNull)
                  .collect(Collectors.toSet()));
      wkfDmnModel.setJsonModelSet(jsonModelSet);

    } else {
      wkfDmnModel.setMetaModelSet(null);
      wkfDmnModel.setJsonModelSet(null);
    }
  }

  protected void setDecisionTables(WkfDmnModel wkfDmnModel, DmnModelInstance dmnModelInstance) {

    Map<String, DmnTable> dmnTableMap = new HashMap<>();

    if (wkfDmnModel.getDmnTableList() != null) {
      dmnTableMap =
          wkfDmnModel.getDmnTableList().stream()
              .collect(Collectors.toMap(DmnTable::getDecisionId, dmnTable -> dmnTable));
    }
    wkfDmnModel.clearDmnTableList();

    Collection<DecisionTable> tables = dmnModelInstance.getModelElementsByType(DecisionTable.class);

    for (DecisionTable table : tables) {

      String decisionId = table.getParentElement().getAttributeValue("id");
      String decisionName = table.getParentElement().getAttributeValue("name");
      DmnTable dmnTable = dmnTableMap.get(decisionId);
      log.debug("Find decision table for id: {}, found: {}", decisionId, dmnTable);
      if (dmnTable == null) {
        dmnTable = new DmnTable();
        dmnTable.setWkfDmnModel(wkfDmnModel);
      }
      dmnTable.setName(decisionName);
      dmnTable.setDecisionId(decisionId);
      setDmnField(table, dmnTable);
      wkfDmnModel.addDmnTableListItem(dmnTable);
    }
  }

  protected void setDmnField(DecisionTable decisionTable, DmnTable dmnTable) {

    Map<String, DmnField> outputFieldMap = new HashMap<>();
    if (dmnTable.getOutputDmnFieldList() != null) {
      outputFieldMap =
          dmnTable.getOutputDmnFieldList().stream()
              .collect(Collectors.toMap(DmnField::getName, dmnField -> dmnField));
    }
    dmnTable.clearOutputDmnFieldList();

    for (Output output : decisionTable.getOutputs()) {
      DmnField field = outputFieldMap.get(output.getName());
      log.debug("Find output for name: {}, found: {}", output.getName(), field);
      if (field == null) {
        field = new DmnField();
        field.setOutputDmnTable(dmnTable);
        field.setName(output.getName());
        field.setField(output.getName());
      }
      field.setFieldType(output.getTypeRef());
      dmnTable.addOutputDmnFieldListItem(field);
    }
  }
}
