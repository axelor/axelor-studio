package com.axelor.studio.service.constructor.components.expressions;

import com.axelor.common.Inflector;
import com.axelor.studio.service.constructor.components.expressions.dto.ConditionDto;
import com.axelor.studio.service.constructor.components.expressions.dto.ElementDto;
import com.axelor.studio.service.constructor.components.expressions.dto.ExpressionDto;
import com.axelor.studio.service.constructor.components.expressions.dto.RuleDto;
import com.axelor.studio.service.constructor.components.expressions.dto.ScriptDto;
import com.axelor.studio.service.constructor.components.expressions.dto.TransformationDto;
import com.axelor.text.GroovyTemplates;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.io.Resources;
import com.google.inject.Inject;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.List;
import java.util.Map;
import org.apache.groovy.util.Maps;

public class GroovyScriptBuilderServiceImpl implements GroovyScriptBuilderService {
  protected final GroovyTemplates groovyTemplates;
  protected static final String SCRIPT_TEMPLATE_PATH = "templates/groovyScript.tmpl";
  protected static final String EXPRESSION_TEMPLATE_PATH = "templates/groovyExpression.tmpl";
  protected static final String CONDITION_TEMPLATE_PATH = "templates/groovyCondition.tmpl";
  protected static final String FIELD_NAME_TEMPLATE_PATH = "templates/groovyFieldName.tmpl";
  protected static final String RULE_TEMPLATE_PATH = "templates/groovyRule.tmpl";
  protected static final String TRANSFORMATION_TEMPLATE_PATH = "templates/transformation.tmpl";

  @Inject
  public GroovyScriptBuilderServiceImpl(GroovyTemplates groovyTemplates) {
    this.groovyTemplates = groovyTemplates;
  }

  @Override
  public String build(Map<String, Object> scriptValue) {
    ScriptDto scriptDto = buildScriptDto(scriptValue);
    try {
      return buildScript(scriptDto);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  public String buildScript(ScriptDto scriptDto) throws IOException {
    Map<String, Object> bindings =
        Maps.of(
            "script",
            scriptDto,
            "__inflector__",
            Inflector.getInstance(),
            "groovyScriptService",
            this);
    return groovyTemplates
        .from(new InputStreamReader(Resources.getResource(SCRIPT_TEMPLATE_PATH).openStream()))
        .make(bindings)
        .render();
  }

  public String buildExpression(Map<String, Object> expression) {
    try {
      return buildCondition(buildConditionDto(expression));
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  protected String buildCondition(ConditionDto conditionDto) throws IOException {
    Map<String, Object> bindings =
        Maps.of(
            "condition",
            conditionDto,
            "__inflector__",
            Inflector.getInstance(),
            "groovyScriptService",
            this);
    return groovyTemplates
        .from(new InputStreamReader(Resources.getResource(CONDITION_TEMPLATE_PATH).openStream()))
        .make(bindings)
        .render();
  }

  public String buildExpression(ExpressionDto expressionDto, ConditionDto conditionDto)
      throws IOException {
    Map<String, Object> bindings =
        Maps.of(
            "expression",
            expressionDto,
            "condition",
            conditionDto,
            "__inflector__",
            Inflector.getInstance(),
            "groovyScriptService",
            this);
    return groovyTemplates
        .from(new InputStreamReader(Resources.getResource(EXPRESSION_TEMPLATE_PATH).openStream()))
        .make(bindings)
        .render();
  }

  public String buildRule(RuleDto rule, String modelFullName) throws IOException {
    Map<String, Object> bindings =
        Maps.of(
            "rule",
            rule,
            "metaModelVarName",
            modelFullName,
            "__inflector__",
            Inflector.getInstance(),
            "groovyScriptService",
            this);
    return groovyTemplates
        .from(new InputStreamReader(Resources.getResource(RULE_TEMPLATE_PATH).openStream()))
        .make(bindings)
        .render();
  }

  public String buildFieldName(List<ElementDto> fields) throws IOException {
    Map<String, Object> bindings =
        Maps.of(
            "fields",
            fields,
            "__inflector__",
            Inflector.getInstance(),
            "groovyScriptService",
            this);
    return groovyTemplates
        .from(new InputStreamReader(Resources.getResource(FIELD_NAME_TEMPLATE_PATH).openStream()))
        .make(bindings)
        .render();
  }

  public String buildTransformation(List<TransformationDto> transformations, String target)
      throws IOException {
    Map<String, Object> bindings =
        Maps.of(
            "transformations",
            transformations,
            "target",
            target,
            "__inflector__",
            Inflector.getInstance(),
            "groovyScriptService",
            this);
    return groovyTemplates
        .from(
            new InputStreamReader(Resources.getResource(TRANSFORMATION_TEMPLATE_PATH).openStream()))
        .make(bindings)
        .render();
  }

  protected ScriptDto buildScriptDto(Map<String, Object> scriptValue) {
    ObjectMapper objectMapper = new ObjectMapper();
    return objectMapper.convertValue(scriptValue, ScriptDto.class);
  }

  protected ConditionDto buildConditionDto(Map<String, Object> scriptValue) {
    ObjectMapper objectMapper = new ObjectMapper();
    return objectMapper.convertValue(scriptValue, ConditionDto.class);
  }
}
