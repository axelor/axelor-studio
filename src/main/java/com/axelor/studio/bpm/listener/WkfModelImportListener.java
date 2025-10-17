/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.listener;

import com.axelor.event.Observes;
import com.axelor.events.StartupEvent;
import com.axelor.inject.Beans;
import com.axelor.studio.bpm.service.WkfBpmImportService;
import com.axelor.utils.helpers.ExceptionHelper;
import jakarta.annotation.Priority;

public class WkfModelImportListener {

  public void onStartUp(@Observes @Priority(value = -1) StartupEvent event) {
    try {
      Beans.get(WkfBpmImportService.class).importDmn();
    } catch (Exception e) {
      ExceptionHelper.error(e);
    }
  }
}
