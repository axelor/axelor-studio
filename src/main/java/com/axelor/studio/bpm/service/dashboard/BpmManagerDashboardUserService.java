/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.dashboard;

import com.axelor.auth.db.User;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.WkfProcess;
import java.util.List;
import java.util.Map;

public interface BpmManagerDashboardUserService {

  List<WkfModel> getWkfModelsByUser(User user);

  void getAssignedToMeTask(
      WkfProcess process,
      String modelName,
      boolean isMetaModel,
      List<Map<String, Object>> dataMapList,
      User user);

  void getAssignedToOtherTask(
      WkfProcess process,
      String modelName,
      boolean isMetaModel,
      List<Map<String, Object>> dataMapList,
      User user);

  Object[] computeAssignedTaskConfig(
      WkfProcess process,
      String modelName,
      boolean isMetaModel,
      User user,
      boolean withTask,
      String assignedType);

  Map<String, Object> getStatusRecords(WkfModel wkfModel, String status, String type);

  List<Map<String, Object>> getAvgTimePerUserData(WkfModel wkfModel, String unitType);

  List<Map<String, Object>> getTaskToDoPerUser(WkfModel wkfModel);

  List<Map<String, Object>> getTaskDoneTodayPerUser(WkfModel wkfModel);
}
