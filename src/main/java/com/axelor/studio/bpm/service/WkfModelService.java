/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
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
