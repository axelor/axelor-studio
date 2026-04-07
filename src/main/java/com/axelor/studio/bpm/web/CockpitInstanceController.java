/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.web;

import com.axelor.inject.Beans;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.studio.bpm.service.cockpit.CockpitInstanceService;
import com.axelor.utils.helpers.ExceptionHelper;
import java.util.List;
import java.util.Map;

/**
 * Thin REST controller for instance-level cockpit views — delegates to {@link
 * CockpitInstanceService}.
 */
public class CockpitInstanceController {

  private static Long requireLong(ActionRequest request, String key) {
    Object raw = request.getContext().get(key);
    if (raw == null) {
      throw new IllegalArgumentException("Missing required parameter: " + key);
    }
    if (raw instanceof Number n) {
      return n.longValue();
    }
    return Long.valueOf(raw.toString());
  }

  private static String requireString(ActionRequest request, String key) {
    Object raw = request.getContext().get(key);
    if (raw == null) {
      throw new IllegalArgumentException("Missing required parameter: " + key);
    }
    return raw.toString();
  }

  private static int optionalInt(ActionRequest request, String key, int defaultValue) {
    Object raw = request.getContext().getOrDefault(key, defaultValue);
    if (raw instanceof Number n) {
      return n.intValue();
    }
    try {
      return Integer.parseInt(raw.toString());
    } catch (NumberFormatException e) {
      return defaultValue;
    }
  }

  private static String optionalString(ActionRequest request, String key) {
    Object raw = request.getContext().getOrDefault(key, null);
    return raw != null ? raw.toString() : null;
  }

  public void getInstances(ActionRequest request, ActionResponse response) {
    try {
      Long processId = requireLong(request, "processId");
      String status = optionalString(request, "status");
      int offset = optionalInt(request, "offset", 0);
      int limit = optionalInt(request, "limit", 20);
      String search = optionalString(request, "search");

      var service = Beans.get(CockpitInstanceService.class);
      var instances = service.getInstances(processId, status, offset, limit, search);
      long total = service.getInstanceCount(processId, status, search);

      response.setData(
          List.of(
              Map.of("instances", instances, "total", total, "offset", offset, "limit", limit)));
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void getInstanceCounts(ActionRequest request, ActionResponse response) {
    try {
      Long processId = requireLong(request, "processId");
      var result = Beans.get(CockpitInstanceService.class).getInstanceCounts(processId);
      response.setData(List.of(result));
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void getInstanceActivities(ActionRequest request, ActionResponse response) {
    try {
      String processInstanceId = requireString(request, "processInstanceId");
      var activities =
          Beans.get(CockpitInstanceService.class).getInstanceActivities(processInstanceId);
      response.setData(
          List.of(Map.of("activities", activities, "processInstanceId", processInstanceId)));
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void getNodeDetail(ActionRequest request, ActionResponse response) {
    try {
      String processInstanceId = requireString(request, "processInstanceId");
      String activityId = requireString(request, "activityId");
      String processDefinitionKey = optionalString(request, "processDefinitionKey");
      var nodeDetail =
          Beans.get(CockpitInstanceService.class)
              .getNodeDetail(processInstanceId, activityId, processDefinitionKey);
      response.setData(List.of(Map.of("nodeDetail", nodeDetail)));
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void getBranchDistribution(ActionRequest request, ActionResponse response) {
    try {
      String processDefinitionKey = requireString(request, "processDefinitionKey");
      String gatewayId = requireString(request, "gatewayId");
      var distributions =
          Beans.get(CockpitInstanceService.class)
              .getBranchDistribution(processDefinitionKey, gatewayId);
      response.setData(List.of(Map.of("distributions", distributions, "gatewayId", gatewayId)));
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void getInstanceXml(ActionRequest request, ActionResponse response) {
    try {
      Long processId = requireLong(request, "processId");
      String xml = Beans.get(CockpitInstanceService.class).getInstanceXml(processId);
      response.setData(List.of(Map.of("xml", xml != null ? xml : "")));
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }
}
