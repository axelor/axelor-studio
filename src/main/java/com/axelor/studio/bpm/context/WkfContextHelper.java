/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.context;

import com.axelor.db.EntityHelper;
import com.axelor.db.JpaRepository;
import com.axelor.db.Model;
import com.axelor.db.Query;
import com.axelor.i18n.I18n;
import com.axelor.inject.Beans;
import com.axelor.studio.bpm.exception.BpmExceptionMessage;
import com.axelor.studio.bpm.service.WkfCommonService;
import com.axelor.studio.bpm.service.init.ProcessEngineServiceImpl;
import com.axelor.studio.bpm.transformation.WkfTransformationHelper;
import com.axelor.utils.helpers.context.FullContext;
import com.axelor.utils.helpers.context.FullContextHelper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.google.inject.persist.Transactional;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.variable.Variables;
import org.camunda.bpm.engine.variable.Variables.SerializationDataFormats;
import org.camunda.bpm.engine.variable.value.ObjectValue;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class WkfContextHelper {

  protected static final String ENTITY_REFERENCE = "ENTITY_REFERENCE";
  protected static final String ENTITY_LIST_REFERENCE = "ENTITY_LIST_REFERENCE";
  protected static final Logger log = LoggerFactory.getLogger(WkfContextHelper.class);
  private static final ObjectMapper OBJECT_MAPPER = createObjectMapper();

  public static Object transform(
      String transformation, String library, Map<String, Object> parameters) {
    String target = null;
    if ("Text".equals(library)) {
      target = "'" + parameters.get("target").toString() + "'";
    } else {
      target = parameters.get("target").toString();
    }
    parameters.remove("target");
    List<String> parametersList =
        parameters.values().stream().map(Object::toString).collect(Collectors.toList());
    return WkfTransformationHelper.transform(target, parametersList, library, transformation);
  }

  public static FullContext create(String modelName, Map<String, Object> values) {
    return FullContextHelper.create(modelName, values);
  }

  public static FullContext create(Model model) {
    return FullContextHelper.create(model);
  }

  public static FullContext filterOne(String modelName, String queryStr, Object... params) {
    return FullContextHelper.filterOne(modelName, queryStr, params);
  }

  public static FullContext filterOne(String modelName, String queryStr) {
    return FullContextHelper.filterOne(modelName, queryStr);
  }

  public static FullContext filterOne(
      String modelName, String queryStr, Map<String, Object> paramMap) {
    return FullContextHelper.filterOne(modelName, queryStr, paramMap);
  }

  public static List<FullContext> filter(String modelName, String queryStr) {

    return FullContextHelper.filter(modelName, queryStr);
  }

  public static List<FullContext> filter(String modelName, String queryStr, Object... params) {

    return FullContextHelper.filter(modelName, queryStr, params);
  }

  public static List<FullContext> filter(
      String modelName, String queryStr, Map<String, Object> paramMap) {

    return FullContextHelper.filter(modelName, queryStr, paramMap);
  }

  public static FullContext create(String modelName) {
    return FullContextHelper.create(modelName);
  }

  public static void createVariable(FullContext wkfContext, DelegateExecution execution) {

    if (wkfContext.get("processInstanceId") == null) {
      wkfContext.put("processInstanceId", execution.getProcessInstanceId());
    }

    String varName = Beans.get(WkfCommonService.class).getVarName(wkfContext);
    execution.setVariable(
        varName,
        Variables.objectValue(wkfContext, true)
            .serializationDataFormat(SerializationDataFormats.JSON)
            .create());
    execution.setVariable(varName + "Id", wkfContext.get("id"));
  }

  public static ObjectValue createVariable(Object variable) {

    if (variable instanceof byte[]) {
      return Variables.objectValue(variable, false)
          .serializationDataFormat(SerializationDataFormats.JAVA)
          .create();
    }

    return Variables.objectValue(variable, false)
        .serializationDataFormat(SerializationDataFormats.JSON)
        .create();
  }

  @Transactional(rollbackOn = Exception.class)
  public static FullContext save(Object object) {

    return FullContextHelper.save(object);
  }

  public static JpaRepository<? extends Model> getRepository(String modelName) {

    return FullContextHelper.getRepository(modelName);
  }

  public static Object getVariable(String processInstanceId, String variable) {

    if (processInstanceId == null) {
      return null;
    }

    RuntimeService runtimeService =
        Beans.get(ProcessEngineServiceImpl.class).getEngine().getRuntimeService();

    Object value = runtimeService.getVariable(processInstanceId, variable);

    return value;
  }

  public static FullContext find(String modelName, Object recordId) {
    return FullContextHelper.find(modelName, recordId);
  }

  public static void evalStartConditions(String variableName, Object value) {
    RuntimeService runtimeService =
        Beans.get(ProcessEngineServiceImpl.class).getEngine().getRuntimeService();

    runtimeService
        .createConditionEvaluation()
        .setVariable(variableName, value)
        .evaluateStartConditions();
  }

  public static List<Long> getIdList(List<FullContext> lines) {

    List<Long> values = new ArrayList<>();

    lines.forEach(fullContext -> values.add((Long) fullContext.get("id")));

    return values;
  }

  private static boolean isListOfFullContext(Collection<?> collection) {
    return !collection.isEmpty() && collection.iterator().next() instanceof FullContext;
  }

  public static Object createObject(Object object) {
    if (object == null) {
      throw new IllegalArgumentException(I18n.get(BpmExceptionMessage.BPM_VARIABLE_NULL_VALUE));
    } else {
      if (object instanceof FullContext) {
        return createObjectReference((FullContext) object);
      } else if (object instanceof Collection<?>) {
        return createListReference((Collection<?>) object);
      }
    }
    throw new IllegalArgumentException(I18n.get(BpmExceptionMessage.BPM_VARIABLE_UNSUPPORTED_TYPE));
  }

  private static Object createObjectReference(FullContext context) {
    Model model = (Model) context.getTarget();

    Map<String, Object> reference = new HashMap<>();
    reference.put("id", model.getId());
    reference.put("className", EntityHelper.getEntityClass(model).getName());
    reference.put("version", model.getVersion());
    reference.put("type", ENTITY_REFERENCE);

    return createVariablesObjectValue(reference);
  }

  private static Object createListReference(Collection<?> collection) {
    if (isListOfFullContext(collection)) {
      List<FullContext> contexts = (List<FullContext>) collection;

      List<Map<String, Object>> references =
          contexts.stream()
              .map(
                  context -> {
                    Model model = (Model) context.getTarget();
                    Map<String, Object> ref = new HashMap<>();
                    ref.put("id", model.getId());
                    ref.put("className", EntityHelper.getEntityClass(model).getName());
                    ref.put("version", model.getVersion());
                    return ref;
                  })
              .collect(Collectors.toList());

      Map<String, Object> listReference = new HashMap<>();
      listReference.put("items", references);
      listReference.put("type", ENTITY_LIST_REFERENCE);

      return createVariablesObjectValue(listReference);
    }
    return createVariablesObjectValue(Collections.emptyList());
  }

  public static Object getObject(String varName, DelegateExecution execution) {

    Object variable = getVariable(execution.getProcessInstanceId(), varName);

    if (variable == null) {
      return null;
    }

    if (variable instanceof Map<?, ?>) {
      Map<String, Object> data = (Map<String, Object>) variable;
      String type = (String) data.get("type");

      if (ENTITY_REFERENCE.equals(type)) {
        return getEntityFromReference(data);
      } else if (ENTITY_LIST_REFERENCE.equals(type)) {
        return getEntityListFromReference(data);
      }

      if (!data.containsKey("type") && !data.isEmpty()) {
        return migrateDeprecatedVariable(varName, data, execution);
      }
    }

    log.debug("No legacy format found for variable {}", varName);
    return null;
  }

  public static Object migrateDeprecatedVariable(
      String varName, Map<String, Object> data, DelegateExecution execution) {

    Map.Entry<String, Object> entry = data.entrySet().iterator().next();
    String className = entry.getKey();
    Object valueObj = entry.getValue();

    try {
      if (valueObj instanceof String) {
        return migrateDeprecatedStringValue(varName, className, (String) valueObj, execution);
      } else if (valueObj instanceof List<?>) {
        return migrateDeprecatedListValue(varName, className, (List<?>) valueObj, execution);
      } else {
        log.warn(
            "Legacy variable value for class {} is of unsupported type: {}",
            className,
            valueObj.getClass());
        return null;
      }
    } catch (Exception e) {
      log.error("Failed to migrate legacy variable {}: {}", varName, e.getMessage(), e);
      return null;
    }
  }

  private static Object migrateDeprecatedStringValue(
      String varName, String className, String value, DelegateExecution execution)
      throws JsonProcessingException {

    String trimmedValue = value.trim();

    if (trimmedValue.startsWith("{")) {
      Map<String, Object> deserializedMap = OBJECT_MAPPER.readValue(trimmedValue, Map.class);
      Map<String, Object> entityReference =
          createEntityReferenceFromDeprecatedData(className, deserializedMap);

      execution.setVariable(varName, createVariablesObjectValue(entityReference));
      return getEntityFromReference(entityReference);

    } else {
      log.debug(
          "Legacy variable value for class {} is not valid JSON: {}", className, trimmedValue);
      return null;
    }
  }

  private static Object migrateDeprecatedListValue(
      String varName, String className, List<?> list, DelegateExecution execution) {

    List<Map<String, Object>> references =
        list.stream()
            .filter(Objects::nonNull)
            .map(item -> convertListItemToReference(item, className, OBJECT_MAPPER))
            .collect(Collectors.toList());

    Map<String, Object> listReference = new HashMap<>();
    listReference.put("items", references);
    listReference.put("type", ENTITY_LIST_REFERENCE);

    execution.setVariable(varName, createVariablesObjectValue(listReference));
    return getEntityListFromReference(listReference);
  }

  private static Map<String, Object> convertListItemToReference(
      Object item, String className, ObjectMapper mapper) {
    try {
      Map<String, Object> values;

      if (item instanceof String) {
        values = mapper.readValue((String) item, Map.class);
      } else {
        throw new IllegalArgumentException("Unexpected list element type: " + item.getClass());
      }

      return createEntityReferenceFromDeprecatedData(className, values);

    } catch (Exception e) {
      throw new RuntimeException("Failed to parse legacy list element: " + e.getMessage(), e);
    }
  }

  private static Map<String, Object> createEntityReferenceFromDeprecatedData(
      String className, Map<String, Object> values) {
    Map<String, Object> entityReference = new HashMap<>();
    entityReference.put("type", ENTITY_REFERENCE);
    entityReference.put("className", className);
    entityReference.put("id", convertToLong(values.get("id")));
    entityReference.put("version", convertToLong(values.get("version")));
    return entityReference;
  }

  private static Long convertToLong(Object value) {
    if (value instanceof Number) {
      return ((Number) value).longValue();
    }
    throw new IllegalArgumentException(
        "Expected number but got: " + (value != null ? value.getClass() : "null"));
  }

  private static ObjectMapper createObjectMapper() {
    ObjectMapper mapper = new ObjectMapper();
    mapper.registerModule(new JavaTimeModule());
    return mapper;
  }

  private static FullContext getEntityFromReference(Map<String, Object> reference) {
    Long id = (Long) reference.get("id");
    String className = (String) reference.get("className");

    try {
      Class<? extends Model> klass = Class.forName(className).asSubclass(Model.class);
      Model entity = Query.of(klass).filter("self.id = :entityId").bind("entityId", id).fetchOne();

      if (entity != null) {
        return new FullContext(entity);
      }
    } catch (Exception e) {
      log.debug("Error retrieving entity {} with ID {}: {}", className, id, e.getMessage());
    }

    return null;
  }

  private static List<FullContext> getEntityListFromReference(Map<String, Object> listReference) {
    List<Map<String, Object>> items = (List<Map<String, Object>>) listReference.get("items");

    return items.stream()
        .map(WkfContextHelper::getEntityFromReference)
        .filter(java.util.Objects::nonNull)
        .collect(Collectors.toList());
  }

  private static Object createVariablesObjectValue(Object value) {
    return Variables.objectValue(value, false)
        .serializationDataFormat(SerializationDataFormats.JAVA)
        .create();
  }
}
