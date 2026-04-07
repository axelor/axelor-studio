/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.web;

import com.axelor.inject.Beans;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.studio.bpm.service.cockpit.CockpitAnalyticsService;
import com.axelor.utils.helpers.ExceptionHelper;
import java.util.List;
import java.util.Map;

/**
 * Thin REST controller for cockpit analytics views — delegates to {@link
 * CockpitAnalyticsService}.
 */
public class CockpitAnalyticsController {

  private static String requireString(ActionRequest request, String key) {
    Object raw = request.getContext().get(key);
    if (raw == null) {
      throw new IllegalArgumentException("Missing required parameter: " + key);
    }
    return raw.toString();
  }

  private static String optionalString(ActionRequest request, String key) {
    Object raw = request.getContext().getOrDefault(key, null);
    return raw != null ? raw.toString() : null;
  }

  public void getNodeDurationStats(ActionRequest request, ActionResponse response) {
    try {
      String processDefinitionKey = requireString(request, "processDefinitionKey");
      String period = optionalString(request, "period");
      if (period == null) period = "30d";
      CockpitAnalyticsService service = Beans.get(CockpitAnalyticsService.class);
      var nodes = service.getNodeDurationStats(processDefinitionKey, period);
      response.setData(List.of(Map.of("nodes", nodes)));
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void getStatusTrend(ActionRequest request, ActionResponse response) {
    try {
      String processDefinitionKey = requireString(request, "processDefinitionKey");
      String period = optionalString(request, "period");
      if (period == null) period = "30d";
      CockpitAnalyticsService service = Beans.get(CockpitAnalyticsService.class);
      var points = service.getStatusTrend(processDefinitionKey, period);
      String granularity = service.computeGranularity(period);
      response.setData(List.of(Map.of("points", points, "granularity", granularity)));
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void getAssigneeThroughput(ActionRequest request, ActionResponse response) {
    try {
      String processDefinitionKey = requireString(request, "processDefinitionKey");
      String period = optionalString(request, "period");
      if (period == null) period = "30d";
      CockpitAnalyticsService service = Beans.get(CockpitAnalyticsService.class);
      var entries = service.getAssigneeThroughput(processDefinitionKey, period);
      response.setData(List.of(Map.of("entries", entries)));
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void getSankeyData(ActionRequest request, ActionResponse response) {
    try {
      String processDefinitionKey = requireString(request, "processDefinitionKey");
      String period = optionalString(request, "period");
      if (period == null) period = "30d";
      CockpitAnalyticsService service = Beans.get(CockpitAnalyticsService.class);
      var sankeyData = service.getSankeyData(processDefinitionKey, period);
      response.setData(List.of(sankeyData));
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void getCalendarHeatmap(ActionRequest request, ActionResponse response) {
    try {
      String period = optionalString(request, "period");
      if (period == null) period = "90d";
      CockpitAnalyticsService service = Beans.get(CockpitAnalyticsService.class);
      var entries = service.getCalendarHeatmap(period);
      response.setData(List.of(Map.of("entries", entries)));
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }
}
