/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.init;

import org.camunda.bpm.engine.ProcessEngine;

public interface ProcessEngineService {

  void addEngine(String tenantId);

  ProcessEngine getEngine();

  void removeEngine(String tenantId);

  String getWkfViewerUrl();
}
