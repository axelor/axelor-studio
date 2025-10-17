/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service;

import com.axelor.meta.CallMethod;
import com.axelor.meta.db.MetaJsonField;
import com.google.inject.persist.Transactional;

public interface JsonFieldService {

  String SELECTION_PREFIX = "custom-json-select-";

  @Transactional(rollbackOn = Exception.class)
  void updateSelection(MetaJsonField metaJsonField);

  @Transactional(rollbackOn = Exception.class)
  void removeSelection(MetaJsonField metaJsonField);

  @CallMethod
  String checkName(String name, boolean isFieldName);

  String getSelectionName(MetaJsonField metaJsonField);
}
