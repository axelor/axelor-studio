/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.ls;

import com.axelor.studio.ls.annotation.LinkScriptBinding;
import com.axelor.studio.ls.annotation.LinkScriptFunction;
import com.axelor.studio.service.AppSettingsStudioService;
import com.google.inject.Singleton;
import jakarta.inject.Inject;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.HashMap;
import java.util.Map;
import java.util.function.BiConsumer;
import org.codehaus.groovy.control.customizers.ImportCustomizer;
import org.reflections.Reflections;
import org.reflections.scanners.Scanners;
import org.reflections.util.ConfigurationBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Singleton
public class LinkScriptBindingsServiceImpl implements LinkScriptBindingsService {

  protected static final Logger LOG = LoggerFactory.getLogger(LinkScriptBindingsServiceImpl.class);

  protected final AppSettingsStudioService appSettingsStudioService;
  protected final Map<String, Object> linkScriptBindings;
  protected final ImportCustomizer importCustomizer;

  @Inject
  public LinkScriptBindingsServiceImpl(AppSettingsStudioService appSettingsStudioService) {
    this.appSettingsStudioService = appSettingsStudioService;
    this.linkScriptBindings = new HashMap<>();
    this.importCustomizer = new ImportCustomizer();
    importCustomizer.addStarImports("groovy.json");
    importCustomizer.addStarImports("groovy.sql");
  }

  @Override
  public void loadBindings() {
    var configurationBuilder = new ConfigurationBuilder().forPackages("com.axelor");
    var packages = appSettingsStudioService.getPackagesToScan();
    if (packages != null && packages.length > 0) {
      configurationBuilder.forPackages(packages);
    }
    configurationBuilder.setScanners(Scanners.TypesAnnotated, Scanners.MethodsAnnotated);
    Reflections reflections = new Reflections(configurationBuilder);
    loadStaticMethods(reflections);
    loadBindings(reflections);
  }

  @Override
  public ImportCustomizer getImportCustomizer() {
    return importCustomizer;
  }

  protected void loadStaticMethods(Reflections reflections) {
    var methods = reflections.getMethodsAnnotatedWith(LinkScriptFunction.class);
    for (Method method : methods) {
      if (!Modifier.isStatic(method.getModifiers())) {
        LOG.warn(
            "LinkScript function: {}.{} is not static and will not be registered",
            method.getDeclaringClass().getName(),
            method.getName());
        continue;
      }
      LOG.info(
          "Registering LinkScript function: {}.{} as {}",
          method.getDeclaringClass().getName(),
          method.getName(),
          method.getAnnotation(LinkScriptFunction.class).value());
      importCustomizer.addStaticImport(
          method.getAnnotation(LinkScriptFunction.class).value(),
          method.getDeclaringClass().getName(),
          method.getName());
    }
  }

  protected void loadBindings(Reflections reflections) {
    var classes = reflections.getTypesAnnotatedWith(LinkScriptBinding.class);
    for (Class<?> klass : classes) {
      LOG.info("Registering LinkScript binding: {}", klass.getName());
      linkScriptBindings.put(klass.getAnnotation(LinkScriptBinding.class).value(), klass);
    }
    var methods = reflections.getMethodsAnnotatedWith(LinkScriptBinding.class);
    for (Method method : methods) {
      if (!Modifier.isStatic(method.getModifiers())) {
        LOG.warn(
            "LinkScript binding: {}.{} is not static and will not be registered",
            method.getDeclaringClass().getName(),
            method.getName());
        continue;
      }
      if (method.getParameterCount() != 0) {
        LOG.warn(
            "LinkScript binding: {}.{} has parameters and will not be registered",
            method.getDeclaringClass().getName(),
            method.getName());
        continue;
      }
      LOG.info(
          "Registering LinkScript binding: {}.{} as {}",
          method.getDeclaringClass().getName(),
          method.getName(),
          method.getAnnotation(LinkScriptBinding.class).value());
      try {
        linkScriptBindings.put(
            method.getAnnotation(LinkScriptBinding.class).value(), method.invoke(null));
      } catch (IllegalAccessException | InvocationTargetException e) {
        LOG.error(
            "Error while registering LinkScript binding: {}.{}",
            method.getDeclaringClass().getName(),
            method.getName(),
            e);
      }
    }
  }

  @Override
  public void consumeBindings(BiConsumer<String, Object> consumer) {
    linkScriptBindings.forEach(consumer);
  }
}
