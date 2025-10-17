/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.dmn.service;

import com.axelor.meta.db.MetaFile;
import com.axelor.studio.db.WkfDmnModel;

public interface DmnImportService {

  void importDmnTable(MetaFile dataFile, WkfDmnModel dmnModel);
}
