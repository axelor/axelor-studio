/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.ls.builtin;

import com.axelor.studio.ls.annotation.LinkScriptBinding;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LinkScriptLogger {
  private static final Logger LOG = LoggerFactory.getLogger(LinkScriptLogger.class);

  private LinkScriptLogger() {}

  @LinkScriptBinding("__log__")
  public static Logger get() {
    return LOG;
  }
}
