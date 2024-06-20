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
package com.axelor.studio.bpm.context;

import com.axelor.db.JpaRepository;
import com.axelor.db.Model;
import com.axelor.i18n.I18n;
import com.axelor.inject.Beans;
import com.axelor.studio.bpm.exception.BpmExceptionMessage;
import com.axelor.studio.bpm.service.WkfCommonService;
import com.axelor.studio.bpm.service.init.ProcessEngineServiceImpl;
import com.axelor.studio.helper.DepthFilter;
import com.axelor.studio.helper.ModelTools;
import com.axelor.utils.helpers.context.FullContext;
import com.axelor.utils.helpers.context.FullContextHelper;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.introspect.Annotated;
import com.fasterxml.jackson.databind.introspect.JacksonAnnotationIntrospector;
import com.fasterxml.jackson.databind.ser.impl.SimpleFilterProvider;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.google.inject.persist.Transactional;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.variable.Variables;
import org.camunda.bpm.engine.variable.Variables.SerializationDataFormats;
import org.camunda.bpm.engine.variable.value.ObjectValue;

public class WkfContextHelper {

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

    List<Long> values = new ArrayList<Long>();

    lines.forEach(fullContext -> values.add((Long) fullContext.get("id")));

    return values;
  }

  public static Object createObject(Object object) throws JsonProcessingException {
    if(object != null){
      if (object instanceof FullContext) {
        return createSingleVariable((FullContext) object);
      } else if (object instanceof Collection<?>) {
        return createListVariable((Collection<?>) object);
      }
    }
    throw new IllegalArgumentException(I18n.get(BpmExceptionMessage.BPM_VARIABLE_UNSUPPORTED_TYPE));
  }

  private static Object createSingleVariable(FullContext context) throws JsonProcessingException {
    Model model = (Model) context.getTarget();
    String serializedModel = serializeModel(model);
    Map<String, String> map =
        Collections.singletonMap(context.getContextClass().getName(), serializedModel);
    return createVariablesObjectValue(map);
  }

  private static Object createListVariable(Collection<?> collection){
    if (isListOfFullContext(collection)) {
      List<FullContext> contexts = (List<FullContext>) collection;
      String key = contexts.get(0).getContextClass().getName();

      List<String> serializedModels = contexts.stream()
              .map(context -> {
                try {
                  return serializeModel((Model) context.getTarget());
                } catch (JsonProcessingException e) {
                  throw new IllegalArgumentException(e);
                }
              })
              .collect(Collectors.toList());
      Map<String, List<String>> map = Collections.singletonMap(key, serializedModels);
      return createVariablesObjectValue(map);
    } else {
      List<String> serializedModels = new ArrayList<>();
      return createVariablesObjectValue(serializedModels);
    }
  }

  private static boolean isListOfFullContext(Collection<?> collection) {
    return !collection.isEmpty() && collection.iterator().next() instanceof FullContext;
  }

  private static String serializeModel(Model model) throws JsonProcessingException {
    return serializeMap(model, 3);
  }

  public static Object getObject(String varName, DelegateExecution execution)
      throws JsonProcessingException {
    ObjectMapper mapper = createObjectMapper();
    Object object = getVariable(execution.getProcessInstanceId(), varName);
    if (object instanceof Map<?, ?>) {
      Map<?, ?> map = (Map<?, ?>) object;
      if (!map.isEmpty()) {
        Map.Entry<?, ?> entry = map.entrySet().iterator().next();
        if (entry.getValue() instanceof List<?>) {
          return deserializeList((List<String>) entry.getValue(), (String) entry.getKey(), mapper);
        } else {
          return deserializeModel((String) entry.getValue(), (String) entry.getKey(), mapper);
        }
      }
    } else if (object instanceof List<?>) {
      return object;
    }
    throw new IllegalArgumentException(
        String.format(I18n.get(BpmExceptionMessage.BPM_VARIABLE_UNSUPPORTED_TYPE)));
  }

  private static ObjectMapper createObjectMapper() {
    ObjectMapper mapper = new ObjectMapper();
    mapper.registerModule(new JavaTimeModule());
    return mapper;
  }

  private static Object deserializeList(
      List<String> serializedModels, String className, ObjectMapper mapper)
      throws JsonProcessingException {
    List<Object> deserializedModels = new ArrayList<>();
    for (String serializedModel : serializedModels) {
      deserializedModels.add(
          new FullContext(mapper.readValue(serializedModel, ModelTools.findModelClass(className))));
    }
    return deserializedModels;
  }

  private static Object deserializeModel(
      String serializedModel, String className, ObjectMapper mapper)
      throws JsonProcessingException {
    return new FullContext(mapper.readValue(serializedModel, ModelTools.findModelClass(className)));
  }

  protected static String serializeMap(Model model, int depthMax) throws JsonProcessingException {
    String filterName = "depth_filter";
    ObjectMapper objectMapper = createObjectMapper();
    objectMapper.disable(SerializationFeature.FAIL_ON_SELF_REFERENCES);
    objectMapper.enable(JsonGenerator.Feature.FLUSH_PASSED_TO_STREAM);
    objectMapper.enable(JsonGenerator.Feature.IGNORE_UNKNOWN);
    objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
    objectMapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
    objectMapper.setAnnotationIntrospector(
        new JacksonAnnotationIntrospector() {
          @Override
          public Object findFilterId(Annotated a) {
            return filterName;
          }
        });

    ObjectWriter writer =
        objectMapper.writer(
            new SimpleFilterProvider().addFilter(filterName, new DepthFilter(depthMax)));
    return writer.writeValueAsString(model);
  }

  private static Object createVariablesObjectValue(Object value) {
    return Variables.objectValue(value, false)
        .serializationDataFormat(SerializationDataFormats.JAVA)
        .create();
  }
}
