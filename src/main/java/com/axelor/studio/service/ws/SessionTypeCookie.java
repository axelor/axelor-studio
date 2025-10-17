/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.ws;

import com.axelor.studio.db.WsAuthenticator;
import jakarta.ws.rs.client.Invocation;
import jakarta.ws.rs.core.NewCookie;
import jakarta.ws.rs.core.Response;
import java.util.HashMap;
import java.util.Map;

public class SessionTypeCookie implements SessionType {
  protected Map<String, NewCookie> cookies = new HashMap<>();

  @Override
  public void extractSessionData(Response response, WsAuthenticator wsAuthenticator) {
    this.cookies = response.getCookies();
  }

  @Override
  public void injectSessionData(Invocation.Builder request) {
    this.cookies.forEach((key, value) -> request.cookie(value));
  }
}
