/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.listener;

import com.axelor.concurrent.ContextAware;
import com.axelor.db.tenants.TenantConfig;
import com.axelor.db.tenants.TenantConfigProvider;
import com.axelor.db.tenants.TenantModule;
import com.axelor.event.Observes;
import com.axelor.events.ShutdownEvent;
import com.axelor.events.StartupEvent;
import com.axelor.inject.Beans;
import com.axelor.studio.bpm.service.init.BpmEngineEventService;
import com.axelor.studio.bpm.service.init.BpmEngineInitializer;
import com.axelor.studio.bpm.service.init.ProcessEngineService;
import com.axelor.studio.bpm.utils.BpmTools;
import java.lang.invoke.MethodHandles;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ServerStartListener {

  private static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  public void onStartUp(@Observes StartupEvent event) {

    Beans.get(BpmEngineEventService.class).start();

    BpmEngineInitializer bpmEngineInitializer = Beans.get(BpmEngineInitializer.class);

    bpmEngineInitializer.initializeIfNeeded(BpmTools.getCurrentTenant());

    if (TenantModule.isEnabled()) {
      TenantConfigProvider tenantConfigProvider = Beans.get(TenantConfigProvider.class);
      for (TenantConfig tenantConfig : tenantConfigProvider.findAll()) {
        String tenantId = tenantConfig.getTenantId();
        ExecutorService executor = Executors.newSingleThreadExecutor();
        try {
          executor
              .submit(
                  ContextAware.of()
                      .withTenantId(tenantId)
                      .withTransaction(false)
                      .build(() -> bpmEngineInitializer.initializeIfNeeded(tenantId)))
              .get(120, TimeUnit.SECONDS);
        } catch (TimeoutException e) {
          log.error("BPM engine initialization timed out for tenant: {}", tenantId);
          executor.shutdownNow();
        } catch (Exception e) {
          log.error("Failed to initialize BPM engine for tenant: {}", tenantId, e);
        } finally {
          executor.shutdown();
        }
      }
    }
  }

  public void onShutDown(@Observes ShutdownEvent event) {
    try {
      Beans.get(BpmEngineEventService.class).stop();
    } catch (Exception e) {
      log.error("Error shutting down BPM state event service", e);
    }

    ProcessEngineService processEngineService = Beans.get(ProcessEngineService.class);
    if (!processEngineService.isAnyTenantInitialized()) {
      return;
    }

    try {
      processEngineService.shutdown();
    } catch (Exception e) {
      log.error("Error shutting down BPM process engine", e);
    }
  }
}
