package com.axelor.studio.service.constructor.components.expressions;

import java.util.Map;

public interface GroovyScriptBuilderService {
  String build(Map<String, Object> scriptValue);

  String buildExpression(Map<String, Object> expression);
}
