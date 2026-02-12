/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.dashboard;

import com.axelor.auth.AuthUtils;
import com.axelor.auth.db.User;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.WkfProcess;
import com.axelor.studio.db.WkfProcessConfig;
import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.apache.commons.lang3.StringUtils;

public class BpmManagerDashboardServiceImpl implements BpmManagerDashboardService {

  public static final int FETCH_LIMIT = 20;

  protected WkfDashboardCommonService wkfDashboardCommonService;

  protected BpmManagerDashboardUserService bpmMgrDashboardUserService;

  protected BpmManagerDashboardTaskService bpmMgrDashboardTaskService;

  @Inject
  public BpmManagerDashboardServiceImpl(
      WkfDashboardCommonService wkfDashboardCommonService,
      BpmManagerDashboardUserService bpmMgrDashboardUserService,
      BpmManagerDashboardTaskService bpmMgrDashboardTaskService) {
    this.wkfDashboardCommonService = wkfDashboardCommonService;
    this.bpmMgrDashboardUserService = bpmMgrDashboardUserService;
    this.bpmMgrDashboardTaskService = bpmMgrDashboardTaskService;
  }

  @SuppressWarnings({"unchecked", "serial"})
  @Override
  public Map<String, Object> showProcess(int offset) {
    User user = AuthUtils.getUser();
    Map<String, Object> dataMap = new HashMap<>();
    List<Map<String, Object>> modelList = new ArrayList<>();

    List<WkfModel> wkfModelList = bpmMgrDashboardUserService.getWkfModelsByUser(user);
    long totalRecord = wkfModelList.size();

    List<WkfModel> showWkfModels = wkfModelList.stream().skip(offset).limit(FETCH_LIMIT).toList();

    showWkfModels.forEach(
        wkfModel -> {
          boolean isSuperAdmin = user.getCode().equals("admin");
          boolean isAdmin = wkfDashboardCommonService.isAdmin(wkfModel, user);
          boolean isUser = wkfDashboardCommonService.isUser(wkfModel, user);

          List<WkfProcess> processes = wkfDashboardCommonService.findProcesses(wkfModel, null);
          List<Map<String, Object>> processList = new ArrayList<>();

          processes.forEach(
              process ->
                  prepareProcessList(processList, process, user, isSuperAdmin, isAdmin, isUser));
        });

    dataMap.put("_xModelList", modelList);
    dataMap.put("_xOffset", offset);
    dataMap.put("_xLimit", FETCH_LIMIT);
    dataMap.put("_xTotalRecord", totalRecord);
    return dataMap;
  }

  private static class ItemsHashMap extends HashMap<String, Object> {

    public ItemsHashMap(WkfProcess process, List<Map<String, Object>> configList) {
      put(
          "title",
          !StringUtils.isBlank(process.getDescription())
              ? process.getDescription()
              : process.getName());
      put("itemList", configList);
    }
  }

  protected void prepareProcessList(
      List<Map<String, Object>> processList,
      WkfProcess process,
      User user,
      boolean isSuperAdmin,
      boolean isAdmin,
      boolean isUser) {
    List<Map<String, Object>> configList = new ArrayList<>();

    List<WkfProcessConfig> processConfigs = process.getWkfProcessConfigList();
    wkfDashboardCommonService.sortProcessConfig(processConfigs);

    List<String> modelList = new ArrayList<>();
    processConfigs.forEach(
        processConfig ->
            prepareConfigList(
                configList,
                modelList,
                process,
                processConfig,
                user,
                isSuperAdmin,
                isAdmin,
                isUser));
    processList.add(new ItemsHashMap(process, configList));
  }

  private static class ConfigsHashMap extends HashMap<String, Object> {

    public ConfigsHashMap(
        WkfProcessConfig processConfig,
        String modelName,
        List<Long> recordIdsModel,
        boolean isMetaModel,
        List<Map<String, Object>> statusUserList,
        List<Map<String, Object>> statusList) {
      put("type", "model");
      put(
          "title",
          !StringUtils.isBlank(processConfig.getTitle()) ? processConfig.getTitle() : modelName);
      put("modelName", modelName);
      put("modelRecordCount", recordIdsModel.size());
      put("isMetaModel", isMetaModel);
      put("recordIdsPerModel", recordIdsModel);
      put("userStatuses", statusUserList);
      put("statuses", statusList);
    }
  }

  protected void prepareConfigList(
      List<Map<String, Object>> configList,
      List<String> modelList,
      WkfProcess process,
      WkfProcessConfig processConfig,
      User user,
      boolean isSuperAdmin,
      boolean isAdmin,
      boolean isUser) {

    boolean isMetaModel = processConfig.getMetaModel() != null;
    String modelName =
        isMetaModel
            ? processConfig.getMetaModel().getName()
            : processConfig.getMetaJsonModel().getName();

    if (modelList.contains(modelName)) {
      return;
    }
    modelList.add(modelName);

    Map<String, Object> map =
        this.computeAssignedTaskConfigs(process, modelName, isMetaModel, user);
    List<Long> recordIdsUserPerModel = (List<Long>) map.get("recordIdsUserPerModel");
    List<Map<String, Object>> statusUserList =
        (List<Map<String, Object>>) map.get("statusUserList");

    List<Long> recordIdsPerModel = (List<Long>) map.get("recordIdsPerModel");
    List<Map<String, Object>> statusList = (List<Map<String, Object>>) map.get("statusList");

    List<Long> recordIdsModel = new ArrayList<>();

    if (isSuperAdmin || isAdmin) {
      recordIdsModel.addAll(recordIdsPerModel);
      recordIdsModel.addAll(recordIdsUserPerModel);
    } else if (isUser) {
      recordIdsModel.addAll(recordIdsUserPerModel);
    }

    configList.add(
        new ConfigsHashMap(
            processConfig, modelName, recordIdsModel, isMetaModel, statusUserList, statusList));
  }

  private static class TasksHashMap extends HashMap<String, Object> {

    public TasksHashMap(Object[] userObj, Object[] obj) {
      put("recordIdsUserPerModel", userObj[0]);
      put("statusUserList", userObj[1]);
      put("recordIdsPerModel", obj[0]);
      put("statusList", obj[1]);
    }
  }

  @SuppressWarnings({"serial"})
  protected Map<String, Object> computeAssignedTaskConfigs(
      WkfProcess process, String modelName, boolean isMetaModel, User user) {

    Object[] obj =
        bpmMgrDashboardUserService.computeAssignedTaskConfig(
            process, modelName, isMetaModel, user, true, WkfDashboardCommonService.ASSIGNED_ME);

    Object[] userObj =
        bpmMgrDashboardUserService.computeAssignedTaskConfig(
            process, modelName, isMetaModel, user, false, WkfDashboardCommonService.ASSIGNED_OTHER);

    return new TasksHashMap(userObj, obj);
  }

  @Override
  public List<Map<String, Object>> getChartData(
      WkfModel wkfModel, String type, String taskByProcessType) {

    List<Map<String, Object>> dataMapList = new ArrayList<>();
    User user = AuthUtils.getUser();

    List<WkfProcess> processes = wkfDashboardCommonService.findProcesses(wkfModel, null);

    for (WkfProcess process : processes) {
      List<WkfProcessConfig> processConfigs = process.getWkfProcessConfigList();
      wkfDashboardCommonService.sortProcessConfig(processConfigs);

      List<String> modelList = new ArrayList<>();
      for (WkfProcessConfig processConfig : processConfigs) {

        boolean isMetaModel = processConfig.getMetaModel() != null;
        String modelName =
            isMetaModel
                ? processConfig.getMetaModel().getName()
                : processConfig.getMetaJsonModel().getName();

        if (modelList.contains(modelName)) {
          continue;
        }
        modelList.add(modelName);

        Map<String, Object> map =
            wkfDashboardCommonService.computeStatus(isMetaModel, modelName, process, null, null);

        switch (type) {
          case WkfDashboardCommonService.ASSIGNED_ME:
            bpmMgrDashboardUserService.getAssignedToMeTask(
                process, modelName, isMetaModel, dataMapList, user);
            break;

          case WkfDashboardCommonService.ASSIGNED_OTHER:
            bpmMgrDashboardUserService.getAssignedToOtherTask(
                process, modelName, isMetaModel, dataMapList, user);
            break;

          case WkfDashboardCommonService.TASK_BY_PROCESS:
            bpmMgrDashboardTaskService.getTaskByProcess(
                map, process, taskByProcessType, dataMapList);
            break;
          default:
            break;
        }
      }
    }
    return dataMapList;
  }
}
