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

import com.axelor.meta.db.MetaFile;
import com.axelor.studio.db.StudioActionLine;
import com.axelor.studio.db.WsConnector;
import com.axelor.studio.db.WsKeyValue;
import com.axelor.studio.db.WsKeyValueSelectionHeader;
import com.axelor.studio.db.WsRequestList;
import java.util.List;

public interface ExportService {

  public String getImage(MetaFile metaFile);

  public String exportStudioActionLines(List<StudioActionLine> lines, int count);

  public String exportWsKeyValueLines(List<WsKeyValue> wsKeyValues, int count, String type);

  public String exportWsKeyValueHeadersLines(
      List<WsKeyValueSelectionHeader> wsKeyValues, int count, String type);

  public String exportRequests(List<WsRequestList> wsRequests, int count, String type);

  public String exportConnectors(List<WsConnector> wsConnectors, int count, String type);
}
