/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.web;

import com.axelor.inject.Beans;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.studio.bpm.service.cockpit.CockpitTaskStatsService;
import com.axelor.utils.helpers.ExceptionHelper;
import java.util.List;

/** Thin REST controller for task statistics — delegates to domain service. */
public class CockpitTaskController {

  public void getTaskStats(ActionRequest request, ActionResponse response) {
    try {
      var result = Beans.get(CockpitTaskStatsService.class).getTaskStats();
      response.setData(List.of(result));
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }
}
