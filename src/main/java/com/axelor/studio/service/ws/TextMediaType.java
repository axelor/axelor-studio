package com.axelor.studio.service.ws;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.ws.rs.core.Response;
import java.io.IOException;
import java.util.List;
import java.util.Map;

public class TextMediaType implements MediaType {
  public Object parseResponse(Response wsResponse) throws IOException {
    byte[] responseByte = wsResponse.readEntity(byte[].class);
    return (new ObjectMapper())
        .readValue(responseByte, determineResponseType(new String(responseByte)));
  }

  private Class<?> determineResponseType(String responseStr) {
    if (responseStr.startsWith("[")) {
      return List.class;
    } else if (responseStr.startsWith(("{"))) {
      return Map.class;
    } else {
      return Object.class;
    }
  }
}
