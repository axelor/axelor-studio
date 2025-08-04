package com.axelor.studio.service.ws;

import com.axelor.studio.db.WsAuthenticator;
import jakarta.ws.rs.client.Invocation;
import jakarta.ws.rs.core.Response;

public interface SessionType {

  void extractSessionData(Response response, WsAuthenticator wsAuthenticator);

  void injectSessionData(Invocation.Builder request);
}
