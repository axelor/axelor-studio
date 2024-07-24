package com.axelor.studio.service.constructor;

import com.axelor.text.GroovyTemplates;
import com.axelor.utils.helpers.ExceptionHelper;
import com.google.common.io.Resources;
import com.google.inject.Inject;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.Map;

public class GroovyTemplateServiceImpl implements GroovyTemplateService {
  protected GroovyTemplates templates;

  @Inject
  public GroovyTemplateServiceImpl(GroovyTemplates templates) {
    this.templates = templates;
  }

  @Override
  public String createXmlWithGroovyTemplate(String templatePath, Map<String, Object> binding) {
    String xml = "";
    try {
      try (Reader reader =
          new InputStreamReader(Resources.getResource(templatePath).openStream())) {
        xml = templates.from(reader).make(binding).render();
      }
    } catch (IOException e) {
      ExceptionHelper.trace(e);
    }
    return removeEmptyLines(xml);
  }

  protected String removeEmptyLines(String xml) {
    return xml.replaceAll("(?m)^[ \t]*\r?\n", "");
  }
}
