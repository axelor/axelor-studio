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
package com.axelor.studio.service.builder;

import com.axelor.common.Inflector;
import com.axelor.common.ObjectUtils;
import com.axelor.data.xml.XMLBind;
import com.axelor.data.xml.XMLBindJson;
import com.axelor.data.xml.XMLConfig;
import com.axelor.data.xml.XMLImporter;
import com.axelor.data.xml.XMLInput;
import com.axelor.db.JpaSecurity;
import com.axelor.i18n.I18n;
import com.axelor.inject.Beans;
import com.axelor.meta.MetaFiles;
import com.axelor.meta.MetaStore;
import com.axelor.meta.db.MetaFile;
import com.axelor.meta.db.MetaJsonModel;
import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.meta.db.repo.MetaJsonModelRepository;
import com.axelor.studio.db.App;
import com.axelor.studio.db.StudioApp;
import com.axelor.studio.db.repo.AppRepository;
import com.axelor.studio.db.repo.StudioAppRepository;
import com.axelor.studio.exception.StudioExceptionMessage;
import com.axelor.studio.service.loader.AppLoaderExportService;
import com.axelor.studio.service.loader.AppLoaderImportService;
import com.axelor.studio.utils.ConsumerListener;
import com.axelor.text.GroovyTemplates;
import com.axelor.utils.helpers.ExceptionHelper;
import com.axelor.utils.helpers.context.FullContext;
import com.axelor.utils.helpers.context.FullContextHelper;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.invoke.MethodHandles;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class StudioAppServiceImpl implements StudioAppService {

  protected JpaSecurity jpaSecurity;

  protected AppLoaderExportService appLoaderExportService;
  protected AppLoaderImportService appLoaderImportService;

  protected AppRepository appRepo;
  protected MetaJsonModelRepository metaJsonModelRepo;

  @Inject
  public StudioAppServiceImpl(
      JpaSecurity jpaSecurity,
      AppLoaderExportService appLoaderExportService,
      AppLoaderImportService appLoaderImportService,
      AppRepository appRepo,
      MetaJsonModelRepository metaJsonModelRepo) {
    this.jpaSecurity = jpaSecurity;
    this.appLoaderExportService = appLoaderExportService;
    this.appLoaderImportService = appLoaderImportService;
    this.appRepo = appRepo;
    this.metaJsonModelRepo = metaJsonModelRepo;
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
    Set<App> depends = new HashSet<>();
    if (studioApp.getDependsOnSet() != null) {
      depends.addAll(studioApp.getDependsOnSet());
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
          String.format(I18n.get(StudioExceptionMessage.STUDIO_APP_1), studioApp.getCode()));
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
    Beans.get(StudioAppRepository.class).remove(studioApp);
  }

  @Override
  public MetaFile importApp(Map<String, Object> dataFileMap) {

    File dataDir = null;
    File zipFile = null;
    try {
      dataDir = Files.createTempDirectory("").toFile();
      zipFile = MetaFiles.getPath((String) dataFileMap.get("filePath")).toFile();
      extractImportZip(dataDir, zipFile);
      StringBuilder logStringBuilder = new StringBuilder();

      for (File confiFile : appLoaderImportService.getAppImportConfigFiles(dataDir)) {
        XMLImporter xmlImporter =
            new XMLImporter(confiFile.getAbsolutePath(), dataDir.getAbsolutePath());
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
                (model, e) -> logStringBuilder.append("Error importing: " + model + "\n")));
        xmlImporter.run();
      }

      if (logStringBuilder.length() > 0) {
        File logFile = MetaFiles.createTempFile("import-", "log").toFile();
        org.apache.commons.io.FileUtils.writeStringToFile(
            logFile, logStringBuilder.toString(), StandardCharsets.UTF_8);
        return Beans.get(MetaFiles.class).upload(logFile);
      }
    } catch (IOException e) {
      ExceptionHelper.trace(e);
    } finally {
      try {
        if (zipFile != null) {
          Files.deleteIfExists(zipFile.toPath());
        }
        if (dataDir != null) {
          Files.deleteIfExists(dataDir.toPath());
        }
      } catch (Exception e) {
        ExceptionHelper.trace(e);
      }
    }
    return null;
  }

  @Override
  public void extractImportZip(File dataDir, File zipFile) {

    if (zipFile == null) {
      return;
    }

    try (FileInputStream fin = new FileInputStream(zipFile);
        ZipInputStream zipInputStream = new ZipInputStream(fin)) {
      ZipEntry zipEntry = zipInputStream.getNextEntry();

      while (zipEntry != null) {
        try (FileOutputStream fout = new FileOutputStream(new File(dataDir, zipEntry.getName()))) {
          IOUtils.copy(zipInputStream, fout);
        }
        zipEntry = zipInputStream.getNextEntry();
      }
    } catch (Exception e) {
      ExceptionHelper.trace(e);
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
      exportFile = Beans.get(MetaFiles.class).upload(zipFile);
    } catch (Exception e) {
      ExceptionHelper.trace(e);
    } finally {
      try {
        if (exportDir != null) {
          Files.deleteIfExists(exportDir.toPath());
        }
      } catch (Exception e) {
        ExceptionHelper.trace(e);
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
      exportFile = Beans.get(MetaFiles.class).upload(zipFile);
    } catch (Exception e) {
      ExceptionHelper.trace(e);
    } finally {
      try {
        if (exportDir != null) {
          Files.deleteIfExists(exportDir.toPath());
        }
      } catch (Exception e) {
        ExceptionHelper.trace(e);
      }
    }

    return exportFile;
  }

  @Override
  public void generateExportFile(File exportDir, boolean isExportData, int... studioAppIds) {

    try {
      generateMetaDataFile(exportDir, studioAppIds);

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
                xmlConfig.getInputs().add(createXMLInput(jsonModel, jsonFieldMap, false));
                xmlConfig.getInputs().add(createXMLInput(jsonModel, jsonFieldMap, true));
                generateModelDataFiles(jsonModel, exportDir, jsonFieldMap, records);
              });

          if (ObjectUtils.notEmpty(xmlConfig.getInputs())) {
            File configFile = new File(exportDir, "data-config.xml");
            appLoaderExportService.writeXmlConfig(configFile, xmlConfig);
          }
        }
      }
    } catch (Exception e) {
      ExceptionHelper.trace(e);
    }
  }

  @Override
  public void generateMetaDataFile(File parentFile, int... studioAppIds) {

    Map<String, InputStream> templateISmap = appLoaderExportService.getExportTemplateResources();
    GroovyTemplates templates = new GroovyTemplates();
    Map<String, Object> ctx = new HashMap<>();
    List<Long> ids =
        Arrays.stream(studioAppIds)
            .boxed()
            .map(id -> Long.parseLong(id + ""))
            .collect(Collectors.toList());
    ctx.put("__ids__", ids);

    templateISmap.forEach(
        (key, value) -> {
          log.debug("Exporting file: {}", key);
          File file = null;
          try {
            file = new File(parentFile, key);
            try (FileWriter writer = new FileWriter(file);
                InputStreamReader inputStreamReader = new InputStreamReader(value)) {
              templates.from(inputStreamReader).make(ctx).render(writer);
            }
          } catch (Exception e) {
            ExceptionHelper.trace(e);
          } finally {
            deleteEmptyFile(file);
          }
        });
  }

  @Override
  public void deleteEmptyFile(File file) {

    try {
      if (file == null) {
        return;
      }

      if (file.length() == 0) {
        Files.delete(file.toPath());
      } else {
        try (Stream<String> stream = Files.lines(file.toPath())) {
          if (stream.count() == 1 || ( Files.lines(file.toPath()).count() == 2 && Files.lines(file.toPath()).skip(1).findFirst().orElse(null).isEmpty())) {
            Files.delete(file.toPath());
          }
        }
      }
    } catch (Exception e) {
      ExceptionHelper.trace(e);
    }
  }

  @Override
  public XMLInput createXMLInput(
      MetaJsonModel jsonModel, Map<String, Object> jsonFieldMap, boolean relationalInput) {

    XMLInput xmlInput = new XMLInput();
    String modelName = jsonModel.getName();
    xmlInput.setFileName(String.format("%s.xml", modelName));
    String dasherizeModel = Inflector.getInstance().dasherize(modelName);
    xmlInput.setRoot(String.format("%ss", dasherizeModel));

    XMLBindJson xmlBindJson = new XMLBindJson();
    xmlBindJson.setNode(dasherizeModel);
    xmlBindJson.setJsonModel(modelName);
    xmlBindJson.setSearch("self.name = :name");
    xmlBindJson.setUpdate(true);

    if (relationalInput) {
      xmlBindJson.setCreate(false);
    }

    xmlBindJson.setBindings(getFieldBinding(jsonModel, jsonFieldMap, relationalInput));
    List<XMLBind> rootBindings = new ArrayList<>();
    rootBindings.add(xmlBindJson);
    xmlInput.setBindings(rootBindings);

    return xmlInput;
  }

  @Override
  public List<XMLBind> getFieldBinding(
      MetaJsonModel jsonModel, Map<String, Object> jsonFieldMap, boolean relationalInput) {

    List<XMLBind> fieldBindings = new ArrayList<>();
    jsonModel
        .getFields()
        .forEach(
            jsonField -> {
              String fieldName = jsonField.getName();
              XMLBind dummyBind = new XMLBind();
              dummyBind.setNode(fieldName);
              dummyBind.setField("_" + fieldName);
              fieldBindings.add(dummyBind);

              if (relationalInput
                  && jsonField.getTargetJsonModel() == null
                  && jsonField.getTargetModel() == null) {
                return;
              }

              XMLBind xmlBind = new XMLBind();
              xmlBind.setNode(jsonField.getName());
              xmlBind.setField("$attrs." + jsonField.getName());
              if (jsonField.getTargetJsonModel() != null || jsonField.getTargetModel() != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> fieldAttrs = (Map<String, Object>) jsonFieldMap.get(fieldName);
                if (ObjectUtils.notEmpty(fieldAttrs)) {
                  log.debug("Json Field name: {}, Field attrs: {}", fieldName, fieldAttrs);
                  appLoaderExportService.addRelationaJsonFieldBind(jsonField, fieldAttrs, xmlBind);
                }
              } else if (jsonField.getType().equals("boolean")) {
                xmlBind.setAdapter("Boolean");
              }

              fieldBindings.add(xmlBind);
            });

    return fieldBindings;
  }

  @Override
  @SuppressWarnings("unchecked")
  public void generateModelDataFiles(
      MetaJsonModel jsonModel,
      File parentDir,
      Map<String, Object> jsonFieldMap,
      List<FullContext> records) {

    try {
      if (!jpaSecurity.isPermitted(JpaSecurity.CAN_READ, MetaJsonRecord.class)) {
        return;
      }

      if (ObjectUtils.notEmpty(records)) {
        String modelName = jsonModel.getName();
        String dasherizeModel = Inflector.getInstance().dasherize(modelName);

        StringBuilder stringBuilder = new StringBuilder();
        stringBuilder.append("<?xml version=\"1.0\" encoding=\"utf-8\"?>\n");
        stringBuilder.append(
            String.format(
                "<%ss xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\n"
                    + "  xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\">\n\n",
                dasherizeModel));

        records.forEach(
            it -> {
              if (!jpaSecurity.isPermitted(
                  JpaSecurity.CAN_READ, MetaJsonRecord.class, (Long) it.get("id"))) {
                return;
              }
              stringBuilder.append(String.format("<%s>%n", dasherizeModel));

              jsonModel
                  .getFields()
                  .forEach(
                      jsonField -> {
                        String field = jsonField.getName();
                        Map<String, Object> fieldAttrs =
                            (Map<String, Object>) jsonFieldMap.get(field);
                        stringBuilder.append(
                            String.format(
                                "\t<%s>%s</%s>%n",
                                field,
                                appLoaderExportService.extractJsonFieldValue(it, fieldAttrs),
                                field));
                      });
              stringBuilder.append(String.format("</%s>%n%n", dasherizeModel));
            });
        stringBuilder.append(String.format("</%ss>%n", dasherizeModel));
        File dataFile = new File(parentDir, modelName + ".xml");
        org.apache.commons.io.FileUtils.writeStringToFile(
            dataFile, stringBuilder.toString(), StandardCharsets.UTF_8);
      }
    } catch (IOException e) {
      ExceptionHelper.trace(e);
    }
  }
}
