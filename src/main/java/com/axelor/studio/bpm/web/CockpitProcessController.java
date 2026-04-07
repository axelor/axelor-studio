/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.web;

import com.axelor.inject.Beans;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.studio.bpm.service.cockpit.CockpitProcessService;
import com.axelor.utils.helpers.ExceptionHelper;
import java.util.List;
import java.util.Map;

/** Thin REST controller for process list and adoption overview — delegates to domain service. */
public class CockpitProcessController {

  public void getProcessList(ActionRequest request, ActionResponse response) {
    try {
      String period = (String) request.getContext().getOrDefault("period", "30d");
      var result = Beans.get(CockpitProcessService.class).getProcessList(period);
      response.setData(List.of(Map.of("processes", result)));
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void getAdoptionOverview(ActionRequest request, ActionResponse response) {
    try {
      String period = (String) request.getContext().getOrDefault("period", "30d");
      var result = Beans.get(CockpitProcessService.class).getAdoptionOverview(period);
      response.setData(List.of(result));
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }
}
