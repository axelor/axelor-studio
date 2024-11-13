package com.axelor.studio.ls.script;

import com.axelor.app.AvailableAppSettings;
import com.axelor.db.JPA;
import com.axelor.db.JpaRepository;
import com.axelor.db.JpaScanner;
import com.axelor.db.Model;
import com.axelor.script.AbstractScriptHelper;
import com.google.common.cache.CacheBuilder;
import com.google.common.cache.LoadingCache;
import groovy.lang.GroovyClassLoader;
import groovy.lang.Script;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import javax.persistence.EntityManager;
import javax.script.Bindings;
import org.codehaus.groovy.control.CompilerConfiguration;
import org.codehaus.groovy.control.customizers.ImportCustomizer;

public class LinkScriptGroovyScriptHelper extends AbstractScriptHelper {

  protected static final CompilerConfiguration config = new CompilerConfiguration();

  protected static final int DEFAULT_CACHE_SIZE = 500;
  protected static final int DEFAULT_CACHE_EXPIRE_TIME = 60;
  protected static final GroovyClassLoader GCL;
  protected static final LoadingCache<String, Class<?>> SCRIPT_CACHE;

  static {
    config.getOptimizationOptions().put("indy", Boolean.TRUE);
    config.getOptimizationOptions().put("int", Boolean.FALSE);

    final ImportCustomizer importCustomizer = new ImportCustomizer();

    importCustomizer.addStaticImport("__repo__", Helpers.class.getName(), "repoOf");
    importCustomizer.addStaticImport(Helpers.class.getName(), "doInJPA");

    importCustomizer.addImports("java.time.ZonedDateTime");
    importCustomizer.addImports("java.time.LocalDateTime");
    importCustomizer.addImports("java.time.LocalDate");
    importCustomizer.addImports("java.time.LocalTime");

    config.addCompilationCustomizers(importCustomizer);

    int cacheSize = get(AvailableAppSettings.APPLICATION_SCRIPT_CACHE_SIZE, DEFAULT_CACHE_SIZE);

    int cacheExpireTime =
        get(AvailableAppSettings.APPLICATION_SCRIPT_CACHE_EXPIRE_TIME, DEFAULT_CACHE_EXPIRE_TIME);

    GCL = new GroovyClassLoader(JpaScanner.getClassLoader(), config);

    SCRIPT_CACHE =
        CacheBuilder.newBuilder()
            .maximumSize(cacheSize)
            .expireAfterAccess(cacheExpireTime, TimeUnit.MINUTES)
            .build(new LinkScriptCacheLoader(GCL));
  }

  protected static int get(String property, int defaultValue) {
    int cacheSize;
    try {
      cacheSize = Integer.parseInt(System.getProperty(property));
    } catch (Exception e) {
      cacheSize = defaultValue;
    }
    if (cacheSize <= 0) cacheSize = defaultValue;
    return cacheSize;
  }

  public LinkScriptGroovyScriptHelper(Bindings bindings, ImportCustomizer importCustomizer) {
    this.setBindings(bindings);
    config.addCompilationCustomizers(importCustomizer);
  }

  @Override
  public Object eval(String expr, Bindings bindings) throws Exception {
    Class<?> klass = SCRIPT_CACHE.get(expr);
    Script script = (Script) klass.getDeclaredConstructor().newInstance();
    script.setBinding(new LinkScriptBinding(bindings));
    return script.run();
  }

  public static class Helpers {
    @SuppressWarnings("unchecked")
    public static <T> T doInJPA(Function<EntityManager, T> task) {
      final Object[] result = {null};
      JPA.runInTransaction(() -> result[0] = task.apply(JPA.em()));
      return (T) result[0];
    }

    public static JpaRepository<? extends Model> repoOf(Class<?> klass) {
      Class<?> k =
          Model.class.isAssignableFrom(klass) ? klass : JpaScanner.findModel(klass.getSimpleName());
      return JpaRepository.of(k.asSubclass(Model.class));
    }
  }
}
