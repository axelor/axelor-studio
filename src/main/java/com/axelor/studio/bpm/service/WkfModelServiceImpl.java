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
package com.axelor.studio.bpm.service;

import com.axelor.auth.AuthUtils;
import com.axelor.auth.db.User;
import com.axelor.common.ObjectUtils;
import com.axelor.common.StringUtils;
import com.axelor.data.Listener;
import com.axelor.data.xml.XMLImporter;
import com.axelor.db.Model;
import com.axelor.i18n.I18n;
import com.axelor.meta.MetaFiles;
import com.axelor.meta.db.MetaFile;
import com.axelor.meta.db.repo.MetaFileRepository;
import com.axelor.studio.bpm.service.dashboard.WkfDashboardCommonService;
import com.axelor.studio.bpm.service.deployment.BpmDeploymentService;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.WkfProcess;
import com.axelor.studio.db.WkfProcessConfig;
import com.axelor.studio.db.repo.AppRepository;
import com.axelor.studio.db.repo.WkfModelRepository;
import com.axelor.studio.translation.ITranslation;
import com.axelor.studio.utils.ConsumerListener;
import com.axelor.utils.service.TranslationService;
import com.google.common.base.Strings;
import com.google.common.io.Files;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import org.apache.commons.io.FileUtils;
import org.apache.xmlbeans.impl.common.IOUtil;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

public class WkfModelServiceImpl implements WkfModelService {

  protected static final String IMPORT_CONFIG_PATH = "/data-import/import-wkf-models.xml";

  protected WkfModelRepository wkfModelRepository;
  protected WkfDashboardCommonService wkfDashboardCommonService;
  protected TranslationService translationService;
  protected AppRepository appRepo;
  protected BpmDeploymentService bpmDeploymentService;
  protected MetaFileRepository metaFileRepository;

  @Inject
  public WkfModelServiceImpl(
      WkfModelRepository wkfModelRepository,
      WkfDashboardCommonService wkfDashboardCommonService,
      TranslationService translationService,
      AppRepository appRepo,
      BpmDeploymentService bpmDeploymentService,
      MetaFileRepository metaFileRepository) {
    this.wkfModelRepository = wkfModelRepository;
    this.wkfDashboardCommonService = wkfDashboardCommonService;
    this.translationService = translationService;
    this.appRepo = appRepo;
    this.bpmDeploymentService = bpmDeploymentService;
    this.metaFileRepository = metaFileRepository;
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public WkfModel createNewVersion(WkfModel wkfModel) {
    WkfModel newVersion =
        wkfModelRepository
            .all()
            .filter("self.previousVersion.id = ?1", wkfModel.getId())
            .fetchOne();

    if (newVersion == null) {
      newVersion = wkfModelRepository.copy(wkfModel, true);
      newVersion.setPreviousVersion(wkfModel);
      String newVersionTag =
          Strings.isNullOrEmpty(wkfModel.getVersionTag())
              ? "1"
              : String.valueOf(Long.valueOf(wkfModel.getVersionTag()) + 1);
      newVersion.setCode(wkfModel.getCode());
      newVersion.setVersionTag(newVersionTag);
    }

    return wkfModelRepository.save(newVersion);
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public WkfModel start(WkfModel sourceModel, WkfModel targetModel) {

    if (!ObjectUtils.isEmpty(sourceModel)) {
      updatePreviousVersion(targetModel, sourceModel);
    } else {
      updatePreviousVersion(targetModel, targetModel.getPreviousVersion());
    }

    return wkfModelRepository.save(targetModel);
  }

  private void updatePreviousVersion(WkfModel wkfModel, WkfModel previousVersion) {
    if (previousVersion != null) {
      previousVersion.setIsActive(false);
      wkfModel.setPreviousVersion(terminate(previousVersion));
    }
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public WkfModel terminate(WkfModel wkfModel) {

    wkfModel.setStatusSelect(WkfModelRepository.STATUS_TERMINATED);

    return wkfModelRepository.save(wkfModel);
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public WkfModel backToDraft(WkfModel wkfModel) {

    wkfModel.setStatusSelect(WkfModelRepository.STATUS_NEW);

    return wkfModelRepository.save(wkfModel);
  }

  @Override
  public List<Long> findVersions(WkfModel wkfModel) {

    List<Long> wkfModelIds = new ArrayList<>();

    WkfModel previousModel = wkfModel.getPreviousVersion();

    while (previousModel != null) {
      wkfModelIds.add(previousModel.getId());
      previousModel = previousModel.getPreviousVersion();
    }

    return wkfModelIds;
  }

  protected XMLImporter getXMLImporter(String configFile, String dataFile) {

    XMLImporter importer = new XMLImporter(configFile, dataFile);
    final StringBuilder log = new StringBuilder();
    Listener listener =
        new Listener() {

          @Override
          public void imported(Integer imported, Integer total) {
            // do nothing
          }

          @Override
          public void imported(Model arg0) {
            WkfModel wkfModel = (WkfModel) arg0;
            bpmDeploymentService.deploy(null, wkfModel, null);
          }

          @Override
          public void handle(Model arg0, Exception err) {
            log.append("Error in import: ");
            log.append(Arrays.toString(err.getStackTrace()));
          }
        };
    importer.addListener(listener);

    return importer;
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public String importWkfModels(
      MetaFile metaFile, boolean translate, String sourceLanguage, String targetLanguage)
      throws Exception {

    if (metaFile == null) {
      return null;
    }

    String extension = Files.getFileExtension(metaFile.getFileName());
    if (extension == null || !extension.equals("xml")) {
      throw new IllegalStateException(I18n.get(ITranslation.INVALID_WKF_MODEL_XML));
    }

    InputStream inputStream = getClass().getResourceAsStream(IMPORT_CONFIG_PATH);
    File configFile = File.createTempFile("config", ".xml");
    FileOutputStream fout = new FileOutputStream(configFile);
    IOUtil.copyCompletely(inputStream, fout);

    File xmlFile = MetaFiles.getPath(metaFile).toFile();
    File tempDir = java.nio.file.Files.createTempDirectory(null).toFile();
    File importFile = new File(tempDir, "wkfModels.xml");
    Files.copy(xmlFile, importFile);

    if (translate) {
      this.translateNodeName(importFile, sourceLanguage, targetLanguage);
    }

    XMLImporter importer = new XMLImporter(configFile.getAbsolutePath(), tempDir.getAbsolutePath());
    final StringBuilder log = new StringBuilder();

    importer.addListener(
        new ConsumerListener(
            null,
            model -> {
              log.append("Import model: ");
              log.append(((WkfModel) model).getCode());
              log.append("\n");
            },
            (model, e) -> {
              log.append("Error in import: ");
              log.append(Arrays.toString(e.getStackTrace()));
              log.append("\n");
            }));

    importer.run();

    FileUtils.forceDelete(configFile);

    FileUtils.forceDelete(tempDir);

    FileUtils.forceDelete(xmlFile);

    metaFileRepository.remove(metaFile);

    return log.toString();
  }

  protected File translateNodeName(File importFile, String sourceLanguage, String targetLanguage)
      throws ParserConfigurationException, IOException, SAXException, TransformerException {

    DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
    DocumentBuilder db = dbf.newDocumentBuilder();
    Document doc = db.parse(importFile);
    doc.getDocumentElement().normalize();

    NodeList diagramNodeList = doc.getElementsByTagName("diagramXml");
    if (diagramNodeList.item(0) == null) {
      return importFile;
    }

    String diagramXml = diagramNodeList.item(0).getTextContent();
    String[] nodeNames =
        org.apache.commons.lang3.StringUtils.substringsBetween(diagramXml, "name=\"", "\"");
    for (String node : nodeNames) {
      String translationStr = translationService.getTranslationKey(node, sourceLanguage);
      translationStr = translationService.getTranslation(translationStr, targetLanguage);
      node = node.replace("$", "\\\\$");
      node = node.replace("{", "\\\\{");
      node = node.replace("}", "\\\\}");
      diagramXml = diagramXml.replaceAll(Pattern.quote(node), translationStr);
    }

    diagramNodeList.item(0).setTextContent(diagramXml);

    TransformerFactory transformerFactory = TransformerFactory.newInstance();
    Transformer transformer = transformerFactory.newTransformer();
    DOMSource source = new DOMSource(doc);
    StreamResult result = new StreamResult(new File(importFile.getPath()));
    transformer.transform(source, result);

    return importFile;
  }

  @Override
  public List<Map<String, Object>> getProcessPerStatus(WkfModel wkfModel) {
    List<Map<String, Object>> dataList = new ArrayList<>();
    List<WkfProcess> processList = wkfDashboardCommonService.findProcesses(wkfModel, null);

    processList.forEach(process -> dataList.add(buildDataMapPerStatus(process)));

    return dataList;
  }

  @SuppressWarnings("unchecked")
  protected Map<String, Object> buildDataMapPerStatus(WkfProcess process) {
    Map<String, Object> processMap = new HashMap<>();
    List<Map<String, Object>> configList = new ArrayList<>();

    List<WkfProcessConfig> processConfigs = process.getWkfProcessConfigList();
    wkfDashboardCommonService.sortProcessConfig(processConfigs);

    List<String> modelNames = new ArrayList<>();
    processConfigs.forEach(
        processConfig -> {
          final boolean isMetaModel = processConfig.getMetaModel() != null;
          final String modelName =
              isMetaModel
                  ? processConfig.getMetaModel().getName()
                  : processConfig.getMetaJsonModel().getName();

          if (modelNames.contains(modelName)) {
            return;
          }
          modelNames.add(modelName);

          var computedMap =
              wkfDashboardCommonService.computeStatus(isMetaModel, modelName, process, null, null);

          List<Long> recordIdsPerModel = (List<Long>) computedMap.get("recordIdsPerModel");
          List<Map<String, Object>> statusList =
              (List<Map<String, Object>>) computedMap.get("statuses");
          Map<String, Object> taskMap = (Map<String, Object>) computedMap.get("tasks");

          var map = new HashMap<String, Object>();
          map.put("type", "model");
          map.put(
              "title",
              !StringUtils.isBlank(processConfig.getTitle())
                  ? processConfig.getTitle()
                  : modelName);
          map.put("modelName", modelName);
          map.put("modelRecordCount", recordIdsPerModel.size());
          map.put("isMetaModel", isMetaModel);
          map.put("recordIdsPerModel", recordIdsPerModel);
          map.put("statuses", statusList);
          map.put("tasks", taskMap);
          configList.add(map);
        });

    processMap.put(
        "title",
        !StringUtils.isBlank(process.getDescription())
            ? process.getDescription()
            : process.getName());
    processMap.put("itemList", configList);

    return processMap;
  }

  @Override
  public List<Map<String, Object>> getProcessPerUser(WkfModel wkfModel) {
    List<Map<String, Object>> dataList = new ArrayList<>();
    List<WkfProcess> processes = wkfDashboardCommonService.findProcesses(wkfModel, null);

    processes.forEach(process -> dataList.add(buildDataMapPerUser(process)));

    return dataList;
  }

  @SuppressWarnings("unchecked")
  protected Map<String, Object> buildDataMapPerUser(WkfProcess process) {
    Map<String, Object> processMap = new HashMap<>();
    List<Map<String, Object>> configList = new ArrayList<>();
    WkfProcessConfig firstProcessConfig = null;

    User user = AuthUtils.getUser();

    List<WkfProcessConfig> processConfigs = process.getWkfProcessConfigList();
    wkfDashboardCommonService.sortProcessConfig(processConfigs);

    int taskAssignedToMe = 0;
    List<String> modelNames = new ArrayList<>();
    for (WkfProcessConfig processConfig : processConfigs) {

      if (firstProcessConfig == null) {
        firstProcessConfig =
            Boolean.TRUE.equals(processConfig.getIsStartModel()) ? processConfig : null;
      }

      boolean isDirectCreation = processConfig.getIsDirectCreation();

      boolean isMetaModel = processConfig.getMetaModel() != null;
      String modelName =
          isMetaModel
              ? processConfig.getMetaModel().getName()
              : processConfig.getMetaJsonModel().getName();

      if (modelNames.contains(modelName)) {
        continue;
      }
      modelNames.add(modelName);

      Map<String, Object> map =
          wkfDashboardCommonService.computeStatus(
              isMetaModel, modelName, process, user, WkfDashboardCommonService.ASSIGNED_ME);
      List<Long> recordIdsPerModel = (List<Long>) map.get("recordIdsPerModel");

      List<Map<String, Object>> statusList = (List<Map<String, Object>>) map.get("statuses");

      if (!statusList.isEmpty()) {
        taskAssignedToMe +=
            statusList.stream().map(s -> (int) s.get("statusCount")).reduce(0, Integer::sum);
      }

      Map<String, Object> taskMap = (Map<String, Object>) map.get("tasks");

      HashMap<String, Object> modelMap = new HashMap<>();
      modelMap.put("type", "model");
      modelMap.put(
          "title",
          !StringUtils.isBlank(processConfig.getTitle()) ? processConfig.getTitle() : modelName);
      modelMap.put("modelName", modelName);
      modelMap.put("modelRecordCount", recordIdsPerModel.size());
      modelMap.put("isMetaModel", isMetaModel);
      modelMap.put("recordIdsPerModel", recordIdsPerModel);
      modelMap.put("statuses", statusList);
      modelMap.put("tasks", taskMap);
      configList.add(modelMap);

      HashMap<String, Object> buttonMap = new HashMap<>();
      buttonMap.put("type", "button");
      buttonMap.put("isDirectCreation", isDirectCreation);
      buttonMap.put("modelName", modelName);
      buttonMap.put("isMetaModel", isMetaModel);
      configList.add(buttonMap);
    }

    String title =
        !StringUtils.isBlank(process.getDescription())
            ? process.getDescription()
            : process.getName();
    processMap.put("title", title);
    processMap.put("taskAssignedToMe", taskAssignedToMe);
    processMap.put("itemList", configList);
    processMap.put("processConfig", firstProcessConfig);

    return processMap;
  }
}
