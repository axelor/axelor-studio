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

import com.axelor.event.Observes;
import com.axelor.events.StartupEvent;
import com.axelor.inject.Beans;
import com.axelor.studio.app.service.AppService;
import com.axelor.utils.ExceptionTool;
import javax.annotation.Priority;

public class AppServerStartListener {

  public void onStartUp(@Observes @Priority(value = -1) StartupEvent event) {
    try {
      Beans.get(AppService.class).initApps();
    } catch (Exception e) {
      ExceptionTool.trace(e);
    }
  }
}
