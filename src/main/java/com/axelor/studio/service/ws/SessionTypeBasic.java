/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.ws;

import com.axelor.studio.db.WsAuthenticator;
import jakarta.ws.rs.client.Invocation;
import jakarta.ws.rs.core.Response;
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
