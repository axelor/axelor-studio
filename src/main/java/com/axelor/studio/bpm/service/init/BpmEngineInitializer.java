/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.init;

import com.axelor.inject.Beans;
import com.axelor.studio.app.service.AppService;
import com.google.inject.Inject;
import com.google.inject.Singleton;
import java.lang.invoke.MethodHandles;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Thread-safe BPM engine initialization service. */
@Singleton
public class BpmEngineInitializer {

  private static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
  private static final String APP_CODE_BPM = "bpm";

  private final ProcessEngineService processEngineService;

  @Inject
  public BpmEngineInitializer(ProcessEngineService processEngineService) {
    this.processEngineService = processEngineService;
  }

  public void initializeIfNeeded(String tenantId) {
    try {
      if (!isAppActive()) {
        log.debug("BPM app is not active, skipping initialization");
        return;
      }

      processEngineService.initialize(tenantId);

    } catch (Exception e) {
      log.error("Error initializing BPM for tenant: {}", tenantId, e);
    }
  }

  public void shutdownIfNeeded(String tenantId) {
    try {
      if (isAppActive()) {
        return;
      }

      processEngineService.removeEngine(tenantId);

    } catch (Exception e) {
      log.error("Error shutting down BPM for tenant: {}", tenantId, e);
    }
  }

  protected boolean isAppActive() {
    try {
      return Beans.get(AppService.class).isApp(APP_CODE_BPM);
    } catch (Exception e) {
      return false;
    }
  }
}
