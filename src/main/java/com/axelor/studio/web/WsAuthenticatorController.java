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
package com.axelor.studio.web;

import com.axelor.i18n.I18n;
import com.axelor.inject.Beans;
import com.axelor.meta.schema.actions.ActionView;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.studio.db.WsAuthenticator;
import com.axelor.studio.db.repo.WsAuthenticatorRepository;
import com.axelor.studio.service.ws.WsAuthenticatorService;
import com.axelor.utils.ExceptionTool;

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
      ExceptionTool.trace(response, e);
    }
  }
}
