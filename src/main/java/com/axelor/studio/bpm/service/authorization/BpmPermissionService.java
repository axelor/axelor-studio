/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.authorization;

import com.axelor.auth.db.User;
import com.axelor.studio.db.WkfModel;

public interface BpmPermissionService {

  void syncPermissions(WkfModel wkfModel);

  void manageBpmAdminPermission(User user, Boolean isBpmAdministrator);
}
