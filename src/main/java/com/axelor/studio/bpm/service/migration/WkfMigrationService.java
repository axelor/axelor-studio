/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.migration;

import com.axelor.studio.bpm.dto.MigrationResult;
import com.axelor.studio.db.WkfMigration;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.WkfProcess;
import java.util.List;
import java.util.Map;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.repository.ProcessDefinition;

public interface WkfMigrationService {

  Map<String, Object> generateNodeMap(WkfMigration migration);

  List<Long> getTargetVersionIds(WkfModel sourceVersion);

  void migrate(WkfMigration migration, Map<String, Object> contextMap);

  MigrationResult migrateRunningInstances(
      String oldDeploymentId,
      ProcessEngine engine,
      List<ProcessDefinition> definitions,
      Map<String, WkfProcess> migrationProcessMap,
      WkfModel sourceModel,
      Map<String, Object> nodeMappings);

  void migrateInstanceTasks(ProcessEngine engine, WkfModel targetModel);

  void setIsMigrationOnGoing(WkfModel wkfModel, boolean isMigrationOnGoing);

  void removePreviousVersionMenus(WkfModel wkfModel);
}
