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

import com.axelor.common.ResourceUtils;
import com.axelor.db.JpaSecurity;
import com.axelor.meta.MetaFiles;
import com.axelor.meta.db.repo.MetaJsonModelRepository;
import com.axelor.meta.db.repo.MetaJsonRecordRepository;
import com.axelor.studio.db.repo.AppLoaderRepository;
import com.axelor.studio.service.loader.AppLoaderExportServiceImpl;
import com.google.inject.Inject;
import java.io.InputStream;
import java.util.Map;

public class AppLoaderExportBpmServiceImpl extends AppLoaderExportServiceImpl {

  @Inject
  public AppLoaderExportBpmServiceImpl(
      MetaFiles metaFiles,
      AppLoaderRepository appLoaderRepository,
      MetaJsonRecordRepository metaJsonRecordRepository,
      JpaSecurity jpaSecurity,
      MetaJsonModelRepository metaJsonModelRepository) {
    super(
        metaFiles,
        appLoaderRepository,
        metaJsonRecordRepository,
        jpaSecurity,
        metaJsonModelRepository);
  }

  protected static final String[] EXPORT_TEMPLATES =
      new String[] {"baml-model", "wkf-model", "wkf-dmn-model"};

  @Override
  public Map<String, InputStream> getExportTemplateResources() {

    Map<String, InputStream> templateMap = super.getExportTemplateResources();

    for (String filePrefix : EXPORT_TEMPLATES) {
      templateMap.put(
          filePrefix + ".xml",
          ResourceUtils.getResourceStream("data-export/" + filePrefix + ".tmpl"));
    }

    return templateMap;
  }
}
