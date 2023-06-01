package com.axelor.studio.service.ws;

import com.axelor.studio.db.WsAuthenticator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import javax.ws.rs.client.Invocation;
import javax.ws.rs.core.Response;

public class SessionTypeToken implements SessionType {
  private String token;

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
