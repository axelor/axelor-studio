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
package com.axelor.studio.service.constructor.components.actions;

import static com.axelor.utils.MetaJsonFieldType.JSON_MANY_TO_MANY;
import static com.axelor.utils.MetaJsonFieldType.JSON_MANY_TO_ONE;
import static com.axelor.utils.MetaJsonFieldType.JSON_ONE_TO_MANY;
import static com.axelor.utils.MetaJsonFieldType.MANY_TO_MANY;
import static com.axelor.utils.MetaJsonFieldType.MANY_TO_ONE;
import static com.axelor.utils.MetaJsonFieldType.ONE_TO_MANY;
import static com.axelor.utils.MetaJsonFieldType.ONE_TO_ONE;

import com.axelor.common.Inflector;
import com.axelor.meta.db.MetaAction;
import com.axelor.meta.db.MetaField;
import com.axelor.meta.db.MetaJsonField;
import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.studio.db.StudioAction;
import com.axelor.studio.db.StudioActionLine;
import com.axelor.studio.db.repo.StudioActionLineRepository;
import com.axelor.studio.db.repo.StudioActionRepository;
import com.axelor.studio.service.StudioMetaService;
import com.axelor.studio.service.constructor.GroovyTemplateService;
import com.axelor.studio.service.filter.FilterSqlService;
import com.axelor.utils.helpers.ExceptionHelper;
import com.google.common.base.Joiner;
import com.google.common.base.Strings;
import com.google.inject.Inject;
import java.lang.invoke.MethodHandles;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class StudioActionScriptServiceImpl implements StudioActionScriptService {

  protected static final String INDENT = "\t";
  protected static final String TEMPLATE_PATH = "templates/actionScript.tmpl";
  protected static final String SCRIPT_CODE_TEMPLATE_PATH = "templates/scriptCode.tmpl";

  protected final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  protected final Inflector inflector = Inflector.getInstance();

  protected List<StringBuilder> fbuilder = null;

  protected Map<String, Object> scriptCodeBinding = new HashMap<>();

  protected int varCount = 0;

  protected boolean isCreate = false;

  protected boolean isObjToJson = false;

  protected StudioActionLineRepository studioActionLineRepo;

  protected StudioMetaService metaService;
  protected FilterSqlService filterSqlService;
  protected GroovyTemplateService groovyTemplateService;

  @Inject
  public StudioActionScriptServiceImpl(
      StudioActionLineRepository studioActionLineRepo,
      StudioMetaService metaService,
      FilterSqlService filterSqlService,
      GroovyTemplateService groovyTemplateService) {
    this.studioActionLineRepo = studioActionLineRepo;
    this.metaService = metaService;
    this.filterSqlService = filterSqlService;
    this.groovyTemplateService = groovyTemplateService;
  }

  @Override
  public MetaAction build(StudioAction studioAction) {

    String name = studioAction.getName();
    String code = null;
    String lang = "js";
    String transactional = "true";

    if (studioAction.getTypeSelect() == StudioActionRepository.TYPE_SELECT_SCRIPT) {
      lang = "groovy";
      code = "\n" + studioAction.getScriptText();
      if (studioAction.getTransactional()) {
        transactional = "false";
      }
    } else {
      code = generateScriptCode(studioAction);
    }

    Map<String, Object> binding = new HashMap<>();
    binding.put("name", name);
    binding.put("id", studioAction.getXmlId());
    binding.put("model", MetaJsonRecord.class.getName());
    binding.put("lang", lang);
    binding.put("transactional", transactional);
    binding.put("code", code);

    String xml = groovyTemplateService.createXmlWithGroovyTemplate(TEMPLATE_PATH, binding);
    return metaService.updateMetaAction(
        studioAction.getName(), "action-script", xml, null, studioAction.getXmlId());
  }

  @Override
  public String generateScriptCode(StudioAction studioAction) {

    StringBuilder stb = new StringBuilder();
    fbuilder = new ArrayList<>();
    varCount = 1;
    int level = 1;
    String condition = studioAction.getConditionText();
    scriptCodeBinding.put("conditionTextNonNull", condition != null);
    scriptCodeBinding.put("condition", condition);
    scriptCodeBinding.put(
        "typeCreate", studioAction.getTypeSelect() == StudioActionRepository.TYPE_SELECT_CREATE);
    scriptCodeBinding.put("isJson", studioAction.getIsJson());
    scriptCodeBinding.put("targetModel", studioAction.getTargetModel());
    scriptCodeBinding.put("openRecord", studioAction.getOpenRecord());

    if (studioAction.getTypeSelect() == StudioActionRepository.TYPE_SELECT_CREATE) {
      addCreateCode(studioAction, stb, level);
    }

    addRootFunction(studioAction, stb, level);

    scriptCodeBinding.put("fbuilder", Joiner.on("").join(fbuilder));
    return groovyTemplateService.createXmlWithGroovyTemplate(
        SCRIPT_CODE_TEMPLATE_PATH, scriptCodeBinding);
  }

  @Override
  public void addCreateCode(StudioAction studioAction, StringBuilder stb, int level) {
    String targetModel = studioAction.getTargetModel();
    isCreate = true;

    if (Boolean.TRUE.equals(studioAction.getOpenRecord())) {
      addOpenRecord(studioAction.getIsJson(), targetModel);
    }

    scriptCodeBinding.put(
        "displayMsgNotEmpty", !Strings.isNullOrEmpty(studioAction.getDisplayMsg()));
    if (!Strings.isNullOrEmpty(studioAction.getDisplayMsg())) {
      scriptCodeBinding.put("displayMsg", studioAction.getDisplayMsg());
    }
  }

  @Override
  public void addOpenRecord(boolean isJson, String targetModel) {
    if (isJson) {
      String title = inflector.humanize(targetModel);
      scriptCodeBinding.put("title", title);
    } else {
      String title = inflector.humanize(targetModel.substring(targetModel.lastIndexOf('.') + 1));
      scriptCodeBinding.put("title", title);
    }
  }

  @Override
  public void addRootFunction(StudioAction studioAction, StringBuilder stb, int level) {
    List<StudioActionLine> lines = studioAction.getLines();
    boolean isJsonField = lines.stream().anyMatch(l -> l.getIsTargetJson());
    scriptCodeBinding.put("isJsonField", isJsonField);
    addFieldsBinding("target", studioAction.getLines(), level + 1, isJsonField);
  }

  @Override
  public String format(String line, int level) {

    return "\n" + Strings.repeat(INDENT, level) + line;
  }

  @Override
  public String addFieldsBinding(
      String target, List<StudioActionLine> lines, int level, boolean json) {

    StringBuilder stb = new StringBuilder();

    lines.sort(
        (l1, l2) -> {
          if (l1.getDummy() && !l2.getDummy()) {
            return -1;
          }
          if (!l1.getDummy() && l2.getDummy()) {
            return 1;
          }
          return 0;
        });

    if (json) {
      computeAttrsField(target, lines);
    }

    List<Map<String, Object>> lineMaps = new ArrayList<>();
    for (StudioActionLine line : lines) {
      Map<String, Object> lineMap = new HashMap<>();
      String name = line.getName();
      String value = line.getValue();
      if (value != null && value.contains(".sum(")) {
        value = getSum(value, line.getFilter());
      }
      lineMap.put("isDummy", Boolean.TRUE.equals(line.getDummy()));
      if (Boolean.TRUE.equals(line.getDummy())) {
        lineMap.put("name", name);
        lineMap.put("value", value);

        stb.append(format("_$." + name + " = " + value + ";", level));
        continue;
      }

      MetaJsonField jsonField = line.getMetaJsonField();
      MetaField metaField = line.getMetaField();

      if (value != null
          && metaField != null
          && metaField.getTypeName().equals(BigDecimal.class.getSimpleName())) {
        value = "new BigDecimal(" + value + ")";
      }

      if (Boolean.TRUE.equals(line.getIsTargetJson() && jsonField != null)
          && (jsonField.getTargetJsonModel() != null || jsonField.getTargetModel() != null)) {
        value = addRelationalBinding(line, target, true, lineMap);
      } else if (Boolean.TRUE.equals(!line.getIsTargetJson() && metaField != null)
          && metaField.getRelationship() != null) {
        value = addRelationalBinding(line, target, false, lineMap);
      }

      lineMap.put("value", value);
      lineMap.put("name", name);
      lineMap.put("target", target);

      String condition = line.getConditionText();
      lineMap.put("conditionNotNull", condition != null);
      lineMap.put("condition", condition);
      lineMap.put("jsonFieldNotNull", jsonField != null);

      if (condition != null) {
        if (jsonField != null && json) {
          String attrsField = jsonField.getModelField();
          lineMap.put("attrsField", attrsField);
          stb.append(
              format(
                  "if(" + condition + "){" + attrsField + "." + name + " = " + value + ";}",
                  level));

        } else {
          stb.append(
              format("if(" + condition + "){" + target + "." + name + " = " + value + ";}", level));
        }

      } else {
        if (jsonField != null && json) {
          String attrsField = jsonField.getModelField();
          lineMap.put("attrsField", attrsField);
          stb.append(format(attrsField + "." + name + " = " + value + ";", level));
        } else {
          stb.append(format(target + "." + name + " = " + value + ";", level));
        }
      }
      lineMaps.add(lineMap);
    }
    scriptCodeBinding.put("lineMaps", lineMaps);

    if (json) {
      Set<String> attrsFields = getAttrsFields(lines);
      List<Map<String, Object>> attrsFieldMaps = new ArrayList<>();
      attrsFields.forEach(
          attrsField -> {
            Map<String, Object> attrsFieldMap = new HashMap<>();
            attrsFieldMap.put("target", target);
            attrsFieldMap.put("attrsField", attrsField);
            stb.append(
                format(
                    target + "." + attrsField + " = JSON.stringify(" + attrsField + ");", level));
            attrsFieldMaps.add(attrsFieldMap);
          });
      scriptCodeBinding.put("jsonAttrsFields", attrsFieldMaps);
    }

    return stb.toString();
  }

  @Override
  public void computeAttrsField(String target, List<StudioActionLine> lines) {

    Set<String> attrsFields = getAttrsFields(lines);
    List<Map<String, Object>> attrsFieldMapList = new ArrayList<>();
    attrsFields.forEach(
        attrsField -> {
          Map<String, Object> attrsFieldMap = new HashMap<>();
          attrsFieldMap.put("target", target);
          attrsFieldMap.put("attrsField", attrsField);
          attrsFieldMapList.add(attrsFieldMap);
        });
    scriptCodeBinding.put("attrsFields", attrsFieldMapList);
  }

  @Override
  public Set<String> getAttrsFields(List<StudioActionLine> lines) {
    return lines.stream()
        .filter(l -> l.getIsTargetJson())
        .map(l -> l.getMetaJsonField().getModelField())
        .collect(Collectors.toSet());
  }

  @Override
  public String addRelationalBinding(
      StudioActionLine line, String target, boolean json, Map<String, Object> lineMap) {

    line = studioActionLineRepo.find(line.getId());
    String subCode = null;

    String type =
        json
            ? line.getMetaJsonField().getType()
            : inflector.dasherize(line.getMetaField().getRelationship());
    lineMap.put("type", type);
    switch (type) {
      case MANY_TO_ONE:
        subCode = addM2OBinding(line, true, true, json);
        break;
      case MANY_TO_MANY:
        subCode = addM2MBinding(line, json);
        break;
      case ONE_TO_MANY:
        subCode = addO2MBinding(line, target, json);
        break;
      case ONE_TO_ONE:
        subCode = addM2OBinding(line, true, true, json);
        break;
      case JSON_MANY_TO_ONE:
        subCode = addJsonM2OBinding(line, true, true, json);
        break;
      case JSON_MANY_TO_MANY:
        subCode = addJsonM2MBinding(line);
        break;
      case JSON_ONE_TO_MANY:
        subCode = addJsonO2MBinding(line);
        break;
      default:
        throw new IllegalArgumentException("Unknown type");
    }

    return subCode + "($," + line.getValue() + ", _$)";
  }

  @Override
  public String getTargetModel(StudioActionLine line) {

    MetaJsonField jsonField = line.getMetaJsonField();

    String targetModel = "";
    if (jsonField != null && jsonField.getTargetModel() != null) {
      targetModel = jsonField.getTargetModel();
    }

    MetaField field = line.getMetaField();
    if (field != null && field.getTypeName() != null) {
      targetModel = field.getTypeName();
    }

    return targetModel;
  }

  @Override
  public String getTargetJsonModel(StudioActionLine line) {

    MetaJsonField jsonField = line.getMetaJsonField();

    if (jsonField != null) {
      return jsonField.getTargetJsonModel().getName();
    }

    return "";
  }

  @Override
  public String getRootSourceModel(StudioActionLine line) {

    if (line.getStudioAction() != null) {
      return line.getStudioAction().getModel();
    }

    return null;
  }

  @Override
  public String getSourceModel(StudioActionLine line) {

    MetaJsonField jsonField = line.getValueJson();

    String sourceModel = null;
    Object targetObject = null;

    try {
      if (jsonField != null && jsonField.getTargetModel() != null) {
        if (line.getValue() != null && !line.getValue().contentEquals("$." + jsonField.getName())) {
          targetObject =
              filterSqlService.parseJsonField(
                  jsonField, line.getValue().replace("$.", ""), null, null);
        } else {
          sourceModel = jsonField.getTargetModel();
        }
      }

      MetaField field = line.getValueField();
      if (field != null && field.getTypeName() != null) {
        if (line.getValue() != null && !line.getValue().contentEquals("$." + field.getName())) {
          targetObject =
              filterSqlService.parseMetaField(
                  field, line.getValue().replace("$.", ""), null, null, false);
        } else {
          sourceModel = field.getTypeName();
        }
      }
    } catch (Exception e) {
      ExceptionHelper.trace(e);
    }

    if (sourceModel == null && line.getValue() != null && line.getValue().equals("$")) {
      sourceModel = getRootSourceModel(line);
    }

    if (sourceModel == null && line.getValue() != null && line.getValue().equals("$$")) {
      sourceModel = getRootSourceModel(line);
    }

    if (targetObject != null) {
      if (targetObject instanceof MetaJsonField) {
        sourceModel = ((MetaJsonField) targetObject).getTargetModel();
      } else if (targetObject instanceof MetaField) {
        sourceModel = ((MetaField) targetObject).getTypeName();
      }
    }

    return sourceModel;
  }

  @Override
  public void addObjToJson() {
    if (isObjToJson) {
      return;
    }
    isObjToJson = true;
    StringBuilder stb = new StringBuilder();
    fbuilder.add(stb);
    stb.append(format("", 5));
    stb.append(format("function objToJson($){", 3));
    stb.append(format("var obj = {};", 4));
    stb.append(format("var map = com.axelor.db.mapper.Mapper.toMap($);", 4));
    stb.append(format("map.forEach(function(key, value){", 4));
    stb.append(format("obj[key] = value;", 5));
    stb.append(format("});", 4));
    stb.append(format("return obj;", 4));
    stb.append(format("}", 3));
  }

  @Override
  public String addM2OBinding(StudioActionLine line, boolean search, boolean filter, boolean json) {

    String fname = "setVar" + varCount;
    varCount += 1;

    String tModel = getTargetModel(line);
    String srcModel = getSourceModel(line);

    StringBuilder stb = new StringBuilder();
    fbuilder.add(stb);
    if (tModel.contains(".")) {
      tModel = tModel.substring(tModel.lastIndexOf('.') + 3);
    }
    stb.append(format("", 5));
    stb.append(format("function " + fname + "($$, $, _$){", 3));
    stb.append(format("var val = null;", 4));
    if (srcModel != null) {
      stb.append(format("if ($ != null && $.id != null){", 4));
      srcModel = srcModel.substring(srcModel.lastIndexOf('.') + 5);
      stb.append(format("$ = $em.find(" + srcModel + ".class, $.id);", 5));
      log.debug("src model: {}, Target model: {}", srcModel, tModel);
      if (srcModel.contentEquals(tModel)) {
        stb.append(format("val = $", 5));
      }
      stb.append(format("}", 4));
    }

    if (filter && line.getFilter() != null) {
      if (line.getValue() != null) {
        stb.append(format("var map = com.axelor.db.mapper.Mapper.toMap($);", 4));
      } else {
        stb.append(format("var map = com.axelor.db.mapper.Mapper.toMap($$);", 4));
      }
      stb.append(format("val = " + getQuery(tModel, line.getFilter(), false, false), 4));
    } else if (srcModel == null) {
      stb.append(format("val = $;", 4));
    }

    List<StudioActionLine> lines = line.getSubLines();
    if (lines != null && !lines.isEmpty()) {
      boolean isJsonField = lines.stream().anyMatch(l -> l.getIsTargetJson());

      stb.append(format("if (!val) {", 4));
      stb.append(format("val = new " + tModel + "();", 5));
      stb.append(format("}", 4));
      stb.append(addFieldsBinding("val", lines, 4, isJsonField));
      // stb.append(format("$em.persist(val);", 2));
    }
    if (json) {
      addObjToJson();
      stb.append(format("return objToJson(val);", 4));
    } else {
      stb.append(format("return val;", 4));
    }
    stb.append(format("}", 3));

    return fname;
  }

  @Override
  public String addM2MBinding(StudioActionLine line, boolean json) {

    String fname = "setVar" + varCount;
    varCount += 1;
    StringBuilder stb = new StringBuilder();
    fbuilder.add(stb);
    stb.append(format("", 5));
    stb.append(format("function " + fname + "($$, $, _$){", 3));
    stb.append(format("var val = " + (json ? "[];" : "new HashSet();"), 4));
    if (line.getFilter() != null) {
      String model = getTargetModel(line);
      stb.append(format("var map = com.axelor.db.mapper.Mapper.toMap($$);", 4));
      stb.append(format("val.addAll(" + getQuery(model, line.getFilter(), false, true) + ");", 4));
      stb.append(format("if(!val.empty){return val;}", 4));
    }

    stb.append(format("if(!$){return val;}", 4));
    stb.append(format("$.forEach(function(v){", 4));
    stb.append(format("v = " + addM2OBinding(line, true, false, json) + "($$, v, _$);", 5));
    stb.append(format(json ? "val.push(v);" : "val.add(v);", 5));
    stb.append(format("});", 4));
    stb.append(format("return val;", 4));
    stb.append(format("}", 3));

    return fname;
  }

  @Override
  public String addO2MBinding(StudioActionLine line, String target, boolean json) {

    String fname = "setVar" + varCount;
    varCount += 1;
    StringBuilder stb = new StringBuilder();
    fbuilder.add(stb);
    stb.append(format("", 5));
    stb.append(format("function " + fname + "($$, $, _$){", 3));
    stb.append(format("var val = " + (json ? "[];" : "new ArrayList();"), 4));
    stb.append(format("if(!$){return val;}", 4));
    stb.append(format("$.forEach(function(v){", 4));
    stb.append(format("var item = " + addM2OBinding(line, false, false, json) + "($$, v, _$);", 5));
    if (isCreate && line.getMetaField() != null && line.getMetaField().getMappedBy() != null) {
      stb.append(format("item." + line.getMetaField().getMappedBy() + " = " + target, 5));
    }
    stb.append(format(json ? "val.push(item);" : "val.add(item);", 5));
    stb.append(format("});", 4));
    stb.append(format("return val;", 4));
    stb.append(format("}", 3));

    return fname;
  }

  @Override
  public String addJsonM2OBinding(
      StudioActionLine line, boolean search, boolean filter, boolean json) {

    String fname = "setVar" + varCount;
    varCount += 1;

    StringBuilder stb = new StringBuilder();
    fbuilder.add(stb);
    String model = getTargetJsonModel(line);
    stb.append(format("", 5));
    stb.append(format("function " + fname + "($$, $, _$){", 3));
    stb.append(format("var val = null;", 4));
    // stb.append(format("if ($ != null && $.id != null){", 4));
    // stb.append(format("$ = $json.find($.id);", 5));
    if (search) {
      stb.append(format("if ($ != null && $.id != null) {", 4));
      stb.append(format("val = $json.find($.id);", 5));
      stb.append(format("if (val.jsonModel != '" + model + "'){val = null;} ", 5));
      stb.append(format("}", 4));
    }
    // stb.append(format("}",2));
    if (filter && line.getFilter() != null) {
      String query = getQuery(model, line.getFilter(), true, false);
      stb.append(format("val = " + query, 4));
    }
    List<StudioActionLine> lines = line.getSubLines();
    if (lines != null && !lines.isEmpty()) {
      stb.append(format("if (!val) {", 4));
      stb.append(format("val = $json.create('" + model + "');", 5));
      stb.append(format("}", 4));
      stb.append(format("else {", 4));
      stb.append(format("val = $json.create(val);", 5));
      stb.append(format("}", 4));
      stb.append(addFieldsBinding("val", lines, 4, false));
      stb.append(format("val = $json.save(val);", 4));
    }
    if (json) {
      addObjToJson();
      stb.append(format("return objToJson(val);", 4));
    } else {
      stb.append(format("return val;", 4));
    }
    stb.append(format("}", 3));

    return fname;
  }

  @Override
  public String addJsonM2MBinding(StudioActionLine line) {

    String fname = "setVar" + varCount;
    varCount += 1;
    StringBuilder stb = new StringBuilder();
    fbuilder.add(stb);
    stb.append(format("", 5));
    stb.append(format("function " + fname + "($$, $, _$){", 3));
    stb.append(format("var val = [];", 4));
    if (line.getFilter() != null) {
      String model = getTargetJsonModel(line);
      stb.append(format("val.addAll(" + getQuery(model, line.getFilter(), true, true) + ");", 4));
      stb.append(format("if(!val.empty){return val;}", 4));
    }
    stb.append(format("if(!$){return val;}", 4));
    stb.append(format("$.forEach(function(v){", 4));
    stb.append(format("v = " + addJsonM2OBinding(line, true, false, true) + "($$, v, _$);", 5));
    stb.append(format("val.push(v);", 5));
    stb.append(format("});", 4));
    stb.append(format("return val;", 4));
    stb.append(format("}", 3));

    return fname;
  }

  @Override
  public String addJsonO2MBinding(StudioActionLine line) {

    String fname = "setVar" + varCount;
    varCount += 1;
    StringBuilder stb = new StringBuilder();
    fbuilder.add(stb);
    stb.append(format("", 5));
    stb.append(format("function " + fname + "($$, $, _$){", 3));
    stb.append(format("var val = [];", 4));
    stb.append(format("if(!$){return val;}", 4));
    stb.append(format("$.forEach(function(v){", 4));
    stb.append(format("v = " + addJsonM2OBinding(line, false, false, true) + "($$, v, _$);", 5));
    stb.append(format("val.push(v);", 5));
    stb.append(format("});", 4));
    stb.append(format("return val;", 4));
    stb.append(format("}", 3));

    return fname;
  }

  @Override
  public String getQuery(String model, String filter, boolean json, boolean all) {

    if (model.contains(".")) {
      model = model.substring(model.lastIndexOf('.') + 1);
    }

    String nRecords = "fetchOne()";
    if (all) {
      nRecords = "fetch()";
    }

    String query = null;

    if (json) {
      query = "$json.all('" + model + "').by(" + filter + ")." + nRecords;
    } else {
      query =
          "__repo__("
              + model
              + ".class).all().filter(\""
              + filter
              + "\").bind(map).bind(_$)."
              + nRecords;
    }

    return query;
  }

  @Override
  public String getSum(String value, String filter) {

    value = value.substring(0, value.length() - 1);
    String[] expr = value.split("\\.sum\\(");

    String fname = "setVar" + varCount;
    varCount += 1;

    StringBuilder stb = new StringBuilder();
    stb.append(format("", 5));
    stb.append(format("function " + fname + "(sumOf$, $$, filter){", 3));
    stb.append(format("var val  = 0", 4));
    stb.append(format("if (sumOf$ == null){ return val;}", 4));
    stb.append(format("sumOf$.forEach(function($){", 4));
    // stb.append(format("if ($ instanceof MetaJsonRecord){ $ =
    // $json.create($json.find($.id)); }",
    // 5));
    String val = "val += " + expr[1] + ";";
    if (filter != null) {
      val = "if(filter){" + val + "}";
    }
    stb.append(format(val, 5));
    stb.append(format("})", 4));
    stb.append(format("return new BigDecimal(val);", 4));
    stb.append(format("}", 3));

    fbuilder.add(stb);
    return fname + "(" + expr[0] + ",$," + filter + ")";
  }
}
