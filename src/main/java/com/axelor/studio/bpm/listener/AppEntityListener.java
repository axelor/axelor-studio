/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.listener;

import com.axelor.inject.Beans;
import com.axelor.studio.bpm.service.init.BpmEngineEventService;
import com.axelor.studio.bpm.service.init.BpmEngineInitializer;
import com.axelor.studio.bpm.utils.BpmTools;
import com.axelor.studio.db.App;
import com.axelor.studio.helper.TransactionHelper;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostUpdate;
import java.lang.invoke.MethodHandles;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * JPA Entity Listener that handles BPM app state changes.
 *
 * <p>When the BPM app is installed/uninstalled, this listener:
 *
 * <ol>
 *   <li>Publishes state change event via Redis pub/sub (picked up by all instances)
 *   <li>Triggers local engine initialization/shutdown immediately
 * </ol>
 */
public class AppEntityListener {

  private static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
  private static final String APP_CODE_BPM = "bpm";

  @PostPersist
  @PostUpdate
  public void onSave(App app) {
    if (!APP_CODE_BPM.equals(app.getCode())) {
      return;
    }

    Boolean active = app.getActive();

    TransactionHelper.runAfterCommit(
        () -> {
          log.info("BPM app state changed: active={}", active);

          try {
            String tenantId = BpmTools.getCurrentTenant();
            Beans.get(BpmEngineEventService.class).publishStateChange(tenantId, active);
          } catch (Exception e) {
            log.warn("Failed to publish BPM state change event", e);
          }

          handleBpmAppStateChange(active);
        });
  }

  protected void handleBpmAppStateChange(Boolean active) {
    String tenantId = BpmTools.getCurrentTenant();

    if (Boolean.TRUE.equals(active)) {
      Beans.get(BpmEngineInitializer.class).initializeIfNeeded(tenantId);
    } else {
      Beans.get(BpmEngineInitializer.class).shutdownIfNeeded(tenantId);
    }
  }
}
