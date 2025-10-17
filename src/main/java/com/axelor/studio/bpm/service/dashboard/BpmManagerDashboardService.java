/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.dashboard;

import com.axelor.studio.db.WkfModel;
import java.util.List;
import java.util.Map;

public interface BpmManagerDashboardService {

  Map<String, Object> showProcess(int offset);

  List<Map<String, Object>> getChartData(WkfModel wkfModel, String type, String taskByProcessType);
}
