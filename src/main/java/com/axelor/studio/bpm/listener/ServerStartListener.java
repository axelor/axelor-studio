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
package com.axelor.studio.bpm.listener;

import com.axelor.event.Observes;
import com.axelor.events.ShutdownEvent;
import com.axelor.events.StartupEvent;
import com.axelor.inject.Beans;
import com.axelor.studio.app.service.AppService;
import com.axelor.studio.bpm.service.init.ProcessEngineService;
import java.lang.invoke.MethodHandles;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ServerStartListener {

  private static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
  private static final String APP_CODE_BPM = "bpm";

  public void onStartUp(@Observes StartupEvent event) {
    if (!Beans.get(AppService.class).isApp(APP_CODE_BPM)) {
      log.info("BPM app is not installed or not active, skipping process engine initialization");
      return;
    }
    log.info("Initializing BPM process engine...");
    Beans.get(ProcessEngineService.class).initialize();
  }

  public void onShutDown(@Observes ShutdownEvent event) {
    ProcessEngineService processEngineService = Beans.get(ProcessEngineService.class);
    if (!processEngineService.isInitialized()) {
      return;
    }
    log.info("Application shutdown detected, stopping BPM process engine...");
    try {
      processEngineService.shutdown();
    } catch (Exception e) {
      log.error("Error shutting down BPM process engine", e);
    }
  }
}
