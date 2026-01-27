/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.app.listener;

import com.axelor.common.StringUtils;
import com.axelor.event.Observes;
import com.axelor.events.StartupEvent;
import com.axelor.studio.app.service.AppService;
import com.axelor.studio.db.App;
import com.axelor.studio.db.repo.AppRepository;
import com.axelor.studio.ls.LinkScriptBindingsService;
import com.axelor.studio.service.AppSettingsStudioService;
import com.axelor.utils.helpers.ExceptionHelper;
import com.google.inject.servlet.RequestScoper;
import com.google.inject.servlet.ServletScopes;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

public class AppServerStartListener {

  protected final AppService appService;
  protected final AppRepository appRepository;
  protected final AppSettingsStudioService appSettingsService;
  protected final LinkScriptBindingsService linkScriptBindingsService;

  @Inject
  public AppServerStartListener(
      AppService appService,
      AppRepository appRepository,
      AppSettingsStudioService appSettingsService,
      LinkScriptBindingsService linkScriptBindingsService) {
    this.appService = appService;
    this.appRepository = appRepository;
    this.appSettingsService = appSettingsService;
    this.linkScriptBindingsService = linkScriptBindingsService;
  }

  public void onStartUp(@Observes @Priority(value = -1) StartupEvent event) {
    try {
      appService.initApps();
      linkScriptBindingsService.loadBindings();
    } catch (Exception e) {
      ExceptionHelper.error(e);
    }
  }

  public void installAppsOnStartup(@Observes StartupEvent event) {

    final RequestScoper scope = ServletScopes.scopeRequest(Collections.emptyMap());

    try (RequestScoper.CloseableScope ignored = scope.open()) {

      String apps = appSettingsService.appsToInstall();
      if (StringUtils.isBlank(apps)) {
        return;
      }

      List<App> appList;
      if (apps.equalsIgnoreCase("all")) {
        appList = appRepository.all().filter("self.active IS NULL OR self.active = false").fetch();
      } else {
        appList =
            Arrays.stream(apps.split(","))
                .map(code -> appRepository.findByCode(code.trim()))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
      }

      if (appList.isEmpty()) {
        return;
      }

      appService.bulkInstall(
          appList, appSettingsService.importDemoData(), appSettingsService.applicationLocale());

    } catch (Exception e) {
      ExceptionHelper.error(e);
    }
  }
}
