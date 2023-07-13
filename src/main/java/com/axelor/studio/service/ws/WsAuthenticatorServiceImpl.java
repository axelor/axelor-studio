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
import com.axelor.studio.db.WsRequest;
import com.axelor.studio.db.repo.WsAuthenticatorRepository;
import com.axelor.studio.service.AppSettingsStudioService;
import com.axelor.text.GroovyTemplates;
import com.axelor.utils.ExceptionTool;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import java.io.IOException;
import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.Map;
import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.core.Response;
import org.apache.http.client.utils.URIBuilder;

public class WsAuthenticatorServiceImpl implements WsAuthenticatorService {

  protected WsConnectorService wsConnectorService;

  protected WsAuthenticatorRepository wsAuthenticatorRepository;
  protected AppSettingsStudioService appSettingsStudioService;
  protected GroovyTemplates templates;

  @Inject
  public WsAuthenticatorServiceImpl(
      WsConnectorService wsConnectorService,
      WsAuthenticatorRepository wsAuthenticatorRepository,
      AppSettingsStudioService appSettingsStudioService,
      GroovyTemplates templates) {
    this.wsConnectorService = wsConnectorService;
    this.wsAuthenticatorRepository = wsAuthenticatorRepository;
    this.appSettingsStudioService = appSettingsStudioService;
    this.templates = templates;
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public void authenticate(WsAuthenticator wsAuthenticator) {

    String authType = wsAuthenticator.getAuthTypeSelect();
    Map<String, Object> ctx = new HashMap<>();
    Client client = ClientBuilder.newClient();

    Response response = null;
    if(wsAuthenticator.getAuthWsRequest() != null) {
      if (authType.equals("basic")) {
        response =
                wsConnectorService.callRequest(
                        wsAuthenticator.getAuthWsRequest(),
                        wsAuthenticator.getAuthWsRequest().getWsUrl(),
                        client,
                        templates,
                        ctx);

      } else {
        response = performOAuth2(wsAuthenticator, client, templates, ctx);
      }
    }

    if (response != null && response.getStatus() == 200) {
      wsAuthenticator.setIsAuthenticated(true);
      wsAuthenticator.setRefreshTokenResponse(null);
      wsAuthenticatorRepository.save(wsAuthenticator);
    }
  }

  @Override
  public String generatAuthUrl(WsAuthenticator wsAuthenticator) {

    WsRequest authRequest = wsAuthenticator.getAuthWsRequest();
    String url = authRequest.getWsUrl();

    try {
      URIBuilder uriBuilder = new URIBuilder(url);

      authRequest
          .getPayLoadWsKeyValueList()
          .forEach(
              wsKeyValue ->
                  uriBuilder.addParameter(wsKeyValue.getWsKey(), wsKeyValue.getWsValue()));

      uriBuilder.addParameter("state", wsAuthenticator.getId().toString());
      uriBuilder.addParameter("redirect_uri", getRedirectUrl());
      url = uriBuilder.toString();
    } catch (URISyntaxException e) {
      ExceptionTool.trace(e);
    }

    return url;
  }

  protected String getRedirectUrl() {

    String redirectUrl = appSettingsStudioService.baseUrl();

    redirectUrl += "/ws/ws-auth/token";

    return redirectUrl;
  }

  protected Response performOAuth2(
      WsAuthenticator wsAuthenticator,
      Client client,
      GroovyTemplates templates,
      Map<String, Object> ctx) {

    if (wsAuthenticator.getAuthResponse() == null) {
      return null;
    }

    ObjectMapper mapper = new ObjectMapper();

    try {
      JsonNode jsonNode = mapper.readTree(wsAuthenticator.getAuthResponse());
      jsonNode
          .fields()
          .forEachRemaining(
              it ->
                  ctx.put(
                      it.getKey(),
                      (it.getValue().isArray()
                          ? it.getValue().get(0).asText()
                          : it.getValue().asText())));
    } catch (IOException e) {
    }

    Response response =
        wsConnectorService.callRequest(
            wsAuthenticator.getTokenWsRequest(),
            wsAuthenticator.getTokenWsRequest().getWsUrl(),
            client,
            templates,
            ctx);

    if (response.hasEntity()) {
      wsAuthenticator.setTokenResponse(response.readEntity(String.class));
    }

    return response;
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public Response refereshToken(WsAuthenticator wsAuthenticator) {

    String tokenResponse = wsAuthenticator.getTokenResponse();

    if (tokenResponse == null || wsAuthenticator.getRefreshTokenWsRequest() == null) {
      return null;
    }

    Map<String, Object> ctx = new HashMap<>();
    Client client = ClientBuilder.newClient();
    ObjectMapper mapper = new ObjectMapper();

    try {
      JsonNode jsonNode = mapper.readTree(tokenResponse);
      jsonNode
          .fields()
          .forEachRemaining(
              it ->
                  ctx.put(
                      it.getKey(),
                      (it.getValue().isArray()
                          ? it.getValue().get(0).asText()
                          : it.getValue().asText())));
    } catch (IOException e) {
    }

    Response response =
        wsConnectorService.callRequest(
            wsAuthenticator.getRefreshTokenWsRequest(),
            wsAuthenticator.getRefreshTokenWsRequest().getWsUrl(),
            client,
            templates,
            ctx);

    if (response.hasEntity()) {
      if (response.getStatus() == 401 || response.getStatus() == 400) {
        wsAuthenticator.setIsAuthenticated(false);
      } else {
        wsAuthenticator.setRefreshTokenResponse(response.readEntity(String.class));
      }
      wsAuthenticatorRepository.save(wsAuthenticator);
    }

    return response;
  }
}
