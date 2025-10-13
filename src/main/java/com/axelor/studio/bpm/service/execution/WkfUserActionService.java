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
import com.axelor.utils.helpers.context.FullContext;
import com.google.inject.persist.Transactional;
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
   * Migre un TeamTask lors d'une migration de version de processus BPM. Annule l'ancien TeamTask et
   * crée un nouveau avec la nouvelle configuration.
   */
  void migrateTeamTaskOnProcessMigration(
      Task task, WkfTaskConfig wkfTaskConfig, String processInstanceId, ProcessEngine processEngine)
      throws ClassNotFoundException;
}
