/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.constructor;

import com.axelor.meta.db.MetaFile;
import com.axelor.studio.db.StudioApp;
import com.google.inject.persist.Transactional;
import java.io.File;
import java.util.List;
import java.util.Map;

public interface StudioAppService {

  StudioApp build(StudioApp studioApp);

  void checkCode(StudioApp studioApp);

  @Transactional(rollbackOn = Exception.class)
  void clean(StudioApp studioApp);

  @Transactional(rollbackOn = Exception.class)
  void deleteApp(StudioApp studioApp);

  MetaFile importApp(Map<String, Object> dataFileMap);

  MetaFile importApp(Map<String, Object> dataFileMap, StudioApp studioApp);

  MetaFile updateApp(Map<String, Object> dataFileMap, StudioApp studioApp, boolean detachAbsent);

  MetaFile exportApps(List<Integer> studioAppIds, boolean isExportData);

  MetaFile exportApp(StudioApp studioApp, boolean isExportData);

  void generateExportFile(File exportDir, boolean isExportData, int... studioAppIds);
}
