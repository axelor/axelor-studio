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
package com.axelor.studio.bpm.service.execution;

import com.axelor.db.Model;
import com.axelor.meta.CallMethod;
import com.axelor.studio.db.WkfInstance;
import com.axelor.studio.db.WkfInstanceVariable;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.WkfProcess;
import com.axelor.studio.db.WkfTaskConfig;
import java.util.List;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.delegate.DelegateExecution;

public interface WkfInstanceService {

  String evalInstance(Model model, String signal, Integer source) throws ClassNotFoundException;

  String evalInstance(Model model, String signal) throws ClassNotFoundException;

  void evalInstancesFromWkfModel(WkfModel wkfModel);

  void evalInstance(WkfInstance wkfInstance) throws ClassNotFoundException;

  WkfInstance createWkfInstance(String processInstanceId, WkfProcess wkfProcess);

  boolean isActiveProcessInstance(String processInstanceId, RuntimeService runTimeService);

  void deleteProcessInstance(String processInstanceId);

  @CallMethod
  boolean isActiveTask(String processInstanceId, String taskId);

  @CallMethod
  boolean isActiveModelTask(Model model, String taskId);

  @CallMethod
  List<String> findProcessInstanceByNode(
      String nodeKey, String processId, String type, boolean permanent);

  void onNodeActivation(WkfTaskConfig wkfTaskConfig, DelegateExecution execution);

  void onNodeDeactivation(WkfTaskConfig wkfTaskConfig, DelegateExecution execution);

  void terminateAll();

  String getInstanceXml(String instanceId);

  boolean isActivatedTask(String processInstanceId, String taskId);

  boolean isActivatedModelTask(Model model, String taskId);

  void restart(String processInstanceId, String processName, String activityId);

  void cancelNode(String processInstanceId, String activityId);

  void updateProcessInstance(WkfProcess process, String processInstanceId, int migrationStatus);

  List<WkfInstanceVariable> getWkfInstanceVariables(WkfInstance instance);

  String getInstanceLogs(
      WkfInstance instance, String filter, String startString, String endString, Integer minutes);

  void setInstanceStateStopped(String processInstanceId);
}
