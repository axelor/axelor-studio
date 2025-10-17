/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.loader;

import com.axelor.data.xml.XMLBind;
import com.axelor.data.xml.XMLConfig;
import com.axelor.meta.db.MetaJsonField;
import com.axelor.studio.db.AppLoader;
import com.axelor.utils.helpers.context.FullContext;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;

public interface AppLoaderExportService {

  void exportApps(AppLoader appLoader);

  void writeXmlConfig(File configFile, XMLConfig xmlConfig) throws IOException;

  Map<String, InputStream> getExportTemplateResources();

  void fixTargetName(Map<String, Object> jsonFieldMap);

  File createExportZip(File exportDir) throws IOException;

  void addRelationaJsonFieldBind(
      MetaJsonField jsonField, Map<String, Object> fieldAttrs, XMLBind xmlBind);

  FileWriter createHeader(String dasherizeModel, File dataFile) throws IOException;

  Object extractJsonFieldValue(FullContext record, Map<String, Object> fieldAttrs);
}
