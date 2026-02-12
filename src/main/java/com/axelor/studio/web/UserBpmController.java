/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.web;

import com.axelor.auth.db.User;
import com.axelor.inject.Beans;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.studio.bpm.service.authorization.BpmPermissionService;
import com.axelor.utils.helpers.ExceptionHelper;

public class UserBpmController {

  public void manageBpmAdminPermission(ActionRequest request, ActionResponse response) {
    try {
      User user = request.getContext().asType(User.class);
      Boolean isBpmAdministrator = user.getIsBpmAdministrator();

      Beans.get(BpmPermissionService.class).manageBpmAdminPermission(user, isBpmAdministrator);

      response.setValue("permissions", user.getPermissions());
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }
}
