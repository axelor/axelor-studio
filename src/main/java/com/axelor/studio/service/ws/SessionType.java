package com.axelor.studio.service.ws;

import com.axelor.studio.db.WsAuthenticator;
import javax.ws.rs.client.Invocation;
import javax.ws.rs.core.Response;

public interface SessionType {

  void extractSessionData(Response response, WsAuthenticator wsAuthenticator);

  public void injectSessionData(Invocation.Builder request);
}
