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

  public String evalInstance(Model model, String signal, Integer source)
      throws ClassNotFoundException;

  public String evalInstance(Model model, String signal) throws ClassNotFoundException;

  void evalInstancesFromWkfModel(WkfModel wkfModel);

  void evalInstance(WkfInstance wkfInstance) throws ClassNotFoundException;

  public WkfInstance createWkfInstance(String processInstanceId, WkfProcess wkfProcess);

  public boolean isActiveProcessInstance(String processInstanceId, RuntimeService runTimeService);

  public void deleteProcessInstance(String processInstanceId);

  @CallMethod
  public boolean isActiveTask(String processInstanceId, String taskId);

  @CallMethod
  public boolean isActiveModelTask(Model model, String taskId);

  @CallMethod
  public List<String> findProcessInstanceByNode(
      String nodeKey, String processId, String type, boolean permanent);

  public void onNodeActivation(WkfTaskConfig wkfTaskConfig, DelegateExecution execution);

  public void onNodeDeactivation(WkfTaskConfig wkfTaskConfig, DelegateExecution execution);

  public void terminateAll();

  public String getInstanceXml(String instanceId);

  public boolean isActivatedTask(String processInstanceId, String taskId);

  public boolean isActivatedModelTask(Model model, String taskId);

  public void restart(String processInstanceId, String processName, String activityId);

  public void cancelNode(String processInstanceId, String activityId);

  public void updateProcessInstance(
      WkfProcess process, String processInstanceId, int migrationStatus);

  public List<WkfInstanceVariable> getWkfInstanceVariables(WkfInstance instance);

  public String getInstanceLogs(
      WkfInstance instance, String filter, String startString, String endString, Integer minutes);

  void setInstanceStateStopped(String processInstanceId);
}
