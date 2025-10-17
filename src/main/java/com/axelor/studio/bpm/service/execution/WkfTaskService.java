/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.execution;

import com.axelor.db.Model;
import com.axelor.studio.db.WkfInstance;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.runtime.ProcessInstance;

public interface WkfTaskService {

  /** Resets the service state. */
  void reset();

  String runTasks(
      ProcessEngine engine,
      WkfInstance instance,
      ProcessInstance processInstance,
      String signal,
      Model model)
      throws ClassNotFoundException;
}
