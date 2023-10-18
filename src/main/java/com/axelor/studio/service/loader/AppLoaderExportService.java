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
package com.axelor.studio.service.loader;

import com.axelor.data.xml.XMLBind;
import com.axelor.data.xml.XMLConfig;
import com.axelor.meta.db.MetaJsonField;
import com.axelor.studio.db.AppLoader;
import com.axelor.utils.helpers.context.FullContext;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;

public interface AppLoaderExportService {

  public void exportApps(AppLoader appLoader);

  public void writeXmlConfig(File configFile, XMLConfig xmlConfig) throws IOException;

  public Map<String, InputStream> getExportTemplateResources();

  public void fixTargetName(Map<String, Object> jsonFieldMap);

  public File createExportZip(File exportDir) throws IOException, FileNotFoundException;

  public void addRelationaJsonFieldBind(
      MetaJsonField jsonField, Map<String, Object> fieldAttrs, XMLBind xmlBind);

  public FileWriter createHeader(String dasherizeModel, File dataFile) throws IOException;

  public Object extractJsonFieldValue(FullContext record, Map<String, Object> fieldAttrs);
}
