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
package com.axelor.studio.bpm.service;

import com.axelor.meta.db.MetaFile;
import com.axelor.studio.db.WkfModel;
import java.util.List;
import java.util.Map;

public interface WkfModelService {

  WkfModel createNewVersion(WkfModel wkfModel);

  WkfModel start(WkfModel sourceModel, WkfModel targetModel);

  WkfModel terminate(WkfModel wkfModel);

  WkfModel backToDraft(WkfModel wkfModel);

  List<Long> findVersions(WkfModel wkfModel);

  String importWkfModels(
      MetaFile metaFile, boolean translate, String sourceLanguage, String targetLanguage)
      throws Exception;

  List<Map<String, Object>> getProcessPerStatus(WkfModel wkfModel);

  List<Map<String, Object>> getProcessPerUser(WkfModel wkfModel);
}
