/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.db.repo;

import com.axelor.studio.db.StudioApp;
import com.axelor.studio.db.WsAuthenticator;
import com.axelor.studio.db.WsRequest;

public class WsAuthenticatorRepo extends WsAuthenticatorRepository {

  @Override
  public WsAuthenticator save(WsAuthenticator authenticator) {
    authenticator = super.save(authenticator);

    StudioApp studioApp = authenticator.getStudioApp();

    WsRequest authReq = authenticator.getAuthWsRequest();
    if (authReq != null) {
      authReq.setStudioApp(studioApp);
    }

    WsRequest tokenReq = authenticator.getTokenWsRequest();
    if (tokenReq != null) {
      tokenReq.setStudioApp(studioApp);
    }

    WsRequest refreshTokenReq = authenticator.getRefreshTokenWsRequest();
    if (refreshTokenReq != null) {
      refreshTokenReq.setStudioApp(studioApp);
    }

    return authenticator;
  }
}
