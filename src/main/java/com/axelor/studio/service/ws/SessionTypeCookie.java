package com.axelor.studio.service.ws;

import com.axelor.studio.db.WsAuthenticator;
import java.util.Map;
import javax.ws.rs.client.Invocation;
import javax.ws.rs.core.NewCookie;
import javax.ws.rs.core.Response;

public class SessionTypeCookie implements SessionType {
  private Map<String, NewCookie> cookies;

  public SessionTypeCookie() {
    this.cookies = null;
  }

  @Override
  public void extractSessionData(Response response, WsAuthenticator wsAuthenticator) {
    this.cookies = response.getCookies();
  }

  @Override
  public void injectSessionData(Invocation.Builder request) {
    for (Map.Entry<String, NewCookie> cookie : this.cookies.entrySet()) {
      request.cookie(cookie.getValue());
    }
  }
}
