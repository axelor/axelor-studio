/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.execution;

import com.axelor.studio.db.WkfTaskConfig;
import com.axelor.utils.helpers.context.FullContext;
import jakarta.mail.MessagingException;
import org.camunda.bpm.engine.delegate.DelegateExecution;

public interface WkfEmailService {

  void sendEmail(WkfTaskConfig wkfTaskConfig, DelegateExecution execution)
      throws ClassNotFoundException, MessagingException;

  String createUrl(FullContext wkfContext, String formName);
}
