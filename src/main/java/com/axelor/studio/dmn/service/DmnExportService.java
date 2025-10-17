/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.dmn.service;

import com.axelor.studio.db.WkfDmnModel;
import java.io.File;

public interface DmnExportService {

  File exportDmnTable(WkfDmnModel wkfDmnModel);
}
