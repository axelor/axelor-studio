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
package com.axelor.web;

import com.axelor.inject.Beans;
import com.axelor.studio.db.WsAuthenticator;
import com.axelor.studio.db.repo.WsAuthenticatorRepository;
import com.axelor.studio.service.AppSettingsStudioService;
import com.axelor.studio.service.ws.WsAuthenticatorService;
import com.axelor.utils.helpers.ExceptionHelper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.persist.Transactional;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MultivaluedMap;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import java.net.URI;
import java.net.URISyntaxException;

@Path("/ws-auth")
public class WsTokenHandler {

  @GET
  @Path("/token")
  @Transactional(rollbackOn = {Exception.class})
  public Response read(@Context UriInfo uri) throws URISyntaxException {

    MultivaluedMap<String, String> paramMap = uri.getQueryParameters();

    String state = paramMap.getFirst("state");

    AppSettingsStudioService appSettingsStudioService = Beans.get(AppSettingsStudioService.class);
    String baseUrl = appSettingsStudioService.baseUrl();

    if (state == null) {
      return Response.temporaryRedirect(new URI(baseUrl)).build();
    }

    WsAuthenticatorRepository wsAuthenticatorRepository =
        Beans.get(WsAuthenticatorRepository.class);

    WsAuthenticator authenticator = wsAuthenticatorRepository.find(Long.parseLong(state));

    try {

      String jsonResponse = new ObjectMapper().writeValueAsString(paramMap);
      authenticator.setAuthResponse(jsonResponse);
      authenticator = wsAuthenticatorRepository.save(authenticator);
      Beans.get(WsAuthenticatorService.class).authenticate(authenticator);
    } catch (JsonProcessingException e) {
      ExceptionHelper.error(e);
    }

    return Response.temporaryRedirect(new URI(baseUrl)).build();
  }
}
