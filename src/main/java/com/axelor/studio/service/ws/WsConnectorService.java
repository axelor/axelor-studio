/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.ws;

import com.axelor.studio.db.WsAuthenticator;
import com.axelor.studio.db.WsConnector;
import com.axelor.studio.db.WsRequest;
import com.axelor.text.Templates;
import jakarta.ws.rs.client.Client;
import jakarta.ws.rs.client.Entity;
import jakarta.ws.rs.core.Response;
import java.util.Map;

public interface WsConnectorService {

  Map<String, Object> callConnector(
      WsConnector wsConnector, WsAuthenticator authenticator, Map<String, Object> ctx);

  Map<String, Object> createContext(WsConnector wsConnector, WsAuthenticator authenticator);

  Entity<?> createEntity(WsRequest wsRequest, Templates templates, Map<String, Object> ctx);

  Response callRequest(
      WsRequest wsRequest, String url, Client client, Templates templates, Map<String, Object> ctx);

  void addAttachement(
      Map<String, Object> ctx,
      WsRequest wsRequest,
      Response response,
      WsConnector wsConnector,
      Throwable e);

  void addAttachement(Map<String, Object> ctx, WsConnector wsConnector);
}
