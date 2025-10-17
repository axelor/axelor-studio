/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service;

import com.axelor.app.AppSettings;
import com.axelor.app.AvailableAppSettings;
import com.google.inject.Inject;

public class ScriptAppSettingsStudioServiceImpl implements ScriptAppSettingsStudioService {

  protected final AppSettingsStudioService appSettingsStudioService;
  protected final AppSettings settings = AppSettings.get();

  @Inject
  public ScriptAppSettingsStudioServiceImpl(AppSettingsStudioService appSettingsStudioService) {
    this.appSettingsStudioService = appSettingsStudioService;
  }

  @Override
  public boolean isAddBpmLog() {
    return appSettingsStudioService.isAddBpmLog();
  }

  @Override
  public String getApplicationMode() {
    return settings.get(AvailableAppSettings.APPLICATION_MODE, "dev");
  }
}
