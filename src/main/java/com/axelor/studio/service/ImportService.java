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
package com.axelor.studio.service;

import com.axelor.meta.db.MetaJsonField;
import java.io.File;
import java.io.IOException;
import java.util.Map;

public interface ImportService {

  public Object importMetaJsonModel(Object bean, Map<String, Object> values);

  public Object importMetaJsonField(Object bean, Map<String, Object> values);

  public Object importStudioSelection(Object bean, Map<String, Object> values);

  public Object importStudioChart(Object bean, Map<String, Object> values);

  public Object importStudioDashboard(Object bean, Map<String, Object> values);

  public Object importStudioMenu(Object bean, Map<String, Object> values);

  public Object importStudioAction(Object bean, Map<String, Object> values);

  public Object importStudioAppImg(Object bean, Map<String, Object> values);

  public Object importStudioApp(Object bean, Map<String, Object> values);

  public MetaJsonField importJsonModelField(Object bean, Map<String, Object> values);

  public MetaJsonField importJsonField(Object bean, Map<String, Object> values);

  public Object importAppMetaJsonModel(Object bean, Map<String, Object> values);

  public Object importAppStudioDashboard(Object bean, Map<String, Object> values);

  public Object importAppLoader(Object bean, Map<String, Object> values) throws IOException;

  public File createAppLoaderImportZip(String importPath) throws IOException;

  public Object importWsRequest(Object bean, Map<String, Object> values);

  public Object importWsAuthenticator(Object bean, Map<String, Object> values);

  public Object importWsConnector(Object bean, Map<String, Object> values);

  public Object importComputedView(Object bean, Map<String, Object> values);
}
