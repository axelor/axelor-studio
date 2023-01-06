/*
 * Axelor Business Solutions
 *
 * Copyright (C) 2022 Axelor (<http://axelor.com>).
 *
 * This program is free software: you can redistribute it and/or  modify
 * it under the terms of the GNU Affero General Public License, version 3,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
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
