/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.dashboard;

import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.WkfProcess;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface BpmManagerDashboardTaskService {

  void getTaskByProcess(
      Map<String, Object> _map,
      WkfProcess process,
      String taskByProcessType,
      List<Map<String, Object>> dataMapList);

  Map<String, Object> getTaskByProcessRecords(
      WkfModel wkfModel, String processName, String model, String typeSelect);

  List<Map<String, Object>> getTaskCompletionByDays(LocalDate fromDate, LocalDate toDate);
}
