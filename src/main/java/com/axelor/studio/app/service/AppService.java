/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.app.service;

import com.axelor.app.AppSettings;
import com.axelor.app.AvailableAppSettings;
import com.axelor.db.Model;
import com.axelor.i18n.I18n;
import com.axelor.studio.db.App;
import com.axelor.studio.exception.StudioExceptionMessage;
import java.io.File;
import java.io.IOException;
import java.util.Collection;

public interface AppService {

  App importDataDemo(App app) throws IOException;

  Model getApp(String type);

  boolean isApp(String type);

  App installApp(App app, String language) throws IOException;

  App unInstallApp(App app);

  void initApps() throws IOException;

  void bulkInstall(Collection<App> apps, boolean importDemo, String language) throws IOException;

  App importRoles(App app) throws IOException;

  void importRoles() throws IOException;

  static String getFileUploadDir() {
    String dataUploadDirPath = AppSettings.get().get(AvailableAppSettings.DATA_UPLOAD_DIR);
    if (dataUploadDirPath.isEmpty()) {
      throw new IllegalStateException(I18n.get(StudioExceptionMessage.FILE_UPLOAD_DIR_ERROR));
    }
    return !dataUploadDirPath.endsWith(File.separator)
        ? dataUploadDirPath + File.separator
        : dataUploadDirPath;
  }
}
