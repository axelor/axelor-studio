/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.app.service;

import com.axelor.db.Model;
import jakarta.inject.Inject;

public class ScriptAppServiceImpl implements ScriptAppService {
  protected final AppService appService;

  @Inject
  public ScriptAppServiceImpl(AppService appService) {
    this.appService = appService;
  }

  @Override
  public Model getApp(String type) {
    return appService.getApp(type);
  }

  @Override
  public boolean isApp(String type) {
    return appService.isApp(type);
  }
}
