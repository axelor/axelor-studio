/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.dmn.service;

import com.axelor.studio.db.WkfDmnModel;
import com.google.inject.persist.Transactional;

public interface DmnDeploymentService {

  @Transactional
  void deploy(WkfDmnModel wkfDmnModel);
}
