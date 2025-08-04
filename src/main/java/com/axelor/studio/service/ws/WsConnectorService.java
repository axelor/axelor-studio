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
