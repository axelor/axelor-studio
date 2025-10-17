/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service;

import com.axelor.meta.CallMethod;
import com.axelor.studio.db.WkfInstance;
import com.axelor.studio.db.WkfModel;
import java.util.List;
import java.util.Map;

public interface WkfDisplayService {

  @CallMethod
  String getInstanceUrl(WkfInstance wkfInstance);

  @CallMethod
  String getWkfNodeCountUrl(WkfModel wkfModel);

  List<Map<String, Object>> getWkfStatus(Class<?> klass, Long id);
}
