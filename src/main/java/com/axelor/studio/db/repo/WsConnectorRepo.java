/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.db.repo;

import com.axelor.studio.db.StudioApp;
import com.axelor.studio.db.WsConnector;
import com.axelor.studio.db.WsRequestList;
import java.util.ArrayList;
import java.util.List;
import org.apache.commons.collections.CollectionUtils;

public class WsConnectorRepo extends WsConnectorRepository {

  @Override
  public WsConnector save(WsConnector connector) {
    connector = super.save(connector);

    List<WsRequestList> requests =
        connector.getWsRequestList() != null ? connector.getWsRequestList() : new ArrayList<>();

    if (CollectionUtils.isEmpty(requests)) {
      return connector;
    }

    final StudioApp studioApp = connector.getStudioApp();
    requests.forEach(req -> req.setStudioApp(studioApp));

    return connector;
  }
}
