/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.app.service;

import com.axelor.db.Model;

public interface ScriptAppService {
  Model getApp(String type);

  boolean isApp(String type);
}
