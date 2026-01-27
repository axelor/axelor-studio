/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service;

import com.axelor.db.EntityHelper;
import com.axelor.db.JpaRepository;
import com.axelor.db.Model;
import com.axelor.db.mapper.Mapper;
import com.axelor.db.mapper.Property;
import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.meta.db.repo.MetaJsonFieldRepository;
import com.axelor.rpc.Context;
import com.axelor.script.GroovyScriptHelper;
import com.axelor.studio.app.service.AppService;
import com.axelor.studio.bpm.context.WkfContextHelper;
import com.axelor.studio.bpm.script.AxelorBindingsHelper;
import com.axelor.studio.db.WkfInstance;
import com.axelor.studio.db.WkfProcess;
import com.axelor.studio.db.WkfProcessConfig;
import com.axelor.studio.db.repo.WkfModelRepository;
import com.axelor.studio.db.repo.WkfProcessConfigRepository;
import com.axelor.utils.helpers.ExceptionHelper;
import com.axelor.utils.helpers.StringHelper;
import com.axelor.utils.helpers.context.FullContext;
import com.google.common.base.Strings;
import jakarta.inject.Inject;
import java.lang.invoke.MethodHandles;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import javax.script.Bindings;
import javax.script.SimpleBindings;
import org.camunda.bpm.engine.impl.bpmn.parser.BpmnParser;
import org.camunda.bpm.engine.variable.Variables;
import org.camunda.bpm.engine.variable.Variables.SerializationDataFormats;
import org.camunda.bpm.engine.variable.value.ObjectValue;
import org.camunda.bpm.model.xml.instance.ModelElementInstance;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class WkfCommonServiceImpl implements WkfCommonService {

  protected static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  protected WkfProcessConfigRepository wkfProcessConfigRepository;

  protected MetaJsonFieldRepository metaJsonFieldRepository;

  protected WkfModelRepository wkfModelRepository;

  protected AppService appService;

  @Inject
  public WkfCommonServiceImpl(
      WkfProcessConfigRepository wkfProcessConfigRepository,
      MetaJsonFieldRepository metaJsonFieldRepository,
      WkfModelRepository wkfModelRepository,
      AppService appService) {
    this.wkfProcessConfigRepository = wkfProcessConfigRepository;
    this.wkfModelRepository = wkfModelRepository;
    this.metaJsonFieldRepository = metaJsonFieldRepository;
    this.appService = appService;
  }

  @Override
  public WkfProcessConfig findCurrentProcessConfig(Model model) {

    return findProcessConfig(model, true, WkfModelRepository.STATUS_ON_GOING);
  }

  @Override
  public WkfProcessConfig findOldProcessConfig(Model model) {

    return findProcessConfig(model, false, WkfModelRepository.STATUS_TERMINATED);
  }

  protected WkfProcessConfig findProcessConfig(Model model, boolean isActive, int status) {

    List<WkfProcessConfig> configs =
        wkfProcessConfigRepository
            .all()
            .filter(
                "(self.metaModel.fullName = ?1 OR self.metaJsonModel.name = ?1) "
                    + "AND self.wkfProcess.wkfModel.statusSelect = ?2 "
                    + "AND self.wkfProcess.wkfModel.isActive = ?3 "
                    + "AND (self.isStartModel is true OR (SELECT COUNT(wkp.id) from self.wkfProcess.wkfModel.wkfProcessList.wkfProcessConfigList wkp WHERE wkp.isStartModel IS TRUE) > 0)",
                getModelName(model),
                status,
                isActive)
            .order("pathCondition")
            .fetch();

    Map<String, Object> ctxMap = new HashMap<>();
    ctxMap.put(getVarName(model), new FullContext(model));

    for (WkfProcessConfig config : configs) {
      boolean condition = true;
      if (config.getPathCondition() != null) {
        condition = (boolean) evalExpression(ctxMap, config.getPathCondition());
      }
      if (condition) {
        return config;
      }
    }

    return null;
  }

  @Override
  public Object evalExpression(Map<String, Object> varMap, String expr) {

    if (Strings.isNullOrEmpty(expr)) {
      return null;
    }

    if (expr.startsWith("${") && expr.endsWith("}")) {
      expr = expr.replaceFirst("\\$\\{", "");
      expr = expr.substring(0, expr.length() - 1);
    }

    GroovyScriptHelper helper;
    if (varMap instanceof Context context) {
      helper = new GroovyScriptHelper(context);
    } else {
      SimpleBindings simpleBindings = new SimpleBindings();
      simpleBindings.putAll(varMap);
      helper = new GroovyScriptHelper(simpleBindings);
    }
    Bindings bindings = helper.getBindings();
    bindings = AxelorBindingsHelper.getBindings(bindings);
    Object result = null;

    result = helper.eval(expr);

    log.debug("Eval expr: {}, result: {}", expr, result);
    return result;
  }

  @Override
  public Map<String, Object> createVariables(Map<String, Object> modelMap) {

    Map<String, Object> varMap = new HashMap<>();
    modelMap.forEach(
        (key, value) -> {
          if (value == null) {
            varMap.put(key, Variables.objectValue(null, true).create());
            return;
          }

          ObjectValue variable;
          Long id = null;
          if (value instanceof Model model) {
            FullContext ctx = new FullContext(model);
            variable =
                Variables.objectValue(ctx, true)
                    .serializationDataFormat(SerializationDataFormats.JSON)
                    .create();

            id = model.getId();
          } else {
            variable =
                Variables.objectValue(value, true)
                    .serializationDataFormat(SerializationDataFormats.JSON)
                    .create();

            if (value instanceof FullContext context) {
              id = (Long) context.get("id");
            }
          }
          varMap.put(key, variable);

          if (id != null) {
            varMap.put(key + "Id", Variables.longValue(id));
          }
        });

    log.debug("Process variables: {}", varMap);
    return varMap;
  }

  @Override
  public String getVarName(Object model) {

    String name = null;
    if (model instanceof Context context) {
      name = (String) context.get("jsonModel");
      if (name == null) {
        name = context.getContextClass().getSimpleName();
      }
    } else if (model instanceof MetaJsonRecord metaJsonRecord) {
      name = metaJsonRecord.getJsonModel();
    } else if (model instanceof String string) {
      name = string;
      if (name.contains(".")) {
        name = name.substring(name.lastIndexOf(".") + 1);
      }
    } else if (model instanceof Model) {
      name = model.getClass().getSimpleName();
    }

    if (name != null) {
      name = StringHelper.toFirstLower(name);
    }

    return name;
  }

  protected String getModelName(Model model) {

    if (model instanceof MetaJsonRecord metaJsonRecord) {
      return metaJsonRecord.getJsonModel();
    }

    return model.getClass().getName();
  }

  @Override
  public Object findRelatedRecord(Model model, String path) {

    Object object = null;
    FullContext wkfModel = new FullContext(model);

    if (path.startsWith("_find(")) {
      List<String> params = Arrays.asList(path.replace("_find(", "").replace(")", "").split(","));
      if (params.size() >= 2) {
        List<Object> queryParams =
            params.stream().map(it -> evalExpression(wkfModel, it)).collect(Collectors.toList());
        String queryModel = (String) queryParams.getFirst();
        queryParams.removeFirst();
        String query = (String) queryParams.getFirst();
        queryParams.removeFirst();
        log.debug("Find model: {}, query: {}, params: {}", queryModel, query, queryParams);
        object = WkfContextHelper.filterOne(queryModel, query, queryParams.toArray());
      }
    } else {
      object = evalExpression(new FullContext(model), path);
    }

    return object;
  }

  @SuppressWarnings("unchecked")
  @Override
  public Model addProperties(
      Map<String, String> propertyMap, Model model, ModelElementInstance element) {

    Mapper mapper = Mapper.of(EntityHelper.getEntityClass(model));

    propertyMap.forEach(
        (key, property) -> {
          Object value =
              element.getAttributeValueNs(BpmnParser.CAMUNDA_BPMN_EXTENSIONS_NS, property);
          if (value != null && value.equals("undefined")) {
            value = null;
          }
          Property field = mapper.getProperty(key);
          if (field == null) {
            return;
          }
          if (field.isReference()) {
            try {
              value =
                  JpaRepository.of((Class<? extends Model>) field.getTarget())
                      .all()
                      .filter("self.name = ?1", value)
                      .fetchOne();
            } catch (Exception e) {
              ExceptionHelper.error(e);
            }
          }
          mapper.set(model, key, value);
        });

    return model;
  }

  @Override
  public Map<String, Object> getContext(WkfInstance instance, Model model)
      throws ClassNotFoundException {

    WkfProcess wkfProcess = instance.getWkfProcess();

    Map<String, Object> modelMap = new HashMap<>();

    for (WkfProcessConfig processConfig : wkfProcess.getWkfProcessConfigList()) {

      String klassName;
      if (processConfig.getMetaJsonModel() != null) {
        klassName = MetaJsonRecord.class.getName();
      } else {
        klassName = processConfig.getMetaModel().getFullName();
      }
      @SuppressWarnings("unchecked")
      final Class<? extends Model> klass = (Class<? extends Model>) Class.forName(klassName);
      String query = "self.processInstanceId = ?";
      if (processConfig.getMetaJsonModel() != null) {
        query += " AND self.jsonModel = '" + processConfig.getMetaJsonModel().getName() + "'";
      }

      if (model == null) {
        model =
            JpaRepository.of(klass)
                .all()
                .filter(query, instance.getInstanceId())
                .order("-id")
                .autoFlush(false)
                .fetchOne();
      }
      if (model != null) {
        model = EntityHelper.getEntity(model);
        String name = getVarName(model);
        modelMap.put(name, new FullContext(model));
      } else {
        log.debug("Model not found with processInstanceId: {}", instance.getInstanceId());
      }
    }

    log.debug("Variable map used: {}", modelMap);

    return modelMap;
  }
}
