package com.axelor.studio.ls.script;

import com.google.common.cache.CacheLoader;
import groovy.lang.GroovyClassLoader;
import javax.annotation.Nonnull;

public class LinkScriptCacheLoader extends CacheLoader<String, Class<?>> {
  private final GroovyClassLoader GCL;

  public LinkScriptCacheLoader(GroovyClassLoader gcl) {
    GCL = gcl;
  }

  @Override
  public @Nonnull Class<?> load(@Nonnull String code) {
    try {
      return GCL.parseClass(code);
    } finally {
      GCL.clearCache();
    }
  }
}
