/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.listener;

import com.axelor.event.Observes;
import com.axelor.events.StartupEvent;
import com.axelor.inject.Beans;
import com.axelor.studio.bpm.service.init.ProcessEngineServiceImpl;

public class ServerStartListener {

  public void onStartUp(@Observes StartupEvent event) {
    Beans.get(ProcessEngineServiceImpl.class);
  }
}
