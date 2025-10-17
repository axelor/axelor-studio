/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.loader;

import com.axelor.studio.db.AppLoader;
import java.io.File;
import java.io.IOException;
import java.util.List;

public interface AppLoaderImportService {

  void importApps(AppLoader appLoader) throws IOException;

  List<File> getAppImportConfigFiles(File dataDir) throws IOException;
}
