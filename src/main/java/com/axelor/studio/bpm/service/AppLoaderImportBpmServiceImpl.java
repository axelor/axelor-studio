/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service;

import com.axelor.common.ResourceUtils;
import com.axelor.meta.MetaFiles;
import com.axelor.studio.db.repo.AppLoaderRepository;
import com.axelor.studio.service.loader.AppLoaderExportService;
import com.axelor.studio.service.loader.AppLoaderImportServiceImpl;
import jakarta.inject.Inject;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import org.apache.commons.io.IOUtils;

public class AppLoaderImportBpmServiceImpl extends AppLoaderImportServiceImpl {

  @Inject
  public AppLoaderImportBpmServiceImpl(
      AppLoaderRepository appLoaderRepository,
      MetaFiles metaFiles,
      AppLoaderExportService appLoaderExportService) {
    super(appLoaderRepository, metaFiles, appLoaderExportService);
  }

  protected static final String[] IMPORT_FILES =
      new String[] {"wkf-model.xml", "wkf-dmn-model.xml"};

  @Override
  public List<File> getAppImportConfigFiles(File dataDir) throws IOException {

    List<File> configFiles = super.getAppImportConfigFiles(dataDir);

    for (String fileName : IMPORT_FILES) {
      String dataFileName = fileName.replace("-call.xml", ".xml");
      if (!(new File(dataDir, dataFileName)).exists()) {
        continue;
      }
      File configFile = new File(dataDir, fileName.replace(".xml", "-config.xml"));
      FileOutputStream fout = new FileOutputStream(configFile);
      InputStream inStream = ResourceUtils.getResourceStream("data-import/" + fileName);
      IOUtils.copy(inStream, fout);
      inStream.close();
      fout.close();
      configFiles.add(configFile);
    }

    return configFiles;
  }
}
