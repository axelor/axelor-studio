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
package com.axelor.studio.app.service;

import com.axelor.common.FileUtils;
import com.axelor.common.Inflector;
import com.axelor.common.YamlUtils;
import com.axelor.data.Importer;
import com.axelor.data.csv.CSVImporter;
import com.axelor.data.xml.XMLImporter;
import com.axelor.db.JpaRepository;
import com.axelor.db.Model;
import com.axelor.db.mapper.Mapper;
import com.axelor.db.mapper.Property;
import com.axelor.i18n.I18n;
import com.axelor.inject.Beans;
import com.axelor.meta.MetaFiles;
import com.axelor.meta.MetaScanner;
import com.axelor.meta.db.MetaFile;
import com.axelor.meta.db.MetaModel;
import com.axelor.meta.db.MetaModule;
import com.axelor.meta.db.repo.MetaModelRepository;
import com.axelor.meta.db.repo.MetaModuleRepository;
import com.axelor.studio.db.App;
import com.axelor.studio.db.repo.AppRepository;
import com.axelor.studio.exception.StudioExceptionMessage;
import com.axelor.studio.service.AppSettingsStudioService;
import com.axelor.utils.ExceptionTool;
import com.google.common.io.ByteStreams;
import com.google.inject.Inject;
import com.google.inject.Singleton;
import com.google.inject.persist.Transactional;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Scanner;
import java.util.Set;
import java.util.regex.Pattern;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Singleton
public class AppServiceImpl implements AppService {

  private final Logger log = LoggerFactory.getLogger(AppServiceImpl.class);

  private static final String DIR_APPS = "apps";

  private static final String DIR_APPS_DEMO = Paths.get("apps", "demo-data").toString();

  private static final String DIR_APPS_INIT = Paths.get("apps", "init-data").toString();

  private static final String DIR_APPS_ROLES = Paths.get("apps", "roles").toString();

  private static final String CONFIG_PATTERN = "-config.xml";

  private static final String IMG_DIR = "img";

  private static final String EXT_DIR = "extra";

  private static final Pattern patCsv = Pattern.compile("^<\\s*csv-inputs");

  private static final Pattern patXml = Pattern.compile("^<\\s*xml-inputs");

  private static final String APP_CODE = "code";
  private static final String APP_IMAGE = "image";
  private static final String APP_MODULES = "modules";
  private static final String APP_DEPENDS_ON = "dependsOn";
  private static final String APP_VERSION = "appVersion";

  protected final AppRepository appRepo;
  protected final MetaFiles metaFiles;
  protected final AppVersionService appVersionService;
  protected final MetaModelRepository metaModelRepo;
  protected final AppSettingsStudioService appSettingsService;

  @Inject
  public AppServiceImpl(
      AppRepository appRepo,
      MetaFiles metaFiles,
      AppVersionService appVersionService,
      MetaModelRepository metaModelRepo,
      AppSettingsStudioService appSettingsService) {
    this.appRepo = appRepo;
    this.metaFiles = metaFiles;
    this.appVersionService = appVersionService;
    this.metaModelRepo = metaModelRepo;
    this.appSettingsService = appSettingsService;
  }

  @Override
  public App importDataDemo(App app) throws IOException {

    if (Boolean.TRUE.equals(app.getDemoDataLoaded())) {
      return app;
    }

    log.debug("Demo import: App code: {}, App lang: {}", app.getCode(), app.getLanguageSelect());
    importParentData(app);

    String lang = getLanguage(app);
    if (lang == null) {
      throw new IllegalStateException(I18n.get(StudioExceptionMessage.NO_LANGUAGE_SELECTED));
    }

    importData(app, DIR_APPS_DEMO, true);

    app = appRepo.find(app.getId());

    app.setDemoDataLoaded(true);

    return saveApp(app);
  }

  @Transactional
  public App saveApp(App app) {
    return appRepo.save(app);
  }

  private void importData(App app, String dataDir, boolean useLang) throws IOException {

    String modules = app.getModules();
    if (modules == null) {
      return;
    }
    String code = app.getCode();
    String lang = useLang ? getLanguage(app) : "";

    log.debug("Data import: DataDir: {}, App code: {}, App lang: {}", dataDir, code, lang);

    for (String module : modules.split(",")) {
      File tmp = extract(module, dataDir, lang, code);
      if (tmp == null) {
        continue;
      }
      log.debug("Importing from module: {}", module);
      importPerConfig(code, new File(tmp, dataDir));
    }
  }

  private void importPerConfig(String appCode, File dataDir) throws IOException {

    try {
      File[] configs =
          dataDir.listFiles(
              (dir, name) -> name.startsWith(appCode + "-") && name.endsWith(CONFIG_PATTERN));

      if (configs == null || configs.length == 0) {
        log.debug("No config file found for the app: {}", appCode);
        return;
      }

      Arrays.sort(configs);

      for (File config : configs) {
        runImport(config, dataDir);
      }

    } finally {
      clean(dataDir);
    }
  }

  private String getLanguage(App app) {

    String lang = app.getLanguageSelect();

    if (app.getLanguageSelect() == null) {
      lang = appSettingsService.applicationLocale();
    }

    return lang;
  }

  private void importParentData(App app) throws IOException {

    List<App> depends = getDepends(app, true);

    for (App parent : depends) {
      parent = appRepo.find(parent.getId());
      if (!Boolean.TRUE.equals(parent.getDemoDataLoaded())) {
        importDataDemo(parent);
      }
    }
  }

  private App importDataInit(App app) throws IOException {

    String lang = getLanguage(app);
    if (lang == null) {
      return app;
    }

    importData(app, DIR_APPS_INIT, true);

    app = appRepo.find(app.getId());

    app.setInitDataLoaded(true);

    return app;
  }

  private void runImport(File config, File data) throws FileNotFoundException {

    log.debug(
        "Running import with config path: {}, data path: {}",
        config.getAbsolutePath(),
        data.getAbsolutePath());

    try (Scanner scanner = new Scanner(config)) {
      Importer importer = null;
      while (scanner.hasNextLine()) {
        String str = scanner.nextLine();
        if (patCsv.matcher(str).find()) {
          importer = new CSVImporter(config.getAbsolutePath(), data.getAbsolutePath(), null);
        } else if (patXml.matcher(str).find()) {
          importer = new XMLImporter(config.getAbsolutePath(), data.getAbsolutePath());
        }
        if (importer != null) {
          break;
        }
      }

      if (importer != null) {
        importer.run();
      }
    }
  }

  private File extract(String module, String dirName, String lang, String code) throws IOException {
    String dirNamePattern = dirName.replaceAll("[/\\\\]", "(/|\\\\\\\\)");
    List<URL> files = new ArrayList<>();

    if (code == null) {
      files.addAll(MetaScanner.findAll(module, dirNamePattern, "(.+?)\\.(yml|yaml)"));
      if (CollectionUtils.isNotEmpty(files)) {
        files.addAll(MetaScanner.findAll(module, dirNamePattern, "(img)"));
      }
    } else {
      files.addAll(MetaScanner.findAll(module, dirNamePattern, code + "(-+.*)?" + CONFIG_PATTERN));
    }
    if (files.isEmpty()) {
      return null;
    }

    if (StringUtils.isEmpty(lang)) {
      if (code != null) {
        files.addAll(MetaScanner.findAll(module, dirNamePattern, code + "*"));
      }
    } else {
      files.addAll(fetchUrls(module, Paths.get(dirName, IMG_DIR).toString()));
      files.addAll(fetchUrls(module, Paths.get(dirName, EXT_DIR).toString()));
      files.addAll(fetchUrls(module, Paths.get(dirName, lang).toString()));
    }

    final File tmp = Files.createTempDirectory(null).toFile();

    for (URL url : files) {
      String name = url.getFile();
      name = Paths.get(name.replaceAll("file:.+!/", "")).toString();
      if (!StringUtils.isEmpty(lang)) {
        name = name.replace(Paths.get(dirName, lang).toString(), dirName);
      }
      try {
        copy(url.openStream(), tmp, name);
      } catch (IOException e) {
        ExceptionTool.trace(e);
      }
    }

    return tmp;
  }

  private List<URL> fetchUrls(String module, String fileName) {
    final String fileNamePattern = fileName.replaceAll("[/\\\\]", "(/|\\\\\\\\)");
    return MetaScanner.findAll(module, fileNamePattern, "(.+?)");
  }

  private void copy(InputStream in, File toDir, String name) throws IOException {
    File dst = FileUtils.getFile(toDir, name);
    com.google.common.io.Files.createParentDirs(dst);
    try (FileOutputStream out = new FileOutputStream(dst)) {
      ByteStreams.copy(in, out);
    }
  }

  private void clean(File file) throws IOException {
    File[] files = file == null ? null : file.listFiles();
    if (files == null) {
      return;
    }
    if (file.isDirectory()) {
      for (File child : files) {
        clean(child);
      }
      FileUtils.deleteDirectory(file.toPath());
    } else if (file.exists()) {
      Files.delete(file.toPath());
    }
  }

  @Override
  public Model getApp(String code) {

    App app = appRepo.findByCode(code);
    if (app != null) {
      return (Model) Mapper.toMap(app).get("app" + Inflector.getInstance().camelize(code));
    }

    return null;
  }

  @Override
  public boolean isApp(String code) {

    App app = appRepo.findByCode(code);

    if (app == null) {
      return false;
    }

    return app.getActive();
  }

  private List<App> getDepends(App app, Boolean active) {

    List<App> apps = new ArrayList<>();
    app = appRepo.find(app.getId());

    if (CollectionUtils.isEmpty(app.getDependsOnSet())) {
      return apps;
    }

    for (App depend : app.getDependsOnSet()) {
      if (depend.getActive().equals(active)) {
        apps.add(depend);
      }
    }

    return sortApps(apps);
  }

  private List<String> getNames(List<App> apps) {

    List<String> names = new ArrayList<>();

    for (App app : apps) {
      names.add(app.getName());
    }

    return names;
  }

  private List<App> getChildren(App app) {

    String code = app.getCode();

    String query = "self.dependsOnSet.code = ?1";

    query = "(" + query + ") AND self.active = " + true;
    List<App> apps = appRepo.all().filter(query, code).fetch();

    log.debug("Parent app: {}, Total children: {}", app.getName(), apps.size());

    return apps;
  }

  @Override
  public App installApp(App app, String language) throws IOException {

    app = appRepo.find(app.getId());

    if (Boolean.TRUE.equals(app.getActive())) {
      return app;
    }

    if (language != null) {
      app.setLanguageSelect(language);
    } else {
      language = app.getLanguageSelect();
    }

    List<App> apps = getDepends(app, false);

    for (App parentApp : apps) {
      installApp(parentApp, language);
    }

    log.debug("Init data loaded: {}, for app: {}", app.getInitDataLoaded(), app.getCode());
    if (!Boolean.TRUE.equals(app.getInitDataLoaded())) {
      app = importDataInit(app);
    }

    app = appRepo.find(app.getId());

    app.setActive(true);

    return saveApp(app);
  }

  private List<App> sortApps(Collection<App> apps) {

    List<App> appsList = new ArrayList<>(apps);

    appsList.sort(this::compare);

    log.debug("Apps sorted: {}", getNames(appsList));

    return appsList;
  }

  private int compare(App app1, App app2) {
    Integer order1 = app1.getInstallOrder();
    Integer order2 = app2.getInstallOrder();
    return order1.compareTo(order2);
  }

  @Override
  public void initApps() throws IOException {
    final List<MetaModule> modules = Beans.get(MetaModuleRepository.class).all().fetch();

    for (MetaModule module : modules) {

      File tmp = extract(module.getName(), DIR_APPS, null, null);

      try {
        File dataDir = tmp == null ? null : new File(tmp, DIR_APPS);

        File[] dataFiles =
            dataDir == null
                ? null
                : dataDir.listFiles((dir, name) -> name.endsWith(".yml") || name.endsWith(".yaml"));

        if (dataFiles == null || dataFiles.length == 0) {
          continue;
        }

        Map<App, Object> appDependsOnMap = new HashMap<>();

        for (File dataFile : dataFiles) {
          importApp(dataFile, appDependsOnMap);
        }

        setAppDependsOn(appDependsOnMap);

      } catch (Exception e) {
        ExceptionTool.trace(e);
      } finally {
        clean(tmp);
      }
    }
  }

  private void importApp(File dataFile, Map<App, Object> appDependsOnMap)
      throws IOException, ClassNotFoundException {

    log.debug("Running import/update app with data path: {}", dataFile.getAbsolutePath());

    Map<String, Object> appDataMap = YamlUtils.loadYaml(dataFile);
    if (!appDataMap.containsKey(APP_CODE)
        || (appDataMap.containsKey(APP_CODE) && appDataMap.get(APP_CODE) == null)) {
      return;
    }

    Mapper mapper = Mapper.of(App.class);
    String appCode = appDataMap.get(APP_CODE).toString();
    App app = appRepo.findByCode(appCode);
    if (app == null) {
      app = new App();
    }

    for (Entry<String, Object> entry : appDataMap.entrySet()) {
      Property property = mapper.getProperty(entry.getKey());
      if (property == null) {
        continue;
      }
      if (property.getName().equals(APP_IMAGE) && entry.getValue() != null) {
        String image = entry.getValue().toString();
        importAppImage(app, mapper, property, image, dataFile);
      } else if (property.getName().equals(APP_MODULES) && entry.getValue() != null) {
        String modules = entry.getValue().toString().replace(" ", ",");
        mapper.set(app, property.getName(), modules);
      } else {
        mapper.set(app, property.getName(), entry.getValue() != null ? entry.getValue() : null);
      }
    }

    if (app.getLanguageSelect() == null) {
      String language = appSettingsService.applicationLocale();
      app.setLanguageSelect(language);
    }

    if (!appDataMap.containsKey(APP_VERSION) || appDataMap.get(APP_VERSION) == null) {
      String appVersion = appVersionService.getAppVersion(app);
      app.setAppVersion(appVersion);
    }

    saveApp(app);

    if (appDataMap.containsKey(APP_DEPENDS_ON) && appDataMap.get(APP_DEPENDS_ON) != null) {
      appDependsOnMap.put(app, appDataMap.get(APP_DEPENDS_ON));
    }

    importAppConfig(app);
  }

  @SuppressWarnings("unchecked")
  @Transactional(rollbackOn = {Exception.class})
  public void importAppConfig(App app) throws ClassNotFoundException {

    String code = app.getCode();
    String modelName = "App" + Inflector.getInstance().camelize(code);

    MetaModel model = metaModelRepo.findByName(modelName);
    if (model == null) {
      return;
    }

    Class<Model> klass = (Class<Model>) Class.forName(model.getFullName());

    JpaRepository<Model> repo = JpaRepository.of(klass);
    long cnt = repo.all().count();
    if (cnt > 0) {
      return;
    }

    Mapper mapper = Mapper.of(klass);
    List<Property> properties = Arrays.asList(mapper.getProperties());
    boolean isRequiredProp = properties.stream().anyMatch(prop -> prop.isRequired());
    if (isRequiredProp) {
      return;
    }

    Map<String, Object> _map = new HashMap<>();
    _map.put("app", app);

    Model bean = repo.create(_map);
    repo.save(bean);
  }

  @SuppressWarnings("unchecked")
  private void setAppDependsOn(Map<App, Object> appDepednsOnMap) {

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
      final File imageFile = path.resolve(Paths.get("img", image)).toFile();
      if (imageFile.exists()) {
        final MetaFile metaFile = metaFiles.upload(imageFile);
        mapper.set(app, property.getName(), metaFile);
      }
    } catch (Exception e) {
      log.warn("Can't load image {} for app {}", image, app.getName());
    }
  }

  @Override
  public App unInstallApp(App app) {

    List<App> children = getChildren(app);
    if (!children.isEmpty()) {
      List<String> childrenNames = getNames(children);
      throw new IllegalStateException(
          String.format(StudioExceptionMessage.APP_IN_USE, childrenNames));
    }

    app.setActive(false);

    return saveApp(app);
  }

  @Override
  public void bulkInstall(Collection<App> apps, Boolean importDemo, String language)
      throws IOException {

    apps = sortApps(apps);

    for (App app : apps) {
      app = installApp(app, language);
      if (importDemo != null && importDemo) {
        importDataDemo(app);
      }
    }
  }

  @Override
  public App importRoles(App app) throws IOException {

    if (Boolean.TRUE.equals(app.getIsRolesImported())) {
      return app;
    }

    importParentRoles(app);

    importData(app, DIR_APPS_ROLES, false);

    app = appRepo.find(app.getId());

    app.setIsRolesImported(true);

    return saveApp(app);
  }

  private void importParentRoles(App app) throws IOException {

    List<App> depends = getDepends(app, true);

    for (App parent : depends) {
      parent = appRepo.find(parent.getId());
      if (!Boolean.TRUE.equals(parent.getIsRolesImported())) {
        importRoles(parent);
      }
    }
  }

  @Override
  public void importRoles() throws IOException {

    List<App> apps = appRepo.all().filter("self.isRolesImported = false").fetch();
    apps = sortApps(apps);

    for (App app : apps) {
      importRoles(app);
    }
  }

  @Override
  public String getDataExportDir() {
    String dataExportDirPath = appSettingsService.dataExportDir();
    if (dataExportDirPath == null || dataExportDirPath.isEmpty()) {
      throw new IllegalStateException(I18n.get(StudioExceptionMessage.DATA_EXPORT_DIR_ERROR));
    }
    return !dataExportDirPath.endsWith(File.separator)
        ? dataExportDirPath + File.separator
        : dataExportDirPath;
  }
}
