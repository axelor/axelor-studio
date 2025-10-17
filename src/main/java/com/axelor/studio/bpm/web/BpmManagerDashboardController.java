/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.web;

import com.axelor.inject.Beans;
import com.axelor.meta.schema.actions.ActionView.ActionViewBuilder;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.rpc.Context;
import com.axelor.studio.bpm.service.dashboard.BpmManagerDashboardService;
import com.axelor.studio.bpm.service.dashboard.BpmManagerDashboardServiceImpl;
import com.axelor.studio.bpm.service.dashboard.BpmManagerDashboardTaskService;
import com.axelor.studio.bpm.service.dashboard.BpmManagerDashboardUserService;
import com.axelor.studio.bpm.service.dashboard.WkfDashboardCommonService;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.repo.WkfModelRepository;
import com.axelor.utils.helpers.ExceptionHelper;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.apache.commons.lang3.StringUtils;

public class BpmManagerDashboardController {

  public void showBpmManagerProcess(ActionRequest request, ActionResponse response) {
    try {
      this.showProcess(0, response);
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  protected void showProcess(int offset, ActionResponse response) {
    try {
      response.setValues(Beans.get(BpmManagerDashboardService.class).showProcess(offset));
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void showPreviousProcess(ActionRequest request, ActionResponse response) {
    try {
      this.showProcess(this.getOffset(request, false), response);
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void showNextProcess(ActionRequest request, ActionResponse response) {
    try {
      this.showProcess(this.getOffset(request, true), response);
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  protected int getOffset(ActionRequest request, boolean isNext) {
    int offset = (int) request.getContext().get("_xOffset");
    return isNext
        ? offset + BpmManagerDashboardServiceImpl.FETCH_LIMIT
        : offset - BpmManagerDashboardServiceImpl.FETCH_LIMIT;
  }

  public void getAssignedToMeTask(ActionRequest request, ActionResponse response) {
    this.getChartData(request, response, WkfDashboardCommonService.ASSIGNED_ME);
  }

  public void getAssignedToOtherTask(ActionRequest request, ActionResponse response) {
    this.getChartData(request, response, WkfDashboardCommonService.ASSIGNED_OTHER);
  }

  public void getTaskByProcess(ActionRequest request, ActionResponse response) {
    this.getChartData(request, response, WkfDashboardCommonService.TASK_BY_PROCESS);
  }

  protected void getChartData(ActionRequest request, ActionResponse response, String type) {
    try {
      Context context = request.getContext();
      WkfModel wkfModel = this.getWkfModel(context);

      String taskByProcessType = "";
      if (context.get("typeSelect") != null) {
        taskByProcessType = context.get("typeSelect").toString();
      }

      List<Map<String, Object>> dataMapList =
          Beans.get(BpmManagerDashboardService.class)
              .getChartData(wkfModel, type, taskByProcessType);

      response.setData(dataMapList);
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  @SuppressWarnings("rawtypes")
  protected WkfModel getWkfModel(Map<String, Object> context) {
    Long wkfModelId = Long.valueOf(((Map) context.get("wkfModel")).get("id").toString());
    return Beans.get(WkfModelRepository.class).find(wkfModelId);
  }

  public void getAvgTimePerUser(ActionRequest request, ActionResponse response) {
    try {
      Context context = request.getContext();
      WkfModel wkfModel = this.getWkfModel(context);

      String unit = (String) context.get("unit");

      List<Map<String, Object>> dataMapList =
          Beans.get(BpmManagerDashboardUserService.class).getAvgTimePerUserData(wkfModel, unit);

      response.setData(dataMapList);
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void getTaskDoneTodayPerUser(ActionRequest request, ActionResponse response) {
    try {
      Context context = request.getContext();
      WkfModel wkfModel = this.getWkfModel(context);

      List<Map<String, Object>> dataMapList =
          Beans.get(BpmManagerDashboardUserService.class).getTaskDoneTodayPerUser(wkfModel);

      response.setData(dataMapList);
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void getTaskToDoPerUser(ActionRequest request, ActionResponse response) {
    try {
      Context context = request.getContext();
      WkfModel wkfModel = this.getWkfModel(context);

      List<Map<String, Object>> dataMapList =
          Beans.get(BpmManagerDashboardUserService.class).getTaskToDoPerUser(wkfModel);

      response.setData(dataMapList);
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void getTaskCompletionByDays(ActionRequest request, ActionResponse response) {
    try {
      LocalDate fromDate = LocalDate.parse(request.getContext().get("fromDate").toString());
      LocalDate toDate = LocalDate.parse(request.getContext().get("toDate").toString());

      List<Map<String, Object>> dataMapList =
          Beans.get(BpmManagerDashboardTaskService.class).getTaskCompletionByDays(fromDate, toDate);

      response.setData(dataMapList);
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void showAssignedToMeTask(ActionRequest request, ActionResponse response) {
    this.showAssignedRecords(request, response, WkfDashboardCommonService.ASSIGNED_ME);
  }

  public void showAssignedToOtherTask(ActionRequest request, ActionResponse response) {
    this.showAssignedRecords(request, response, WkfDashboardCommonService.ASSIGNED_OTHER);
  }

  @SuppressWarnings({"unchecked"})
  protected void showAssignedRecords(ActionRequest request, ActionResponse response, String type) {
    try {
      Map<String, Object> context = request.getRawContext();
      WkfModel wkfModel = this.getWkfModel(context);

      String status = "";
      if (context.get("status") != null) {
        status = context.get("status").toString();
      }
      status = StringUtils.substringBefore(status, "(").trim();

      Map<String, Object> dataMap =
          Beans.get(BpmManagerDashboardUserService.class).getStatusRecords(wkfModel, status, type);

      if (dataMap.isEmpty()) {
        return;
      }

      String modelName = dataMap.get("modelName").toString();
      boolean isMetaModel = (boolean) dataMap.get("isMetaModel");
      List<Long> recordIds = (List<Long>) dataMap.get("recordIds");

      ActionViewBuilder actionViewBuilder =
          Beans.get(WkfDashboardCommonService.class)
              .computeActionView(status, modelName, isMetaModel);

      response.setView(
          actionViewBuilder.context("ids", !recordIds.isEmpty() ? recordIds : 0).map());
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  @SuppressWarnings({"unchecked"})
  public void showTaskByProcess(ActionRequest request, ActionResponse response) {
    try {
      Map<String, Object> context = request.getRawContext();
      WkfModel wkfModel = this.getWkfModel(context);

      String process = "";
      if (context.get("process") != null) {
        process = context.get("process").toString();
      }
      String model = "";
      if (context.get("model") != null) {
        model = context.get("model").toString();
      }
      String typeSelect = context.get("typeSelect").toString();

      Map<String, Object> dataMap =
          Beans.get(BpmManagerDashboardTaskService.class)
              .getTaskByProcessRecords(wkfModel, process, model, typeSelect);

      if (dataMap.isEmpty()) {
        return;
      }

      String modelName = dataMap.get("modelName").toString();
      boolean isMetaModel = (boolean) dataMap.get("isMetaModel");
      List<Long> recordIds = (List<Long>) dataMap.get("recordIds");

      ActionViewBuilder actionViewBuilder =
          Beans.get(WkfDashboardCommonService.class)
              .computeActionView(null, modelName, isMetaModel);

      response.setView(
          actionViewBuilder.context("ids", !recordIds.isEmpty() ? recordIds : 0).map());
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }
}
