/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.exception;

@SuppressWarnings("serial")
public class AxelorScriptEngineException extends RuntimeException {

  public AxelorScriptEngineException(Exception e) {
    super(e);
  }
}
