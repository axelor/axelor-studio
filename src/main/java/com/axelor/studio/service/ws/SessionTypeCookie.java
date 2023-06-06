package com.axelor.studio.service.ws;

import com.axelor.studio.db.WsAuthenticator;
import java.util.HashMap;
import java.util.Map;
import javax.ws.rs.client.Invocation;
import javax.ws.rs.core.NewCookie;
import javax.ws.rs.core.Response;

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
