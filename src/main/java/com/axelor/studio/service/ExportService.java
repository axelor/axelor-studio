/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
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

  String getImage(MetaFile metaFile);

  String exportStudioActionLines(List<StudioActionLine> lines, int count);

  String exportWsKeyValueLines(List<WsKeyValue> wsKeyValues, int count, String type);

  String exportWsKeyValueHeadersLines(
      List<WsKeyValueSelectionHeader> wsKeyValues, int count, String type);

  String exportRequests(List<WsRequestList> wsRequests, int count, String type);

  String exportConnectors(List<WsConnector> wsConnectors, int count, String type);
}
