/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.utils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class BpmLoggingHelper {

  private BpmLoggingHelper() {}

  private static final Logger LOGGER = LoggerFactory.getLogger("org.camunda.bpm.engine.script");

  public static Logger get() {
    return LOGGER;
  }
}
