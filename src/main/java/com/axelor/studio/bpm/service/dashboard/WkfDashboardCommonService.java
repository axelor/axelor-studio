/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.dashboard;

import com.axelor.auth.db.User;
import com.axelor.db.Model;
import com.axelor.meta.db.MetaJsonModel;
import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.meta.db.MetaModel;
import com.axelor.meta.schema.actions.ActionView.ActionViewBuilder;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.WkfProcess;
import com.axelor.studio.db.WkfProcessConfig;
import com.axelor.studio.db.WkfTaskConfig;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface WkfDashboardCommonService {

  String TASK_TODAY = "taskToday";
  String TASK_NEXT = "taskNext";
  String LATE_TASK = "lateTask";
  String ASSIGNED_ME = "assignedToMe";
  String ASSIGNED_OTHER = "assignedToOther";
  String TASK_BY_PROCESS = "taskByProcess";
  String NON_LATE_TASK = "nonLateTask";
  String NUM_LATE_TASK = "Number of late tasks";
  String NUM_VALIDATE_TASK = "Number of tasks validated";

  List<WkfProcess> findProcesses(WkfModel wkfModel, String processName);

  void sortProcessConfig(List<WkfProcessConfig> processConfigs);

  Map<String, Object> computeStatus(
      boolean isMetaModel, String modelName, WkfProcess process, User user, String assignedType);

  List<WkfTaskConfig> findTaskConfigs(
      WkfProcess process, String modelName, boolean isMetaModel, User user, boolean withTask);

  Object[] computeTaskConfig(
      List<WkfTaskConfig> taskConfigs,
      String modelName,
      boolean isMetaModel,
      User user,
      boolean withTask,
      String assignedType);

  List<MetaJsonRecord> getMetaJsonRecords(
      WkfTaskConfig config,
      List<String> processInstanceIds,
      String modelName,
      User user,
      String type,
      String assignedType,
      LocalDate toDate);

  List<Model> getMetaModelRecords(
      WkfTaskConfig config,
      List<String> processInstanceIds,
      String modelName,
      User user,
      String type,
      String assignedType,
      LocalDate toDate);

  List<Long> getStatusRecordIds(
      WkfTaskConfig config,
      List<String> processInstanceIds,
      String modelName,
      boolean isMetaModel,
      User user,
      String assignedType);

  void getTasks(
      WkfTaskConfig config,
      List<String> processInstanceIds,
      String modelName,
      boolean isMetaModel,
      User user,
      Map<String, Object> taskMap,
      List<Map<String, Object>> taskCntMapList,
      String assignedType);

  boolean isAdmin(WkfModel wkfModel, User user);

  boolean isUser(WkfModel wkfModel, User user);

  ActionViewBuilder computeActionView(String status, String modelName, boolean isMetaModel);

  ActionViewBuilder createActionBuilder(String status, MetaModel metaModel);

  ActionViewBuilder createActionBuilder(String status, MetaJsonModel metaJsonModel);
}
