/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.authorization;

import com.axelor.auth.db.User;
import com.axelor.db.Model;
import com.axelor.studio.db.WkfModel;
import java.util.List;
import java.util.Map;

public interface BpmAuthorizationService {

  boolean canUserTriggerProcess(User user, WkfModel wkfModel);

  List<Map<String, Object>> filterWkfStatus(
      User user, Model record, List<Map<String, Object>> wkfStatusList);

  AuthorizationResult computeAuthorization(User user, WkfModel wkfModel);

  WkfModel resolveWkfModelForRecord(Model record);

  void invalidateCache(WkfModel wkfModel);
}
