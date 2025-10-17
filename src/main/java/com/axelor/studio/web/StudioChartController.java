/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.web;

import com.axelor.inject.Beans;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.studio.service.ChartRecordViewService;
import com.axelor.utils.helpers.ExceptionHelper;
import com.google.inject.Singleton;
import java.util.Map;

@Singleton
public class StudioChartController {

  public void viewRelatedRecord(ActionRequest request, ActionResponse response) {
    String chartName = (String) request.getContext().get("_chart");
    try {
      Map<String, Object> context = request.getContext();
      Map<String, Object> actionView =
          Beans.get(ChartRecordViewService.class).getActionView(chartName, context);
      response.setView(actionView);
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }
}
