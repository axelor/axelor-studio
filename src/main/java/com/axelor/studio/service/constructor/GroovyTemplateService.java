package com.axelor.studio.service.constructor;

import java.util.Map;

public interface GroovyTemplateService {
  String createXmlWithGroovyTemplate(String templatePath, Map<String, Object> binding);
}
