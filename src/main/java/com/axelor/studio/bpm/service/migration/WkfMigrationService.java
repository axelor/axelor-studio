/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.migration;

import com.axelor.studio.db.WkfMigration;
import com.axelor.studio.db.WkfModel;
import java.util.List;
import java.util.Map;

public interface WkfMigrationService {

  Map<String, Object> generateNodeMap(WkfMigration migration);

  List<Long> getTargetVersionIds(WkfModel sourceVersion);

  void migrate(WkfMigration migration, Map<String, Object> contextMap);
}
