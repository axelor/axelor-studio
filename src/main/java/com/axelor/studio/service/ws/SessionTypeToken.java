/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.ws;

import com.axelor.studio.db.WsAuthenticator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.ws.rs.client.Invocation;
import jakarta.ws.rs.core.Response;

public class SessionTypeToken implements SessionType {
  protected String token;

  @Override
  public void extractSessionData(Response response, WsAuthenticator wsAuthenticator) {
    String responseBody = response.readEntity(String.class);
    ObjectMapper objectMapper = new ObjectMapper();
    JsonNode jsonNode;
    try {
      jsonNode = objectMapper.readTree(responseBody);
      this.token = jsonNode.get(wsAuthenticator.getTokenName()).asText();
    } catch (JsonProcessingException e) {
      throw new RuntimeException(e);
    }
  }

  @Override
  public void injectSessionData(Invocation.Builder request) {
    request.header("Authorization", "Bearer " + this.token);
  }
}
