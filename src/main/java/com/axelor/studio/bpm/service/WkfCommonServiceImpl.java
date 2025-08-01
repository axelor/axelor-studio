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
import com.axelor.studio.db.WkfProcessConfig;
import com.axelor.studio.db.repo.WkfModelRepository;
import com.axelor.studio.db.repo.WkfProcessConfigRepository;
import com.axelor.utils.helpers.ExceptionHelper;
import com.axelor.utils.helpers.StringHelper;
import com.axelor.utils.helpers.context.FullContext;
import com.google.common.base.Strings;
import com.google.inject.Inject;
import java.lang.invoke.MethodHandles;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import javax.script.Bindings;
import javax.script.SimpleBindings;
import org.camunda.bpm.engine.impl.bpmn.parser.BpmnParser;
import org.camunda.bpm.engine.impl.variable.serializer.jpa.JPAVariableSerializer;
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
                    + "AND self.wkfProcess.wkfModel.isActive is ?3 "
                    + "AND (self.isStartModel is true OR (SELECT COUNT(id) from self.wkfProcess.wkfModel.wkfProcessList.wkfProcessConfigList wkp WHERE wkp.isStartModel IS TRUE) > 0)",
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
    if (varMap instanceof Context) {
      helper = new GroovyScriptHelper((Context) varMap);
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
          if (value instanceof Model) {
            variable =
                Variables.objectValue(value, true)
                    .serializationDataFormat(JPAVariableSerializer.NAME)
                    .create();
            id = ((Model) value).getId();
          } else {
            variable =
                Variables.objectValue(value, true)
                    .serializationDataFormat(SerializationDataFormats.JSON)
                    .create();

            if (value instanceof FullContext) {
              id = (Long) ((FullContext) value).get("id");
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
    if (model instanceof Context) {
      name = (String) ((Context) model).get("jsonModel");
      if (name == null) {
        name = ((Context) model).getContextClass().getSimpleName();
      }
    } else if (model instanceof MetaJsonRecord) {
      name = ((MetaJsonRecord) model).getJsonModel();
    } else if (model instanceof String) {
      name = (String) model;
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

    if (model instanceof MetaJsonRecord) {
      return ((MetaJsonRecord) model).getJsonModel();
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
        String queryModel = (String) queryParams.get(0);
        queryParams.remove(0);
        String query = (String) queryParams.get(0);
        queryParams.remove(0);
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
}
