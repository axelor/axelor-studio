package com.axelor.studio.service.ws;

import com.axelor.utils.ExceptionTool;
import com.fasterxml.jackson.databind.json.JsonMapper;
import java.util.List;
import java.util.Map;

public class JsonMediaType implements MediaType {
  @Override
  public Object parseResponse(byte[] responseByte) {
    try {
      return (new JsonMapper())
          .readValue(
              responseByte,
              determineResponseType(
                  new String(responseByte))); // determineResponseType(new String(responseByte))
    } catch (Exception e) {
      ExceptionTool.trace(e);
      return responseByte;
    }
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
