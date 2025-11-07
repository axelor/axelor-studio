/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
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

  void batchUpdateProcessInstances(
      WkfProcess targetProcess, List<String> processInstanceIds, int migrationStatus);
}
