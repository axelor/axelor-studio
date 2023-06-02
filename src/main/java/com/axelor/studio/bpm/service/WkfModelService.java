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
import java.io.IOException;
import java.util.List;
import java.util.Map;

public interface WkfModelService {

  public WkfModel createNewVersion(WkfModel wkfModel);

  public WkfModel start(WkfModel wkfModel);

  public WkfModel terminate(WkfModel wkfModel);

  public WkfModel backToDraft(WkfModel wkfModel);

  public List<Long> findVersions(WkfModel wkfModel);

  public void importStandardWkfModels() throws IOException;

  public String importWkfModels(
      MetaFile metaFile, boolean translate, String sourceLanguage, String targetLanguage)
      throws Exception;

  public List<Map<String, Object>> getProcessPerStatus(WkfModel wkfModel);

  public List<Map<String, Object>> getProcessPerUser(WkfModel wkfModel);
}
