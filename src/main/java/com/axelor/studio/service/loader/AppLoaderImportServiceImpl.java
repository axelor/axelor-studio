/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.loader;

import com.axelor.common.FileUtils;
import com.axelor.common.ResourceUtils;
import com.axelor.data.xml.XMLImporter;
import com.axelor.file.temp.TempFiles;
import com.axelor.i18n.I18n;
import com.axelor.meta.MetaFiles;
import com.axelor.studio.db.AppLoader;
import com.axelor.studio.db.repo.AppLoaderRepository;
import com.axelor.studio.exception.StudioExceptionMessage;
import com.axelor.studio.utils.ConsumerListener;
import com.axelor.studio.utils.XmlUtils;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.nio.file.Files;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import javax.xml.parsers.ParserConfigurationException;
import org.apache.commons.io.IOUtils;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

public class AppLoaderImportServiceImpl implements AppLoaderImportService {

  protected static final String[] IMPORT_FILES =
      new String[] {
        "studio-app.xml",
        "studio-selection.xml",
        "json-model.xml",
        "json-field.xml",
        "json-model-call.xml",
        "studio-chart.xml",
        "studio-dashboard.xml",
        "studio-dashlet.xml",
        "studio-dashboard-call.xml",
        "studio-action.xml",
        "studio-menu.xml",
        "ws-request.xml",
        "ws-request-list.xml",
        "ws-authenticator.xml",
        "ws-connector.xml",
        "meta-view.xml",
        "meta-action.xml"
      };

  protected AppLoaderRepository appLoaderRepository;

  protected MetaFiles metaFiles;

  protected AppLoaderExportService appLoaderExportService;

  @Inject
  public AppLoaderImportServiceImpl(
      AppLoaderRepository appLoaderRepository,
      MetaFiles metaFiles,
      AppLoaderExportService appLoaderExportService) {
    this.appLoaderRepository = appLoaderRepository;
    this.metaFiles = metaFiles;
    this.appLoaderExportService = appLoaderExportService;
  }

  @Override
  public void importApps(AppLoader appLoader) throws IOException {

    if (appLoader.getImportMetaFile() == null) {
      return;
    }

    File dataDir = Files.createTempDirectory("").toFile();
    extractImportZip(appLoader, dataDir);

    File logFile = importApp(appLoader, dataDir);

    addLogFile(appLoader, logFile);

    FileUtils.deleteDirectory(dataDir);
  }

  @Transactional(rollbackOn = Exception.class)
  protected void addLogFile(AppLoader appLoader, File logFile) throws IOException {

    appLoader = appLoaderRepository.find(appLoader.getId());
    if (appLoader.getImportLog() == null) {
      appLoader.setImportLog(metaFiles.upload(logFile));
    }

    appLoader.setImportedOn(LocalDateTime.now());
    appLoaderRepository.save(appLoader);
  }

  @Override
  public void extractImportZip(File dataDir, File zipFile) throws IOException {
    if (zipFile == null) {
      return;
    }
    try (FileInputStream fin = new FileInputStream(zipFile);
        ZipInputStream zipInputStream = new ZipInputStream(fin)) {
      ZipEntry zipEntry = zipInputStream.getNextEntry();

      while (zipEntry != null) {
        File destFile = new File(dataDir, zipEntry.getName());
        if (!destFile.getCanonicalPath().startsWith(dataDir.getCanonicalPath() + File.separator)) {
          throw new IOException("Zip entry is outside of target dir: " + zipEntry.getName());
        }
        try (FileOutputStream fout = new FileOutputStream(destFile)) {
          IOUtils.copy(zipInputStream, fout);
        }
        zipEntry = zipInputStream.getNextEntry();
      }
    }
  }

  protected void extractImportZip(AppLoader appLoader, File dataDir) throws IOException {
    extractImportZip(dataDir, MetaFiles.getPath(appLoader.getImportMetaFile()).toFile());
  }

  protected File importApp(AppLoader appLoader, File dataDir) throws IOException {

    File logFile =
        appLoader.getImportLog() != null
            ? MetaFiles.getPath(appLoader.getImportLog()).toFile()
            : TempFiles.createTempFile("import-", "log").toFile();

    try (PrintWriter pw = new PrintWriter(logFile)) {
      for (File configFile : getAppImportConfigFiles(dataDir)) {
        XMLImporter xmlImporter =
            new XMLImporter(configFile.getAbsolutePath(), dataDir.getAbsolutePath());
        xmlImporter.setContext(getImportContext(appLoader));
        final StringBuilder log = new StringBuilder();
        xmlImporter.addListener(
            new ConsumerListener(
                (num, app) -> {
                  log.append("Import model: ");
                  log.append(num);
                  log.append("\n");
                },
                model -> {
                  log.append("Import model: ");
                  log.append(model);
                  log.append("\n");
                },
                (model, e) -> pw.println("Error importing: " + model)));

        xmlImporter.run();
      }
    }

    return logFile;
  }

  @Override
  public List<File> getAppImportConfigFiles(File dataDir) throws IOException {

    List<File> configFiles = new ArrayList<>();

    for (String fileName : IMPORT_FILES) {
      String dataFileName = fileName.replace("-call.xml", ".xml");
      if (!(new File(dataDir, dataFileName)).exists()) {
        continue;
      }
      File configFile = new File(dataDir, fileName.replace(".xml", "-config.xml"));
      try (FileOutputStream fout = new FileOutputStream(configFile);
          InputStream inStream = ResourceUtils.getResourceStream("data-import/" + fileName)) {
        IOUtils.copy(inStream, fout);
      }
      configFiles.add(configFile);
    }

    File dataConfigFile = new File(dataDir, "data-config.xml");
    if (dataConfigFile.exists()) {
      configFiles.add(dataConfigFile);
    }

    return configFiles;
  }

  protected Map<String, Object> getImportContext(AppLoader appLoader) {
    return Map.of("appLoaderId", appLoader.getId());
  }

  @Override
  public void validateZipForApp(File dataDir, String appCode) throws IOException {
    File studioAppFile = new File(dataDir, "studio-app.xml");
    if (!studioAppFile.exists()) {
      return;
    }

    try {
      Document doc =
          XmlUtils.createSecureDocumentBuilderFactory().newDocumentBuilder().parse(studioAppFile);
      NodeList appNodes = doc.getDocumentElement().getElementsByTagName("studio-app");

      if (appNodes.getLength() != 1) {
        throw new IllegalStateException(I18n.get(StudioExceptionMessage.IMPORT_ZIP_MULTIPLE_APPS));
      }

      Element appElement = (Element) appNodes.item(0);
      NodeList codeNodes = appElement.getElementsByTagName("code");
      if (codeNodes.getLength() > 0) {
        String zipAppCode = codeNodes.item(0).getTextContent().trim();
        if (!appCode.equals(zipAppCode)) {
          throw new IllegalStateException(
              I18n.get(StudioExceptionMessage.IMPORT_ZIP_APP_MISMATCH)
                  .formatted(zipAppCode, appCode));
        }
      }
    } catch (ParserConfigurationException | SAXException e) {
      throw new IOException("Failed to parse studio-app.xml", e);
    }
  }
}
