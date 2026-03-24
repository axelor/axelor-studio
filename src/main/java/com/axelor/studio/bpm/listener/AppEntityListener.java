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

import com.axelor.inject.Beans;
import com.axelor.studio.bpm.service.init.ProcessEngineService;
import com.axelor.studio.db.App;
import com.axelor.studio.helper.TransactionHelper;
import java.lang.invoke.MethodHandles;
import javax.persistence.PostPersist;
import javax.persistence.PostUpdate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * JPA Entity Listener that handles BPM process engine initialization/shutdown when the BPM app is
 * installed or uninstalled.
 *
 * <p>This listener is triggered after the App entity is persisted or updated, ensuring the
 * transaction has been committed before taking action on the ProcessEngine.
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

    // Run after transaction commit to ensure the App state is persisted
    TransactionHelper.runAfterCommit(() -> handleBpmAppStateChange(active));
  }

  protected void handleBpmAppStateChange(Boolean active) {
    ProcessEngineService processEngineService = Beans.get(ProcessEngineService.class);

    if (Boolean.TRUE.equals(active)) {
      if (!processEngineService.isInitialized()) {
        log.info("BPM app activated, initializing process engine...");
        processEngineService.initialize();
      }
    } else {
      if (processEngineService.isInitialized()) {
        log.info("BPM app deactivated, shutting down process engine...");
        processEngineService.shutdown();
      }
    }
  }
}
