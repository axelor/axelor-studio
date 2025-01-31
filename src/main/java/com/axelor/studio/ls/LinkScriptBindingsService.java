package com.axelor.studio.ls;

import java.util.function.BiConsumer;
import org.codehaus.groovy.control.customizers.ImportCustomizer;

public interface LinkScriptBindingsService {
  void loadBindings();

  ImportCustomizer getImportCustomizer();

  void consumeBindings(BiConsumer<String, Object> consumer);
}
