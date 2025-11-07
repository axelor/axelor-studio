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

import com.axelor.auth.db.User;
import com.axelor.studio.db.WkfTaskConfig;
import com.axelor.team.db.TeamTask;
import com.axelor.utils.helpers.context.FullContext;
import com.google.inject.persist.Transactional;
import java.util.List;
import org.apache.commons.lang3.tuple.Pair;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.task.Task;

public interface WkfUserActionService {

  @Transactional
  public void createUserAction(WkfTaskConfig wkfTaskConfig, DelegateExecution execution);

  public String processTitle(String title, FullContext wkfContext);

  @Transactional
  public void updateUserAction(
      WkfTaskConfig wkfTaskConfig,
      ProcessInstance processInstance,
      ProcessEngine processEngine,
      String taskId);

  public FullContext getModelCtx(WkfTaskConfig wkfTaskConfig, DelegateExecution execution)
      throws ClassNotFoundException;

  public User getUser(String userPath, FullContext wkfContext);

  /**
   * Creates a new TeamTask during BPM process migration based on Camunda Task. Builds a completely
   * new TeamTask using the updated configuration.
   */
  TeamTask createTeamTaskFromMigration(
      Task task, WkfTaskConfig wkfTaskConfig, String processInstanceId, ProcessEngine processEngine)
      throws ClassNotFoundException;

  /** Cancel a batch of existing tasks */
  void updateTasksBatchStatus(List<Pair<String, String>> taskBatch, String status);
}
