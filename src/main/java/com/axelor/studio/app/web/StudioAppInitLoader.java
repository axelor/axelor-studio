package com.axelor.studio.app.web;

import com.axelor.app.AppSettings;
import com.axelor.common.FileUtils;
import com.axelor.common.YamlUtils;
import com.axelor.db.JPA;
import com.axelor.db.mapper.Mapper;
import com.axelor.db.mapper.Property;
import com.axelor.inject.Beans;
import com.axelor.meta.MetaFiles;
import com.axelor.meta.MetaScanner;
import com.axelor.meta.db.MetaFile;
import com.axelor.meta.db.MetaModule;
import com.axelor.meta.db.repo.MetaModuleRepository;
import com.axelor.studio.db.App;
import com.axelor.studio.db.repo.AppRepository;
import com.axelor.utils.ExceptionTool;
import com.google.common.io.ByteStreams;
import com.google.common.io.Files;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import org.aopalliance.intercept.MethodInterceptor;
import org.aopalliance.intercept.MethodInvocation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class StudioAppInitLoader implements MethodInterceptor {

  private static final Logger log = LoggerFactory.getLogger(StudioAppInitLoader.class);

  private static final String DATA_DIR_NAME = "data-apps";

  private static final String APP_IMAGE = "image";
  private static final String APP_MODULES = "modules";
  private static final String APP_DEPENDS_ON = "dependsOn";

  private boolean isAppInit = false;

  protected MetaFiles metaFiles;
  protected AppRepository appRepo;

  @Override
  public Object invoke(MethodInvocation invocation) throws Throwable {
    Object obj = invocation.proceed();
    if (!isAppInit) {
      initApps();
    }
    return obj;
  }

  private void initApps() {
    final List<MetaModule> modules = Beans.get(MetaModuleRepository.class).all().fetch();
    final String dirName = this.getDirName();

    for (MetaModule module : modules) {

      File tmp = extract(module, dirName);
      if (tmp == null) {
        continue;
      }

      try {
        File dataDir = new File(tmp, dirName);

        File[] dataFiles =
            dataDir.listFiles((dir, name) -> name.endsWith(".yml") || name.endsWith(".yaml"));

        if (dataFiles.length == 0) {
          continue;
        }

        metaFiles = Beans.get(MetaFiles.class);
        appRepo = Beans.get(AppRepository.class);

        Map<App, Object> appDependsOnMap = new HashMap<>();

        for (File dataFile : dataFiles) {
          importApp(dataFile, appDependsOnMap);
        }

        setDependsOn(appDependsOnMap);

      } catch (Exception e) {
        ExceptionTool.trace(e);
      } finally {
        clean(tmp);
      }
    }
    isAppInit = true;
  }

  private void importApp(File dataFile, Map<App, Object> appDependsOnMap) throws IOException {

    log.debug("Running import app with data path: {}", dataFile.getAbsolutePath());

    Map<String, Object> appDataMap = YamlUtils.loadYaml(dataFile);

    Mapper mapper = Mapper.of(App.class);
    App app = new App();

    for (Entry<String, Object> entry : appDataMap.entrySet()) {
      Property property = mapper.getProperty(entry.getKey());
      if (property == null) {
        continue;
      }

      if (property.getName().equals(APP_IMAGE) && entry.getValue() != null) {
        String image = entry.getValue().toString();
        importAppImage(app, mapper, property, image, dataFile);
        continue;
      }

      if (property.getName().equals(APP_MODULES) && entry.getValue() != null) {
        String modules = entry.getValue().toString().replace(" ", ",");
        mapper.set(app, property.getName(), modules);
        continue;
      }

      mapper.set(app, property.getName(), entry.getValue() != null ? entry.getValue() : null);
    }

    if (app.getLanguageSelect() == null) {
      String language = AppSettings.get().get("application.locale");
      app.setLanguageSelect(language);
    }

    saveApp(app);

    if (appDataMap.containsKey(APP_DEPENDS_ON) && appDataMap.get(APP_DEPENDS_ON) != null) {
      appDependsOnMap.put(app, appDataMap.get(APP_DEPENDS_ON));
    }
  }

  public void saveApp(App app) {
    if (!JPA.em().getTransaction().isActive()) {
      JPA.em().getTransaction().begin();
    }

    appRepo.save(app);

    JPA.em().getTransaction().commit();
  }

  @SuppressWarnings("unchecked")
  private void setDependsOn(Map<App, Object> appDepednsOnMap) {

    for (Entry<App, Object> appEntry : appDepednsOnMap.entrySet()) {

      Set<App> dependsOnSet = new HashSet<>();
      App app = appEntry.getKey();
      List<String> dependsOnList = (List<String>) appEntry.getValue();

      for (String appCode : dependsOnList) {
        App dependsOnApp = appRepo.findByCode(appCode);
        if (dependsOnApp == null) {
          continue;
        }
        dependsOnSet.add(dependsOnApp);
      }
      app.setDependsOnSet(dependsOnSet);

      saveApp(app);
    }
  }

  private void importAppImage(
      App app, Mapper mapper, Property property, String image, File dataFile) {

    final Path path = Paths.get(dataFile.getParent());
    try {
      final File imageFile = path.resolve("img" + File.separator + image).toFile();
      if (imageFile.exists()) {
        final MetaFile metaFile = metaFiles.upload(imageFile);
        mapper.set(app, property.getName(), metaFile);
      }
    } catch (Exception e) {
      log.warn("Can't load image {} for app {}", image, app.getName());
    }
  }

  @SuppressWarnings("deprecation")
  private File extract(MetaModule module, String dirName) {

    final List<URL> files = MetaScanner.findAll(module.getName(), dirName, "(.+?)");

    if (files.isEmpty()) {
      return null;
    }

    final File tmp = Files.createTempDir();

    for (URL file : files) {
      String name = file.toString();
      name = name.substring(name.lastIndexOf(dirName));
      try (final InputStream is = file.openStream()) {
        copy(is, tmp, name);
      } catch (IOException e) {
        ExceptionTool.trace(e);
        throw new RuntimeException(e);
      }
    }

    return tmp;
  }

  protected String getDirName() {
    return DATA_DIR_NAME;
  }

  private void copy(InputStream in, File toDir, String name) throws IOException {
    File dst = FileUtils.getFile(toDir, name);
    Files.createParentDirs(dst);
    OutputStream out = new FileOutputStream(dst);
    try {
      ByteStreams.copy(in, out);
    } finally {
      out.close();
    }
  }

  private void clean(File file) {
    if (file.isDirectory()) {
      for (File child : file.listFiles()) {
        clean(child);
      }
      file.delete();
    } else if (file.exists()) {
      file.delete();
    }
  }
}
