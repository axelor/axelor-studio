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
package com.axelor.studio.service;

import com.axelor.db.JPA;
import com.axelor.meta.MetaFiles;
import com.axelor.meta.MetaScanner;
import com.axelor.meta.db.MetaFile;
import com.axelor.meta.db.MetaJsonField;
import com.axelor.meta.db.MetaJsonModel;
import com.axelor.meta.db.MetaView;
import com.axelor.meta.db.repo.MetaFileRepository;
import com.axelor.meta.db.repo.MetaJsonFieldRepository;
import com.axelor.meta.db.repo.MetaJsonModelRepository;
import com.axelor.meta.db.repo.MetaViewRepository;
import com.axelor.meta.loader.ViewGenerator;
import com.axelor.studio.db.AppLoader;
import com.axelor.studio.db.StudioAction;
import com.axelor.studio.db.StudioApp;
import com.axelor.studio.db.StudioChart;
import com.axelor.studio.db.StudioDashboard;
import com.axelor.studio.db.StudioMenu;
import com.axelor.studio.db.StudioSelection;
import com.axelor.studio.db.WsAuthenticator;
import com.axelor.studio.db.WsConnector;
import com.axelor.studio.db.WsRequest;
import com.axelor.studio.db.repo.AppLoaderRepository;
import com.axelor.studio.db.repo.StudioActionRepository;
import com.axelor.studio.db.repo.StudioAppRepository;
import com.axelor.studio.db.repo.StudioChartRepository;
import com.axelor.studio.db.repo.StudioDashboardRepository;
import com.axelor.studio.db.repo.StudioMenuRepository;
import com.axelor.studio.db.repo.StudioSelectionRepository;
import com.axelor.studio.db.repo.WsAuthenticatorRepository;
import com.axelor.studio.db.repo.WsConnectorRepository;
import com.axelor.studio.db.repo.WsRequestRepository;
import com.axelor.utils.ExceptionTool;
import com.google.inject.Inject;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.URL;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.apache.commons.io.IOUtils;

public class ImportServiceImpl {

  protected StudioChartRepository studioChartRepo;

  protected MetaJsonModelRepository metaJsonModelRepo;

  protected MetaJsonFieldRepository metaJsonFieldRepo;

  protected StudioSelectionRepository studioSelectionRepo;

  protected StudioDashboardRepository studioDashboardRepo;

  protected StudioMenuRepository studioMenuRepo;

  protected StudioActionRepository studioActionRepo;

  protected StudioAppRepository studioAppRepo;

  protected MetaFiles metaFiles;

  protected MetaFileRepository metaFileRepo;

  protected AppLoaderRepository appLoaderRepository;

  protected WsRequestRepository wsRequestRepo;

  protected WsAuthenticatorRepository wsAuthenticatorRepo;

  protected WsConnectorRepository wsConnectorRepo;

  protected ViewGenerator viewGenerator;

  protected MetaViewRepository metaViewRepo;

  @Inject
  public ImportServiceImpl(
      StudioChartRepository studioChartRepo,
      MetaJsonModelRepository metaJsonModelRepo,
      MetaJsonFieldRepository metaJsonFieldRepo,
      StudioSelectionRepository studioSelectionRepo,
      StudioDashboardRepository studioDashboardRepo,
      StudioMenuRepository studioMenuRepo,
      StudioActionRepository studioActionRepo,
      StudioAppRepository studioAppRepo,
      MetaFiles metaFiles,
      MetaFileRepository metaFileRepo,
      AppLoaderRepository appLoaderRepository,
      WsRequestRepository wsRequestRepo,
      WsAuthenticatorRepository wsAuthenticatorRepo,
      WsConnectorRepository wsConnectorRepo,
      ViewGenerator viewGenerator,
      MetaViewRepository metaViewRepo) {

    this.studioChartRepo = studioChartRepo;
    this.metaJsonModelRepo = metaJsonModelRepo;
    this.metaJsonFieldRepo = metaJsonFieldRepo;
    this.studioSelectionRepo = studioSelectionRepo;
    this.studioDashboardRepo = studioDashboardRepo;
    this.studioMenuRepo = studioMenuRepo;
    this.studioActionRepo = studioActionRepo;
    this.studioAppRepo = studioAppRepo;
    this.metaFiles = metaFiles;
    this.metaFileRepo = metaFileRepo;
    this.appLoaderRepository = appLoaderRepository;
    this.wsRequestRepo = wsRequestRepo;
    this.wsAuthenticatorRepo = wsAuthenticatorRepo;
    this.wsConnectorRepo = wsConnectorRepo;
    this.viewGenerator = viewGenerator;
    this.metaViewRepo = metaViewRepo;
  }

  public Object importMetaJsonModel(Object bean, Map<String, Object> values) {

    assert bean instanceof MetaJsonModel;

    return metaJsonModelRepo.save((MetaJsonModel) bean);
  }

  public Object importMetaJsonField(Object bean, Map<String, Object> values) {

    assert bean instanceof MetaJsonField;

    return metaJsonFieldRepo.save((MetaJsonField) bean);
  }

  public Object importStudioSelection(Object bean, Map<String, Object> values) {

    assert bean instanceof StudioSelection;

    return studioSelectionRepo.save((StudioSelection) bean);
  }

  public Object importStudioChart(Object bean, Map<String, Object> values) {

    assert bean instanceof StudioChart;

    return studioChartRepo.save((StudioChart) bean);
  }

  public Object importStudioDashboard(Object bean, Map<String, Object> values) {

    assert bean instanceof StudioDashboard;

    return studioDashboardRepo.save((StudioDashboard) bean);
  }

  public Object importStudioMenu(Object bean, Map<String, Object> values) {

    assert bean instanceof StudioMenu;

    return studioMenuRepo.save((StudioMenu) bean);
  }

  public Object importStudioAction(Object bean, Map<String, Object> values) {

    assert bean instanceof StudioAction;

    return studioActionRepo.save((StudioAction) bean);
  }

  public Object importStudioAppImg(Object bean, Map<String, Object> values) {

    assert bean instanceof StudioApp;

    StudioApp studioApp = (StudioApp) bean;
    String fileName = (String) values.get("fileName");
    String imageData = (String) values.get("imageData");

    if (fileName != null && imageData != null) {
      studioApp.setImage(importImg(fileName, imageData));
    }

    studioApp = studioAppRepo.save(studioApp);

    return studioApp;
  }

  public Object importStudioApp(Object bean, Map<String, Object> values) {

    assert bean instanceof StudioApp;

    StudioApp studioApp = (StudioApp) bean;

    studioApp = studioAppRepo.save(studioApp);

    Long appLoaderId = (Long) values.get("appLoaderId");

    if (appLoaderId != null) {
      appLoaderRepository.find(appLoaderId).addImportedStudioAppSetItem(studioApp);
    }

    return studioApp;
  }

  // Import methods specific for import from StudioApp
  protected MetaFile importImg(String name, String data) {

    if (data == null) {
      return null;
    }

    byte[] img = Base64.getDecoder().decode(data);

    ByteArrayInputStream inImg = new ByteArrayInputStream(img);

    MetaFile metaFile = metaFileRepo.all().filter("self.fileName = ?1", name).fetchOne();

    try {
      if (metaFile != null) {
        return metaFiles.upload(inImg, metaFile);
      } else {
        return metaFiles.upload(inImg, name);
      }
    } catch (IOException e) {
      ExceptionTool.trace(e);
    }

    return null;
  }

  public MetaJsonField importJsonModelField(Object bean, Map<String, Object> values) {

    assert bean instanceof MetaJsonField;

    MetaJsonField field = (MetaJsonField) bean;

    if (field.getJsonModel() == null) {
      return null;
    }

    return metaJsonFieldRepo.save(field);
  }

  public MetaJsonField importJsonField(Object bean, Map<String, Object> values) {

    assert bean instanceof MetaJsonField;

    MetaJsonField field = (MetaJsonField) bean;

    if (field.getJsonModel() != null) {
      return null;
    }

    return field;
  }

  public Object importAppMetaJsonModel(Object bean, Map<String, Object> values) {

    assert bean instanceof MetaJsonModel;

    MetaJsonModel model = (MetaJsonModel) bean;

    JPA.flush();

    JPA.refresh(model);

    return metaJsonModelRepo.save(model);
  }

  public Object importAppStudioDashboard(Object bean, Map<String, Object> values) {

    assert bean instanceof StudioDashboard;

    StudioDashboard dashboard = (StudioDashboard) bean;

    JPA.flush();

    JPA.refresh(dashboard);

    return studioDashboardRepo.save(dashboard);
  }

  public Object importAppLoader(Object bean, Map<String, Object> values) throws IOException {

    assert bean instanceof AppLoader;

    AppLoader appLoader = (AppLoader) bean;

    String importPath = (String) values.get("importFilePath");

    if (importPath != null) {
      File importZipFile = createAppLoaderImportZip(importPath);
      if (importZipFile != null) {
        appLoader.setImportMetaFile(metaFiles.upload(importZipFile));
      }
    }

    return appLoader;
  }

  public File createAppLoaderImportZip(String importPath) throws IOException {

    importPath = importPath.replaceAll("/|\\\\", "(/|\\\\\\\\)");
    List<URL> fileUrls = MetaScanner.findAll(importPath);

    if (fileUrls.isEmpty()) {
      return null;
    }

    ZipOutputStream zipOutputStream = null;
    try {
      File zipFile = MetaFiles.createTempFile("app-", ".zip").toFile();
      zipOutputStream = new ZipOutputStream(new FileOutputStream(zipFile));
      for (URL url : fileUrls) {
        File file = new File(url.getFile());
        ZipEntry zipEntry = new ZipEntry(file.getName());
        zipOutputStream.putNextEntry(zipEntry);
        IOUtils.copy(url.openStream(), zipOutputStream);
      }

      return zipFile;
    } catch (IOException e) {
      e.printStackTrace();
    } finally {
      if (zipOutputStream != null) {
        zipOutputStream.close();
      }
    }

    return null;
  }

  public Object importWsRequest(Object bean, Map<String, Object> values) {

    assert bean instanceof WsRequest;

    return wsRequestRepo.save((WsRequest) bean);
  }

  public Object importWsAuthenticator(Object bean, Map<String, Object> values) {

    assert bean instanceof WsAuthenticator;

    return wsAuthenticatorRepo.save((WsAuthenticator) bean);
  }

  public Object importWsConnector(Object bean, Map<String, Object> values) {

    assert bean instanceof WsConnector;

    return wsConnectorRepo.save((WsConnector) bean);
  }

  public Object importComputedView(Object bean, Map<String, Object> values) {

    assert bean instanceof MetaView;

    MetaView metaView = (MetaView) bean;

    if (metaView != null && metaView.getExtension()) {
      viewGenerator.process(Collections.singletonList(metaView.getName()), true);
    }

    return metaViewRepo.find(metaView.getId());
  }
}
