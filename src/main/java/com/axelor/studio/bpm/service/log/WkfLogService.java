/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.log;

import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.OutputStreamAppender;

public interface WkfLogService {

  OutputStreamAppender<ILoggingEvent> createOrAttachAppender(String processInstanceId);

  void writeLog(String processInstanceId);

  void clearLog(String instanceId);
}
