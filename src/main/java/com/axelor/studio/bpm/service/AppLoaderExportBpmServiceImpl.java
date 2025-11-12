/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
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
import java.util.Arrays;
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

  protected static final String[] EXPORT_TEMPLATES = new String[] {"wkf-model", "wkf-dmn-model"};

  @Override
  public Map<String, InputStream> getExportTemplateResources() {

    Map<String, InputStream> templateMap = super.getExportTemplateResources();

    Arrays.asList(EXPORT_TEMPLATES)
        .forEach(
            filePrefix ->
                templateMap.put(
                    filePrefix + ".xml",
                    ResourceUtils.getResourceStream("data-export/" + filePrefix + ".tmpl")));

    return templateMap;
  }
}
