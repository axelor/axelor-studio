/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.web;

import com.axelor.i18n.I18n;
import com.axelor.inject.Beans;
import com.axelor.meta.schema.actions.ActionView;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.studio.db.WsAuthenticator;
import com.axelor.studio.db.repo.WsAuthenticatorRepository;
import com.axelor.studio.service.ws.WsAuthenticatorService;
import com.axelor.utils.helpers.ExceptionHelper;

public class WsAuthenticatorController {

  public void authenticate(ActionRequest request, ActionResponse response) {
    try {
      WsAuthenticator wsAuthenticator = request.getContext().asType(WsAuthenticator.class);

      if (wsAuthenticator.getId() == null) {
        return;
      }

      wsAuthenticator = Beans.get(WsAuthenticatorRepository.class).find(wsAuthenticator.getId());

      if (wsAuthenticator.getAuthTypeSelect().equals("basic")) {
        Beans.get(WsAuthenticatorService.class).authenticate(wsAuthenticator);
        response.setReload(true);
      } else {
        response.setView(
            ActionView.define(I18n.get("Authenticate"))
                .add(
                    "html", Beans.get(WsAuthenticatorService.class).generatAuthUrl(wsAuthenticator))
                .param("target", "_blank")
                .map());
      }
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }
}
