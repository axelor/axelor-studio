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

import com.axelor.auth.AuthUtils;
import com.axelor.db.Model;
import com.axelor.i18n.I18n;
import com.axelor.studio.bpm.exception.BpmExceptionMessage;
import com.axelor.studio.bpm.service.WkfCommonService;
import com.axelor.studio.bpm.service.app.AppBpmService;
import com.axelor.studio.db.AppBpm;
import com.axelor.studio.db.WkfInstance;
import com.axelor.studio.db.WkfProcess;
import com.axelor.studio.db.WkfTaskConfig;
import com.axelor.studio.db.repo.WkfTaskConfigRepository;
import com.google.common.base.Strings;
import com.google.inject.Inject;
import java.lang.invoke.MethodHandles;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.runtime.Execution;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.task.Task;
import org.camunda.bpm.engine.variable.Variables;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class WkfTaskServiceImpl implements WkfTaskService {

  protected static final int DEFAULT_RECURSIVE_TASK_EXECUTION_DEPTH_LIMIT = 100;
  protected static final int DEFAULT_RECURSIVE_TASK_EXECUTION_DURATION_LIMIT = 10;

  protected int recursiveTaskExecutionCount = 0;
  protected LocalTime recursiveTaskExecutionTime = LocalTime.now();

  protected final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  protected WkfTaskConfigRepository wkfTaskConfigRepository;
  protected WkfInstanceService wkfInstanceService;
  protected WkfCommonService wkfService;
  protected AppBpmService appBpmService;
  protected WkfUserActionService wkfUserActionService;

  @Inject
  public WkfTaskServiceImpl(
      WkfTaskConfigRepository wkfTaskConfigRepository,
      WkfInstanceService wkfInstanceService,
      WkfCommonService wkfService,
      AppBpmService appBpmService,
      WkfUserActionService wkfUserActionService) {
    this.wkfTaskConfigRepository = wkfTaskConfigRepository;
    this.wkfInstanceService = wkfInstanceService;
    this.wkfService = wkfService;
    this.appBpmService = appBpmService;
    this.wkfUserActionService = wkfUserActionService;
  }

  @Override
  public void reset() {
    recursiveTaskExecutionTime = LocalTime.now();
    recursiveTaskExecutionCount = 0;
  }

  @Override
  public String runTasks(
      ProcessEngine engine,
      WkfInstance instance,
      ProcessInstance processInstance,
      String signal,
      Model model)
      throws ClassNotFoundException {

    WkfProcess wkfProcess = instance.getWkfProcess();

    List<Task> tasks = getActiveTasks(engine, processInstance.getId());

    boolean taskExecuted = false;
    String helpText = null;

    Map<String, Object> context = wkfService.getContext(instance, model);
    // TODO: Check if its required both variables from context and from processInstance, if
    Map<String, Object> processVariables =
        engine.getRuntimeService().getVariables(processInstance.getId());
    processVariables.entrySet().removeIf(it -> Strings.isNullOrEmpty(it.getKey()));

    Map<String, Object> expressionVariables = null;
    Map<String, Object> ctxVariables = wkfService.createVariables(context);
    if (signal != null) {
      ctxVariables.put(signal, Variables.objectValue(true, true));
    }

    for (Task task : tasks) {

      WkfTaskConfig config =
          wkfTaskConfigRepository
              .all()
              .filter(
                  "self.name = ? and self.wkfModel.id = ?",
                  task.getTaskDefinitionKey(),
                  wkfProcess.getWkfModel().getId())
              .fetchOne();

      if (config == null) {
        continue;
      }

      List<String> validButtons = getValidButtons(signal, config.getButton());

      if (validButtons == null) {
        continue;
      }

      if (expressionVariables == null) {
        expressionVariables = new HashMap<>();
        expressionVariables.putAll(processVariables);
        expressionVariables.putAll(context);
      }

      if (validButtons.isEmpty() && config.getExpression() == null) {
        continue;
      }

      Map<String, Object> btnVariables = new HashMap<>();
      validButtons.forEach(button -> btnVariables.put(button, button.equals(signal)));

      Map<String, Object> variables = wkfService.createVariables(btnVariables);
      variables.putAll(ctxVariables);

      if (config.getExpression() != null) {
        expressionVariables.putAll(engine.getTaskService().getVariables(task.getId()));
        expressionVariables.entrySet().removeIf(it -> Strings.isNullOrEmpty(it.getKey()));
        Boolean validExpr =
            (Boolean) wkfService.evalExpression(expressionVariables, config.getExpression());
        if (validExpr == null || !validExpr) {
          log.debug("Not a valid expr: {}", config.getExpression());
          if (!validButtons.isEmpty()) {
            helpText = config.getHelpText();
          }
          continue;
        }

        log.debug("Valid expr: {}", config.getExpression());
      }

      String userId =
          Optional.ofNullable(AuthUtils.getUser()).map(Model::getId).orElse(0L).toString();
      engine.getTaskService().setAssignee(task.getId(), userId);

      engine.getTaskService().complete(task.getId(), variables); // here to update the task aop
      wkfUserActionService.updateUserAction(config, processInstance, engine, task.getId());
      taskExecuted = true;
    }
    Execution execution =
        engine
            .getRuntimeService()
            .createExecutionQuery()
            .active()
            .executionId(processInstance.getId())
            .singleResult();
    if (execution != null) {
      engine.getRuntimeService().setVariables(execution.getId(), ctxVariables);
    }
    AppBpm appBpm = appBpmService.getAppBpm();
    Integer taskExecutionRecursivityTimeLimit =
        Optional.ofNullable(appBpm.getTaskExecutionRecursivityDurationLimit())
            .orElse(DEFAULT_RECURSIVE_TASK_EXECUTION_DURATION_LIMIT);
    boolean hasExceededMaxTime =
        Integer.signum(taskExecutionRecursivityTimeLimit) >= 0
            && ChronoUnit.SECONDS.between(recursiveTaskExecutionTime, LocalTime.now())
                >= taskExecutionRecursivityTimeLimit;

    Integer taskExecutionRecursivityDepthLimit =
        Optional.ofNullable(appBpm.getTaskExecutionRecursivityDepthLimit())
            .orElse(DEFAULT_RECURSIVE_TASK_EXECUTION_DEPTH_LIMIT);
    boolean hasExceededMaxDepth =
        Integer.signum(taskExecutionRecursivityDepthLimit) >= 0
            && ++recursiveTaskExecutionCount >= taskExecutionRecursivityDepthLimit;

    if (hasExceededMaxDepth && hasExceededMaxTime) {
      throw new IllegalStateException(I18n.get(BpmExceptionMessage.INFINITE_EXECUTION));
    }

    if (taskExecuted
        && wkfInstanceService.isActiveProcessInstance(
            processInstance.getId(), engine.getRuntimeService())) {
      log.debug("Check tasks again");
      runTasks(engine, instance, processInstance, signal, model);
    }

    return helpText;
  }

  protected List<String> getValidButtons(String signal, String button) {

    if (button == null) {
      return new ArrayList<>();
    }

    List<String> buttons = Arrays.asList(button.split(","));
    if (buttons.contains(signal)) {
      return buttons;
    }
    return null;
  }

  protected List<Task> getActiveTasks(ProcessEngine engine, String processInstanceId) {
    return engine
        .getTaskService()
        .createTaskQuery()
        .active()
        .processInstanceId(processInstanceId)
        .list();
  }
}
