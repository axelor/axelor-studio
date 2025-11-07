/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
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
  void createUserAction(WkfTaskConfig wkfTaskConfig, DelegateExecution execution);

  String processTitle(String title, FullContext wkfContext);

  @Transactional
  void updateUserAction(
      WkfTaskConfig wkfTaskConfig,
      ProcessInstance processInstance,
      ProcessEngine processEngine,
      String taskId);

  FullContext getModelCtx(WkfTaskConfig wkfTaskConfig, DelegateExecution execution)
      throws ClassNotFoundException;

  User getUser(String userPath, FullContext wkfContext);

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
