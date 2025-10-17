/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.ws;

import com.axelor.studio.db.WsAuthenticator;
import jakarta.ws.rs.core.Response;

public interface WsAuthenticatorService {

  String generatAuthUrl(WsAuthenticator wsAuthenticator);

  void authenticate(WsAuthenticator wsAuthenticator);

  Response refereshToken(WsAuthenticator wsAuthenticator);
}
