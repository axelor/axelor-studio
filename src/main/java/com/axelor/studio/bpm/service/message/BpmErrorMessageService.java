/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.message;

import com.axelor.studio.db.WkfModel;
import org.camunda.bpm.engine.impl.pvm.runtime.PvmExecutionImpl;

public interface BpmErrorMessageService {
  void sendBpmErrorMessage(
      PvmExecutionImpl execution, String errorMessage, WkfModel model, String processInstanceId);
}
