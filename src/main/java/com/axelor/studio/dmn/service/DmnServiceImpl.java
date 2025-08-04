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
package com.axelor.studio.dmn.service;

import static com.axelor.utils.MetaJsonFieldType.JSON_MANY_TO_MANY;
import static com.axelor.utils.MetaJsonFieldType.JSON_MANY_TO_ONE;
import static com.axelor.utils.MetaJsonFieldType.JSON_ONE_TO_MANY;
import static com.axelor.utils.MetaJsonFieldType.MANY_TO_MANY;
import static com.axelor.utils.MetaJsonFieldType.MANY_TO_ONE;
import static com.axelor.utils.MetaJsonFieldType.ONE_TO_MANY;

import com.axelor.common.StringUtils;
import com.axelor.db.EntityHelper;
import com.axelor.db.JpaRepository;
import com.axelor.db.Model;
import com.axelor.db.mapper.Mapper;
import com.axelor.db.mapper.Property;
import com.axelor.meta.db.MetaJsonField;
import com.axelor.meta.db.MetaJsonModel;
import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.meta.db.repo.MetaJsonFieldRepository;
import com.axelor.studio.bpm.context.WkfContextHelper;
import com.axelor.studio.bpm.service.WkfCommonService;
import com.axelor.studio.bpm.service.init.ProcessEngineService;
import com.axelor.studio.db.DmnTable;
import com.axelor.studio.db.WkfDmnModel;
import com.axelor.studio.db.repo.DmnTableRepository;
import com.axelor.utils.helpers.ExceptionHelper;
import com.axelor.utils.helpers.context.FullContext;
import com.axelor.utils.helpers.context.FullContextHelper;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import java.lang.invoke.MethodHandles;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.RandomStringUtils;
import org.camunda.bpm.dmn.engine.DmnDecisionTableResult;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.repository.DecisionDefinition;
import org.camunda.bpm.model.dmn.DmnModelInstance;
import org.camunda.bpm.model.dmn.instance.DecisionTable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DmnServiceImpl implements DmnService {

  protected static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  protected WkfCommonService wkfCommonService;

  protected DmnTableRepository dmnTableRepo;

  protected MetaJsonFieldRepository metaJsonFieldRepo;

  protected ProcessEngineService processEngineService;

  @Inject
  public DmnServiceImpl(
      WkfCommonService wkfCommonService,
      DmnTableRepository dmnTableRepo,
      MetaJsonFieldRepository metaJsonFieldRepo,
      ProcessEngineService processEngineService) {
    this.wkfCommonService = wkfCommonService;
    this.dmnTableRepo = dmnTableRepo;
    this.metaJsonFieldRepo = metaJsonFieldRepo;
    this.processEngineService = processEngineService;
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public void executeDmn(String decisionDefinitionId, Model model) {

    ProcessEngine processEngine = processEngineService.getEngine();

    FullContext context = new FullContext(model);
    String varName = wkfCommonService.getVarName(EntityHelper.getEntity(model));
    Map<String, Object> modelMap = new HashMap<String, Object>();
    modelMap.put(varName, context);
    DmnDecisionTableResult dmnDecisionTableResult =
        processEngine
            .getDecisionService()
            .evaluateDecisionTableByKey(decisionDefinitionId, modelMap);

    List<Map<String, Object>> result = dmnDecisionTableResult.getResultList();
    DmnTable dmnTable =
        dmnTableRepo.all().filter("self.decisionId = ?1", decisionDefinitionId).fetchOne();

    if (dmnTable != null && !CollectionUtils.isEmpty(result)) {
      Map<String, Object> res = result.getFirst();
      dmnTable.getOutputDmnFieldList().stream()
          .filter(dmnField -> dmnField.getField() != null)
          .forEach(
              dmnField ->
                  addValue(context, dmnField.getField(), res.get(dmnField.getName()), model));
    }

    JpaRepository.of(EntityHelper.getEntityClass(model)).save(model);
  }

  protected void addValue(FullContext context, String field, Object value, Model model) {

    if (!field.contains(".")) {
      context.put(field, value);
      return;
    }

    if (field.startsWith(".") || field.endsWith(".")) {
      return;
    }

    String fieldName = field.substring(0, field.indexOf("."));
    String subField = field.substring(field.indexOf(".") + 1);

    log.debug("Process relational field: {}, value: {}", field, value);
    if (model instanceof MetaJsonRecord) {
      context.put(
          fieldName,
          processMetaModelJson(
              fieldName, subField, value, ((MetaJsonRecord) model).getJsonModel()));
    } else {
      context.put(
          fieldName,
          processMetaField(fieldName, subField, value, EntityHelper.getEntityClass(model)));
    }
    log.debug("Relational value added: {}", context.get(fieldName));
  }

  protected Object processMetaField(
      String fieldName, String subField, Object value, Class<Model> entityClass) {

    Property property = Mapper.of(entityClass).getProperty(fieldName);

    if (property == null) {
      return processMetaModelJson(fieldName, subField, value, entityClass);
    }

    String targetModel = property.getTarget().getName();
    boolean isCollection = property.isCollection();
    boolean isSet = property.getJavaType().isAssignableFrom(Set.class);

    return findResult(value, subField, targetModel, isCollection, isSet);
  }

  protected Object processMetaModelJson(
      String fieldName, String subField, Object value, Class<Model> entityClass) {

    MetaJsonField jsonField =
        metaJsonFieldRepo
            .all()
            .filter("self.name = ?1 and self.model = ?2", fieldName, entityClass.getName())
            .fetchOne();
    log.debug(
        "Meta model json field search for field: {}, class: {}, found: {}",
        fieldName,
        entityClass.getName(),
        jsonField);
    if (jsonField == null) {
      return null;
    }

    return processMetaJsonField(value, subField, jsonField);
  }

  protected Object processMetaModelJson(
      String fieldName, String subField, Object value, String jsonModel) {

    MetaJsonField jsonField =
        metaJsonFieldRepo
            .all()
            .filter("self.name = ?1 and self.jsonModel.name = ?2", fieldName, jsonModel)
            .fetchOne();

    if (jsonField == null) {
      return null;
    }

    return processMetaJsonField(value, subField, jsonField);
  }

  protected Object processMetaJsonField(Object value, String subField, MetaJsonField jsonField) {

    String type = jsonField.getType();
    String targetModel = null;
    if (type.contains("json-")) {
      targetModel = MetaJsonRecord.class.getName();
      subField =
          "jsonModel = '" + jsonField.getTargetJsonModel().getName() + "' AND self." + subField;
    } else {
      targetModel = jsonField.getTargetModel();
    }

    boolean isSet = type.contains(MANY_TO_MANY);
    boolean isCollection = isSet || type.contains("-to-many");

    return findResult(value, subField, targetModel, isCollection, isSet);
  }

  @SuppressWarnings({"rawtypes", "unchecked"})
  protected Object findResult(
      Object value, String subField, String targetModel, boolean isCollection, boolean isSet) {

    Object params = getParameter(value);

    String query = getQuery(subField, params instanceof Collection);

    log.debug("Find result for: {} , value: {}, targetModel: {}", subField, value, targetModel);

    if (isCollection) {
      Collection resultCollection = null;
      if (isSet) {
        resultCollection = new HashSet<>();
      } else {
        resultCollection = new ArrayList<>();
      }

      if (params == null) {
        return resultCollection;
      }

      for (FullContext res : FullContextHelper.filter(targetModel, query, params)) {
        resultCollection.add(res.getTarget());
      }

      return resultCollection;
    }

    if (params == null) {
      return null;
    }

    return WkfContextHelper.filterOne(targetModel, query, params).getTarget();
  }

  protected String getQuery(String subField, boolean collectionParameter) {

    String operator = "=";
    if (collectionParameter) {
      operator = "in";
    }
    String query = "self." + subField + " " + operator + " ?1";

    return query;
  }

  protected Object getParameter(Object value) {

    Object params = null;
    if (value instanceof String param && param.startsWith("in(")) {
      param = param.replace("in(", "").replace(")", "");
      params = Arrays.asList(param.split(","));
    }

    if (params == null) {
      params = value;
    }

    return params;
  }

  @Override
  public String createOutputToFieldScript(
      String decisionDefinitionId,
      String modelName,
      String searchOperator,
      String ifMultiple,
      String resultVar) {

    List<String> fields = extractFields(decisionDefinitionId);

    String script = "";
    if (!fields.isEmpty()
        && modelName != null
        && searchOperator != null
        && ifMultiple != null
        && resultVar != null) {
      searchOperator = searchOperator.equals("Equal") ? "=" : "LIKE";
      boolean multiple = !ifMultiple.equals("Keep empty");
      try {
        if (modelName.contains(".")) {
          script = mapToMetaModelFields(fields, modelName, searchOperator, multiple, resultVar);
        } else {
          script =
              mapToMetaCustomModelFields(fields, modelName, searchOperator, multiple, resultVar);
        }
      } catch (ClassNotFoundException e) {
        ExceptionHelper.error(e);
      }
    }

    return script;
  }

  protected List<String> extractFields(String decisionDefinitionId) {

    List<String> fields = new ArrayList<String>();

    ProcessEngine processEngine = processEngineService.getEngine();

    DecisionDefinition decisionDefinition =
        processEngine
            .getRepositoryService()
            .createDecisionDefinitionQuery()
            .decisionDefinitionKey(decisionDefinitionId)
            .latestVersion()
            .singleResult();

    DmnModelInstance dmnModelInstance =
        processEngine.getRepositoryService().getDmnModelInstance(decisionDefinition.getId());

    if (dmnModelInstance == null) {
      return fields;
    }

    log.debug("Definition: {}", dmnModelInstance.getDefinitions());

    Collection<DecisionTable> decisionTables =
        dmnModelInstance.getModelElementsByType(DecisionTable.class);

    log.debug("DecisionTables: {}", decisionTables);
    if (decisionTables == null) {
      return fields;
    }

    decisionTables.stream()
        .map(decisionTable -> decisionTable.getOutputs())
        .forEach(outputs -> outputs.forEach(output -> fields.add(output.getName())));

    log.debug("Output fields: {}", fields);
    return fields;
  }

  protected String mapToMetaModelFields(
      List<String> fields,
      String modelName,
      String searchOperator,
      boolean multiple,
      String resultVar)
      throws ClassNotFoundException {

    StringBuilder scriptBuilder = new StringBuilder();

    Mapper mapper = Mapper.of(EntityHelper.getEntityClass(Class.forName(modelName)));
    String varName = wkfCommonService.getVarName(modelName);
    scriptBuilder.append("def _query = null\n");
    for (String field : fields) {
      String resultField = resultVar + "?." + field;
      String targetField = varName + "." + field;
      Property property = mapper.getProperty(field);
      if (property == null) {
        MetaJsonField jsonField =
            metaJsonFieldRepo
                .all()
                .filter("self.model = ?1 and self.name = ?2", modelName, field)
                .fetchOne();
        if (jsonField != null) {
          addJsonField(searchOperator, multiple, resultVar, scriptBuilder, varName, jsonField);
        }
        continue;
      }

      if (property.getTarget() != null) {
        addRelationalField(
            searchOperator,
            multiple,
            scriptBuilder,
            targetField,
            resultField,
            property.getTarget().getSimpleName(),
            property.getTargetName());
      } else {
        scriptBuilder.append(targetField + " = " + resultField);
      }
      scriptBuilder.append("\n");
    }

    return scriptBuilder.toString();
  }

  protected void addRelationalField(
      String searchOperator,
      boolean multiple,
      StringBuilder scriptBuilder,
      String varName,
      String resultField,
      String targetModel,
      String targetName) {

    String param = searchOperator.equals("LIKE") ? "CONCAT('%',?1, '%')" : "?1";
    String query =
        String.format(
            "__repo__(%s).all().filter(\"self.%s %s %s\",%s)",
            targetModel, targetName, searchOperator, param, resultField);
    String field =
        "_query.count() > 1 ? ("
            + multiple
            + " ? _query.fetchOne() : null)"
            + " : _query.fetchOne()";
    scriptBuilder.append("_query = " + query);
    scriptBuilder.append("\n");
    scriptBuilder.append("if(" + resultField + " != null) {" + varName + " = " + field + "}");
  }

  protected String mapToMetaCustomModelFields(
      List<String> fields,
      String modelName,
      String searchOperator,
      boolean multiple,
      String resultVar)
      throws ClassNotFoundException {

    StringBuilder scriptBuilder = new StringBuilder();
    scriptBuilder.append("def _query = null\n");
    String varName = wkfCommonService.getVarName(modelName);

    List<MetaJsonField> metaJsonFields =
        metaJsonFieldRepo
            .all()
            .filter("self.name in (?1) and self.jsonModel.name = ?2", fields, modelName)
            .fetch();

    log.debug("Json fields founds: {}", metaJsonFields);

    for (MetaJsonField field : metaJsonFields) {
      addJsonField(searchOperator, multiple, resultVar, scriptBuilder, varName, field);
      scriptBuilder.append("\n");
    }

    return scriptBuilder.toString();
  }

  protected void addJsonField(
      String searchOperator,
      boolean multiple,
      String resultVar,
      StringBuilder scriptBuilder,
      String varName,
      MetaJsonField field)
      throws ClassNotFoundException {

    String resultField = resultVar + "?." + field.getName();
    String targetField = varName + "." + field.getName();
    String type = field.getType();
    switch (type) {
      case MANY_TO_ONE:
      case ONE_TO_MANY:
      case MANY_TO_MANY:
        Class<?> klass = Class.forName(field.getTargetModel());
        Mapper mapper = Mapper.of(EntityHelper.getEntityClass(klass));
        addRelationalField(
            searchOperator,
            multiple,
            scriptBuilder,
            targetField,
            resultField,
            klass.getSimpleName(),
            mapper.getNameField().getName());
        break;
      case JSON_MANY_TO_ONE:
      case JSON_MANY_TO_MANY:
      case JSON_ONE_TO_MANY:
        MetaJsonModel targetModel = field.getTargetJsonModel();
        String nameField = targetModel.getNameField() != null ? targetModel.getNameField() : "id";
        String targetName =
            "jsonModel = '"
                + targetModel.getName()
                + "' AND json_extract(self."
                + field.getModelField()
                + ", '"
                + nameField
                + "')";

        addRelationalField(
            searchOperator,
            multiple,
            scriptBuilder,
            targetField,
            resultField,
            MetaJsonRecord.class.getSimpleName(),
            targetName);
        break;
      default:
        scriptBuilder.append(targetField + " = " + resultField);
        break;
    }
  }

  @Override
  public void renameDiagramIds(WkfDmnModel wkfDmnModel) {

    if (wkfDmnModel == null || StringUtils.isBlank(wkfDmnModel.getDiagramXml())) {
      return;
    }

    String diagramXml = wkfDmnModel.getDiagramXml().replaceAll("\n", "#NEWLINE#");
    diagramXml = renameDefinationId(diagramXml);
    diagramXml = renameDesicionIds(diagramXml);
    wkfDmnModel.setDiagramXml(diagramXml.replaceAll("#NEWLINE#", "\n"));
  }

  protected String renameDefinationId(String diagramXml) {

    String definationIdPatternStr =
        ".*?(<definitions .* id=\"Definitions_)([a-zA-Z0-9_]*)(\".*?>).*?";
    String definationId = "Definitions_%s";
    Pattern definationIdPattern = Pattern.compile(definationIdPatternStr, Pattern.MULTILINE);

    return replaceXml(diagramXml, definationId, definationIdPattern);
  }

  protected String renameDesicionIds(String diagramXml) {

    String desicionIdPatternStr = ".*?(<decision id=\"Decision_)([a-zA-Z0-9_]*)(\".*?>).*?";
    String decisionId = "Decision_%s";
    Pattern desicionIdPattern = Pattern.compile(desicionIdPatternStr, Pattern.MULTILINE);

    return replaceXml(diagramXml, decisionId, desicionIdPattern);
  }

  protected String replaceXml(String diagramXml, String id, Pattern pattern) {

    try {
      Matcher matcher = pattern.matcher(diagramXml);
      while (matcher.find()) {
        String randomStr = RandomStringUtils.randomAlphanumeric(7);
        String oldStr =
            String.format("%s%s%s", matcher.group(1), matcher.group(2), matcher.group(3));
        String newStr = String.format("%s%s%s", matcher.group(1), randomStr, matcher.group(3));
        diagramXml =
            diagramXml
                .replaceAll(oldStr, newStr)
                .replaceAll(String.format(id, matcher.group(2)), String.format(id, randomStr));
      }
    } catch (Exception e) {
      ExceptionHelper.error(e);
    }

    return diagramXml;
  }
}
