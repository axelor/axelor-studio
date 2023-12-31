package com.axelor.studio.service.ws;

import com.axelor.studio.db.WsAuthenticator;
import javax.ws.rs.client.Invocation;
import javax.ws.rs.core.Response;
import org.apache.commons.codec.binary.Base64;

public class SessionTypeBasic implements SessionType {
  Object header = new Object();

  @Override
  public void extractSessionData(Response response, WsAuthenticator wsAuthenticator) {
    header =
        new String(
            Base64.encodeBase64(
                wsAuthenticator
                    .getUsername()
                    .concat(":")
                    .concat(wsAuthenticator.getPassword())
                    .getBytes()));
  }

  @Override
  public void injectSessionData(Invocation.Builder request) {
    request.header("Authorization", "Basic " + header);
  }
}
