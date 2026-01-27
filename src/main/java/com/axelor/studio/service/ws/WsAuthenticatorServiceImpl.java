/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.ws;

import com.axelor.studio.db.WsAuthenticator;
import com.axelor.studio.db.WsRequest;
import com.axelor.studio.db.repo.WsAuthenticatorRepository;
import com.axelor.studio.service.AppSettingsStudioService;
import com.axelor.text.GroovyTemplates;
import com.axelor.utils.helpers.ExceptionHelper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.persist.Transactional;
import jakarta.inject.Inject;
import jakarta.ws.rs.client.Client;
import jakarta.ws.rs.client.ClientBuilder;
import jakarta.ws.rs.core.Response;
import java.io.IOException;
import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.Map;
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
    if (wsAuthenticator.getAuthWsRequest() != null) {
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

    if (response != null) {
      if (response.getStatus() == 200) {
        wsAuthenticator.setIsAuthenticated(true);
        wsAuthenticator.setRefreshTokenResponse(null);
        wsAuthenticatorRepository.save(wsAuthenticator);
      }
      response.close();
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
      ExceptionHelper.error(e);
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
      jsonNode.properties().forEach(it -> ctx.put(it.getKey(), mapValue(it.getValue())));
    } catch (IOException e) {
      ExceptionHelper.error(e);
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
      jsonNode.properties().forEach(it -> ctx.put(it.getKey(), mapValue(it.getValue())));
    } catch (IOException e) {
      ExceptionHelper.error(e);
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

  private String mapValue(JsonNode node) {
    return node.isArray() ? node.get(0).asText() : node.asText();
  }
}
