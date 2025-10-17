/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.deployment;

import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.WkfProcess;
import com.google.inject.persist.Transactional;
import java.util.Map;

public interface BpmDeploymentService {

  @Transactional
  void deploy(
      WkfModel sourceModel,
      WkfModel targetModel,
      Map<String, Object> migrationMap,
      boolean upgradeToLatest);

  void forceMigrate(WkfProcess process);

  void setIsMigrationOnGoing(WkfModel wkfModel, boolean isMigrationOnGoing);
}
