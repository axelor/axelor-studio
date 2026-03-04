/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.constructor;

import com.axelor.common.FileUtils;
import com.axelor.common.ObjectUtils;
import com.axelor.data.xml.XMLConfig;
import com.axelor.data.xml.XMLImporter;
import com.axelor.file.temp.TempFiles;
import com.axelor.i18n.I18n;
import com.axelor.inject.Beans;
import com.axelor.meta.MetaFiles;
import com.axelor.meta.MetaStore;
import com.axelor.meta.db.MetaFile;
import com.axelor.meta.db.MetaJsonModel;
import com.axelor.meta.db.repo.MetaJsonModelRepository;
import com.axelor.studio.db.App;
import com.axelor.studio.db.StudioApp;
import com.axelor.studio.db.repo.AppRepository;
import com.axelor.studio.db.repo.StudioAppRepo;
import com.axelor.studio.exception.StudioExceptionMessage;
import com.axelor.studio.service.StudioMetaService;
import com.axelor.studio.service.loader.AppLoaderExportService;
import com.axelor.studio.service.loader.AppLoaderImportService;
import com.axelor.studio.utils.ConsumerListener;
import com.axelor.utils.helpers.ExceptionHelper;
import com.axelor.utils.helpers.context.FullContext;
import com.axelor.utils.helpers.context.FullContextHelper;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import java.io.File;
import java.io.IOException;
import java.lang.invoke.MethodHandles;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class StudioAppServiceImpl implements StudioAppService {

  protected AppLoaderExportService appLoaderExportService;
  protected AppLoaderImportService appLoaderImportService;
  protected MetaFiles metaFiles;

  protected AppRepository appRepo;
  protected MetaJsonModelRepository metaJsonModelRepo;
  protected StudioAppRepo studioAppRepo;
  protected StudioAppUpdateCleanupService cleanupService;

  @Inject
  public StudioAppServiceImpl(
      AppLoaderExportService appLoaderExportService,
      AppLoaderImportService appLoaderImportService,
      MetaFiles metaFiles,
      AppRepository appRepo,
      MetaJsonModelRepository metaJsonModelRepo,
      StudioAppRepo studioAppRepo,
      StudioAppUpdateCleanupService cleanupService) {
    this.appLoaderExportService = appLoaderExportService;
    this.appLoaderImportService = appLoaderImportService;
    this.metaFiles = metaFiles;
    this.appRepo = appRepo;
    this.metaJsonModelRepo = metaJsonModelRepo;
    this.studioAppRepo = studioAppRepo;
    this.cleanupService = cleanupService;
  }

  protected static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  @Override
  public StudioApp build(StudioApp studioApp) {

    checkCode(studioApp);

    App app = studioApp.getGeneratedApp();

    if (app == null) {
      app = new App(studioApp.getName(), studioApp.getCode());
    } else {
      app.setCode(studioApp.getCode());
      app.setName(studioApp.getName());
    }

    app.setIsCustom(true);
    app.setTypeSelect(AppRepository.TYPE_CUSTOM);
    app.setIsInAppView(studioApp.getIsInAppView());
    app.setImage(studioApp.getImage());
    app.setDescription(studioApp.getDescription());
    if (studioApp.getDependsOnSet() != null) {
      Set<App> depends = new HashSet<>(studioApp.getDependsOnSet());
      app.setDependsOnSet(depends);
    }
    app.setSequence(studioApp.getSequence());
    app.setModules(studioApp.getModules());

    studioApp.setGeneratedApp(appRepo.save(app));

    return studioApp;
  }

  @Override
  public void checkCode(StudioApp studioApp) {

    App app = appRepo.findByCode(studioApp.getCode());

    if (app != null && app != studioApp.getGeneratedApp()) {
      throw new IllegalStateException(
          I18n.get(StudioExceptionMessage.STUDIO_APP_1).formatted(studioApp.getCode()));
    }
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public void clean(StudioApp studioApp) {

    if (studioApp.getGeneratedApp() != null) {
      appRepo.remove(studioApp.getGeneratedApp());
      studioApp.setGeneratedApp(null);
    }
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public void deleteApp(StudioApp studioApp) {
    studioAppRepo.remove(studioApp);
  }

  @Override
  public MetaFile importApp(Map<String, Object> dataFileMap) {
    return importApp(dataFileMap, (StudioApp) null);
  }

  @Override
  public MetaFile importApp(Map<String, Object> dataFileMap, StudioApp studioApp) {

    File dataDir = null;
    File zipFile = null;
    try {
      dataDir = Files.createTempDirectory("").toFile();
      zipFile = MetaFiles.getPath((String) dataFileMap.get("filePath")).toFile();
      appLoaderImportService.extractImportZip(dataDir, zipFile);

      if (studioApp != null) {
        appLoaderImportService.validateZipForApp(dataDir, studioApp.getCode());
      }

      StringBuilder logStringBuilder = new StringBuilder();
      runImport(dataDir, logStringBuilder);

      if (!logStringBuilder.isEmpty()) {
        File logFile = TempFiles.createTempFile("import-", "log").toFile();
        org.apache.commons.io.FileUtils.writeStringToFile(
            logFile, logStringBuilder.toString(), StandardCharsets.UTF_8);
        return metaFiles.upload(logFile);
      }
    } catch (IOException e) {
      ExceptionHelper.error(e);
    } finally {
      try {
        if (zipFile != null) {
          Files.deleteIfExists(zipFile.toPath());
        }
        if (dataDir != null) {
          FileUtils.deleteDirectory(dataDir);
        }
      } catch (Exception e) {
        ExceptionHelper.error(e);
      }
    }
    return null;
  }

  @Override
  public MetaFile updateApp(
      Map<String, Object> dataFileMap, StudioApp studioApp, boolean detachAbsent) {

    File dataDir = null;
    File zipFile = null;
    try {
      dataDir = Files.createTempDirectory("").toFile();
      zipFile = MetaFiles.getPath((String) dataFileMap.get("filePath")).toFile();
      appLoaderImportService.extractImportZip(dataDir, zipFile);
      appLoaderImportService.validateZipForApp(dataDir, studioApp.getCode());

      StringBuilder logStringBuilder = new StringBuilder();
      runImport(dataDir, logStringBuilder);

      if (studioApp != null) {
        Beans.get(StudioMetaService.class)
            .trackingFields(studioApp, "App updated from a zip", "App updated");
      }

      // Phase 2: Detach absent elements if requested
      if (detachAbsent) {
        try {
          List<String> detachLog = cleanupService.detachObsoleteElements(dataDir, studioApp);
          if (!detachLog.isEmpty()) {
            logStringBuilder.append("\n--- Detached elements ---\n");
            for (String entry : detachLog) {
              logStringBuilder.append(entry).append("\n");
            }
          }
        } catch (Exception e) {
          log.error("Error during detach of absent elements", e);
          logStringBuilder.append("\nError during detach: ").append(e.getMessage()).append("\n");
        }
      }

      if (!logStringBuilder.isEmpty()) {
        File logFile = TempFiles.createTempFile("update-", "log").toFile();
        org.apache.commons.io.FileUtils.writeStringToFile(
            logFile, logStringBuilder.toString(), StandardCharsets.UTF_8);
        return metaFiles.upload(logFile);
      }
    } catch (IOException e) {
      ExceptionHelper.error(e);
    } finally {
      try {
        if (zipFile != null) {
          Files.deleteIfExists(zipFile.toPath());
        }
        if (dataDir != null) {
          FileUtils.deleteDirectory(dataDir);
        }
      } catch (Exception e) {
        ExceptionHelper.error(e);
      }
    }
    return null;
  }

  private void runImport(File dataDir, StringBuilder logStringBuilder) throws IOException {
    for (File configFile : appLoaderImportService.getAppImportConfigFiles(dataDir)) {
      XMLImporter xmlImporter =
          new XMLImporter(configFile.getAbsolutePath(), dataDir.getAbsolutePath());
      xmlImporter.addListener(
          new ConsumerListener(
              (num, app) -> {
                logStringBuilder.append("Import model: ");
                logStringBuilder.append(num);
                logStringBuilder.append("\n");
              },
              model -> {
                logStringBuilder.append("Import model: ");
                logStringBuilder.append(model);
                logStringBuilder.append("\n");
              },
              (model, e) ->
                  logStringBuilder.append("Error importing: ").append(model).append("\n")));
      xmlImporter.run();
    }
  }

  @Override
  public MetaFile exportApps(List<Integer> studioAppIds, boolean isExportData) {

    MetaFile exportFile = null;
    File exportDir = null;
    try {
      exportDir = Files.createTempDirectory("").toFile();
      int[] studioAppIdArr = studioAppIds.stream().mapToInt(id -> id).toArray();
      generateExportFile(exportDir, isExportData, studioAppIdArr);
      File zipFile = appLoaderExportService.createExportZip(exportDir);
      exportFile = metaFiles.upload(zipFile);
    } catch (Exception e) {
      ExceptionHelper.error(e);
    } finally {
      try {
        if (exportDir != null) {
          FileUtils.deleteDirectory(exportDir);
        }
      } catch (Exception e) {
        ExceptionHelper.error(e);
      }
    }

    return exportFile;
  }

  @Override
  public MetaFile exportApp(StudioApp studioApp, boolean isExportData) {

    MetaFile exportFile = null;
    File exportDir = null;
    try {
      exportDir = Files.createTempDirectory("").toFile();
      generateExportFile(exportDir, isExportData, Integer.parseInt(studioApp.getId().toString()));
      File zipFile = appLoaderExportService.createExportZip(exportDir);
      exportFile = metaFiles.upload(zipFile);
    } catch (Exception e) {
      ExceptionHelper.error(e);
    } finally {
      try {
        if (exportDir != null) {
          FileUtils.deleteDirectory(exportDir);
        }
      } catch (Exception e) {
        ExceptionHelper.error(e);
      }
    }

    return exportFile;
  }

  @Override
  public void generateExportFile(File exportDir, boolean isExportData, int... studioAppIds) {

    try {
      Map<String, Object> ctx = new HashMap<>();
      List<Long> ids =
          Arrays.stream(studioAppIds).boxed().map(Integer::longValue).collect(Collectors.toList());
      ctx.put("__ids__", ids);
      appLoaderExportService.generateMetaDataFiles(exportDir, ctx);

      for (int studioAppId : studioAppIds) {
        if (!isExportData) {
          continue;
        }
        List<MetaJsonModel> jsonModels =
            metaJsonModelRepo
                .all()
                .filter("self.studioApp.id = :studioAppId")
                .bind("studioAppId", studioAppId)
                .fetch();
        if (ObjectUtils.notEmpty(jsonModels)) {
          XMLConfig xmlConfig = new XMLConfig();
          jsonModels.forEach(
              jsonModel -> {
                List<FullContext> records = FullContextHelper.filter(jsonModel.getName(), null);
                if (ObjectUtils.isEmpty(records)) {
                  return;
                }

                Map<String, Object> jsonFieldMap = MetaStore.findJsonFields(jsonModel.getName());
                appLoaderExportService.fixTargetName(jsonFieldMap);
                xmlConfig
                    .getInputs()
                    .add(
                        appLoaderExportService.createJsonModelInputAllFields(
                            jsonModel, jsonFieldMap, false));
                xmlConfig
                    .getInputs()
                    .add(
                        appLoaderExportService.createJsonModelInputAllFields(
                            jsonModel, jsonFieldMap, true));
                try {
                  appLoaderExportService.generateAllJsonModelData(
                      jsonModel, exportDir, jsonFieldMap, records);
                } catch (IOException e) {
                  ExceptionHelper.error(e);
                }
              });

          if (ObjectUtils.notEmpty(xmlConfig.getInputs())) {
            File configFile = new File(exportDir, "data-config.xml");
            appLoaderExportService.writeXmlConfig(configFile, xmlConfig);
          }
        }
      }
    } catch (Exception e) {
      ExceptionHelper.error(e);
    }
  }
}
