/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.ws;

import com.fasterxml.jackson.databind.json.JsonMapper;
import jakarta.ws.rs.core.Response;
import java.io.IOException;
import java.util.List;
import java.util.Map;

public class JsonMediaType implements MediaType {
  @Override
  public Object parseResponse(Response wsResponse) throws IOException {
    byte[] responseByte = wsResponse.readEntity(byte[].class);
    return (new JsonMapper())
        .readValue(
            responseByte,
            determineResponseType(
                new String(responseByte))); // determineResponseType(new String(responseByte))
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
