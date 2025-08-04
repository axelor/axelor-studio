/*
 * Axelor Business Solutions
 *
 * Copyright (C) 2022 Axelor (<http://axelor.com>).
 *
 * This program is free software: you can redistribute it and/or  modify
 * it under the terms of the GNU Affero General Public License, version 3,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
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
