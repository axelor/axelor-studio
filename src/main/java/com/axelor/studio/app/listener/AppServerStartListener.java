/*
 * Axelor Business Solutions
 *
 * Copyright (C) 2022 Axelor (<http://axelor.com>).
 *
 * This program is free software: you can redistribute it and/or  modify
 * it under the terms of the GNU Affero General Public License, version 3,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package com.axelor.studio.app.listener;

import com.axelor.app.AppSettings;
import com.axelor.common.StringUtils;
import com.axelor.event.Observes;
import com.axelor.events.StartupEvent;
import com.axelor.inject.Beans;
import com.axelor.studio.app.service.AppService;
import com.axelor.studio.db.App;
import com.axelor.studio.db.repo.AppRepository;
import com.axelor.utils.ExceptionTool;
import com.google.inject.Inject;
import com.google.inject.servlet.RequestScoper;
import com.google.inject.servlet.ServletScopes;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import javax.annotation.Priority;

public class AppServerStartListener {

  protected AppService appService;
  protected AppRepository appRepository;
  protected static String DEFAULT_LOCALE = "en";

  @Inject
  public AppServerStartListener(AppService appService, AppRepository appRepository) {
    this.appService = appService;
    this.appRepository = appRepository;
  }

  public void onStartUp(@Observes @Priority(value = -1) StartupEvent event) {
    try {
      Beans.get(AppService.class).initApps();
    } catch (Exception e) {
      ExceptionTool.trace(e);
    }
  }

  public void installAppsOnStartup(@Observes StartupEvent event) {

    final RequestScoper scope = ServletScopes.scopeRequest(Collections.emptyMap());

    try (RequestScoper.CloseableScope ignored = scope.open()) {

      AppSettings appSettings = AppSettings.get();

      String apps = appSettings.get("aos.apps.install-apps");
      if (StringUtils.isBlank(apps)) {
        return;
      }

      List<App> appList = new ArrayList<>();

      if (apps.equalsIgnoreCase("all")) {
        appList = appRepository.all().filter("self.active IS NULL OR self.active = false").fetch();
      } else {
        String[] appCodes = apps.split(",");
        for (String code : appCodes) {
          App app = appRepository.findByCode(code.trim());
          if (app != null) {
            appList.add(app);
          }
        }
      }

      if (appList.size() == 0) {
        return;
      }

      appService.bulkInstall(
          appList,
          appSettings.getBoolean("data.import.demo-data", false),
          appSettings.get("application.locale", DEFAULT_LOCALE));

    } catch (Exception e) {
      ExceptionTool.trace(e);
    }
  }
}
