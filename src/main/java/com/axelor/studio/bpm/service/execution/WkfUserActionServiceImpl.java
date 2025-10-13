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
import com.axelor.auth.db.Role;
import com.axelor.auth.db.User;
import com.axelor.auth.db.repo.RoleRepository;
import com.axelor.auth.db.repo.UserRepository;
import com.axelor.db.Model;
import com.axelor.db.Query;
import com.axelor.i18n.I18n;
import com.axelor.inject.Beans;
import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.meta.db.repo.MetaModelRepository;
import com.axelor.studio.bpm.context.WkfContextHelper;
import com.axelor.studio.bpm.exception.BpmExceptionMessage;
import com.axelor.studio.bpm.service.WkfCommonService;
import com.axelor.studio.db.WkfInstance;
import com.axelor.studio.db.WkfProcessConfig;
import com.axelor.studio.db.WkfTaskConfig;
import com.axelor.studio.db.repo.WkfInstanceRepository;
import com.axelor.studio.db.repo.WkfProcessConfigRepository;
import com.axelor.team.db.Team;
import com.axelor.team.db.TeamTask;
import com.axelor.team.db.repo.TeamRepository;
import com.axelor.team.db.repo.TeamTaskRepository;
import com.axelor.text.GroovyTemplates;
import com.axelor.utils.helpers.ExceptionHelper;
import com.axelor.utils.helpers.context.FullContext;
import com.google.common.base.Strings;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import java.lang.invoke.MethodHandles;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.commons.lang3.StringUtils;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.history.HistoricTaskInstance;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.task.Task;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class WkfUserActionServiceImpl implements WkfUserActionService {

  protected static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  public static final String DESCRIPTION = /*$$(*/
      "BPM state <b>%s</b> is activated on<br/> <a href=\"%s\">%s</a><br/>" /*)*/;

  protected WkfCommonService wkfService;

  protected UserRepository userRepository;

  protected WkfProcessConfigRepository wkfProcessConfigRepository;

  protected TeamTaskRepository teamTaskRepository;

  protected RoleRepository roleRepo;

  protected TeamRepository teamRepo;

  protected WkfEmailService wkfEmailService;

  protected MetaModelRepository metaModelRepository;

  protected WkfInstanceRepository wkfInstanceRepository;

  protected GroovyTemplates templates;

  @Inject
  public WkfUserActionServiceImpl(
      WkfCommonService wkfService,
      UserRepository userRepository,
      WkfProcessConfigRepository wkfProcessConfigRepository,
      TeamTaskRepository teamTaskRepository,
      RoleRepository roleRepo,
      GroovyTemplates templates,
      TeamRepository teamRepo,
      MetaModelRepository metaModelRepository,
      WkfInstanceRepository wkfInstanceRepository,
      WkfEmailService wkfEmailService) {
    this.wkfService = wkfService;
    this.userRepository = userRepository;
    this.wkfProcessConfigRepository = wkfProcessConfigRepository;
    this.teamTaskRepository = teamTaskRepository;
    this.roleRepo = roleRepo;
    this.teamRepo = teamRepo;
    this.wkfEmailService = wkfEmailService;
    this.wkfInstanceRepository = wkfInstanceRepository;
    this.metaModelRepository = metaModelRepository;
    this.templates = templates;
  }

  protected static final Pattern FIELD_PATTERN = Pattern.compile("(\\$\\{[^\\}]+\\})");

  @Override
  @Transactional(rollbackOn = Exception.class)
  public void createUserAction(WkfTaskConfig wkfTaskConfig, DelegateExecution execution) {

    String title = wkfTaskConfig.getTaskEmailTitle();
    if (title == null) {
      return;
    }

    try {
      FullContext wkfContext = getModelCtx(wkfTaskConfig, execution);
      String modelName =
          wkfTaskConfig.getModelName() != null
              ? wkfTaskConfig.getModelName()
              : wkfTaskConfig.getJsonModelName();

      String varModelName = wkfService.getVarName(modelName);

      Map<String, Object> contextVariables = new HashMap<>();
      contextVariables.put(varModelName, wkfContext);

      Map<String, Object> processVariables =
          execution
              .getProcessEngine()
              .getRuntimeService()
              .getVariables(execution.getProcessInstanceId());

      processVariables.entrySet().removeIf(it -> Strings.isNullOrEmpty(it.getKey()));
      contextVariables.putAll(processVariables);

      TeamTask teamTask =
          buildTeamTask(
              wkfContext,
              wkfTaskConfig,
              contextVariables,
              execution.getProcessInstanceId(),
              execution.getProcessDefinitionId(),
              execution.getCurrentActivityName());

      if (teamTask != null) {
        teamTaskRepository.save(teamTask);
      }

    } catch (ClassNotFoundException e) {
      ExceptionHelper.error(e);
    }
  }

  protected TeamTask buildTeamTask(
      FullContext wkfContext,
      WkfTaskConfig wkfTaskConfig,
      Map<String, Object> contextVariables,
      String processInstanceId,
      String processDefinitionId,
      String currentActivityName) {

    String title = wkfTaskConfig.getTaskEmailTitle();
    if (title == null) {
      return null;
    }

    // === Title ===
    switch (wkfTaskConfig.getTaskNameType().toLowerCase()) {
      case "value":
        title = processTitle(title, wkfContext);
        break;
      case "script":
        title = templates.fromText(title).make(contextVariables).render();
        break;
    }

    TeamTask teamTask = new TeamTask(title);
    teamTask.setWkfTaskConfig(wkfTaskConfig);
    teamTask.setRelatedProcessInstance(wkfInstanceRepository.findByInstanceId(processInstanceId));
    teamTask.setStatus("new");

    // === Role ===
    String rolePath = wkfTaskConfig.getRoleFieldPath();
    String roleValue = wkfTaskConfig.getRoleName();
    if (!StringUtils.isEmpty(roleValue) || rolePath != null) {
      switch (wkfTaskConfig.getRoleType().toLowerCase()) {
        case "value":
          teamTask.setRole(roleRepo.findByName(roleValue));
          break;
        case "field":
          teamTask.setRole(getRole(rolePath, wkfContext));
          break;
        case "script":
          FullContext roleContext =
              (FullContext) wkfService.evalExpression(contextVariables, rolePath);
          if (roleContext != null && roleContext.getTarget() instanceof Role) {
            Role role = (Role) roleContext.getTarget();
            teamTask.setRole(role);
          }
          break;
      }
    }

    // === Deadline ===
    if (wkfTaskConfig.getDeadlineFieldPath() != null) {
      switch (wkfTaskConfig.getDeadlineFieldType().toLowerCase()) {
        case "field":
          teamTask.setTaskDeadline(
              getDeadLineDate(wkfTaskConfig.getDeadlineFieldPath(), wkfContext));
          break;
        case "script":
          LocalDate deadline =
              (LocalDate)
                  wkfService.evalExpression(contextVariables, wkfTaskConfig.getDeadlineFieldPath());
          teamTask.setTaskDeadline(deadline);
          break;
      }
    }

    if (teamTask.getTaskDate() == null) {
      teamTask.setTaskDate(LocalDate.now());
    }

    // === User ===
    String userPath = getUserPath(wkfTaskConfig, processDefinitionId);
    if (userPath != null) {
      switch (wkfTaskConfig.getUserFieldType().toLowerCase()) {
        case "field":
          teamTask.setAssignedTo(getUser(userPath, wkfContext));
          break;
        case "script":
          FullContext userCtx =
              (FullContext)
                  wkfService.evalExpression(contextVariables, wkfTaskConfig.getUserPath());
          if (userCtx != null && userCtx.getTarget() instanceof User) {
            User user = (User) userCtx.getTarget();
            teamTask.setAssignedTo(user);
          }
          break;
      }
    }

    // === Team ===
    String teamPath = wkfTaskConfig.getTeamPath();
    if (teamPath != null) {
      switch (wkfTaskConfig.getTeamFieldType().toLowerCase()) {
        case "field":
          teamTask.setTeam(getTeam(teamPath, wkfContext));
          break;
        case "script":
          FullContext teamCtx =
              (FullContext)
                  wkfService.evalExpression(contextVariables, wkfTaskConfig.getTeamPath());
          if (teamCtx != null && teamCtx.getTarget() instanceof Team) {
            Team team = (Team) teamCtx.getTarget();
            teamTask.setTeam(team);
          }
          break;
      }
    }

    // === Priority ===
    if (wkfTaskConfig.getTaskPriority() != null) {
      switch (wkfTaskConfig.getTaskPriorityType().toLowerCase()) {
        case "value":
          teamTask.setPriority(wkfTaskConfig.getTaskPriority());
          break;
        case "script":
          teamTask.setPriority(
              templates.fromText(wkfTaskConfig.getTaskPriority()).make(contextVariables).render());
          break;
      }
    }

    // === Duration ===
    if (wkfTaskConfig.getDuration() != null) {
      teamTask.setTaskDuration(Integer.parseInt(wkfTaskConfig.getDuration()));
    }

    // === Description ===
    String url = wkfEmailService.createUrl(wkfContext, wkfTaskConfig.getDefaultForm());
    String descriptionType = wkfTaskConfig.getDescriptionType();
    if (descriptionType != null) {
      switch (descriptionType.toLowerCase()) {
        case "value":
          teamTask.setDescription(wkfTaskConfig.getDescription());
          break;
        case "script":
          teamTask.setDescription(
              templates.fromText(wkfTaskConfig.getDescription()).make(contextVariables).render());
          break;
        default:
          teamTask.setDescription(String.format(DESCRIPTION, currentActivityName, url, url));
      }
    }

    return teamTask;
  }

  private Team getTeam(String teamPath, FullContext wkfContext) {
    FullContext teamCtx = (FullContext) wkfService.evalExpression(wkfContext, teamPath);
    if (teamCtx != null) {
      Team team = (Team) teamCtx.getTarget();
      if (team != null) {
        team = teamRepo.find(team.getId());
        return team;
      }
    }
    return null;
  }

  @Transactional(rollbackOn = Exception.class)
  public void cancelExistingTask(WkfTaskConfig wkfTaskConfig, String oldProcessId) {
    if (wkfTaskConfig == null) {
      return;
    }

    List<TeamTask> teamTasks =
        teamTaskRepository
            .all()
            .filter(
                "self.relatedProcessInstance.instanceId = ?1 "
                    + "AND self.wkfTaskConfig.name = ?2 "
                    + "AND self.status != ?3",
                oldProcessId,
                wkfTaskConfig.getName(),
                "canceled")
            .fetch();

    if (teamTasks == null || teamTasks.isEmpty()) {
      return;
    }

    for (TeamTask teamTask : teamTasks) {
      teamTask.setStatus("canceled");
      teamTaskRepository.save(teamTask);
    }
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public void updateUserAction(
      WkfTaskConfig wkfTaskConfig,
      ProcessInstance processInstance,
      ProcessEngine processEngine,
      String taskId) {
    if (wkfTaskConfig == null) {
      return;
    }
    String title = wkfTaskConfig.getTaskEmailTitle();
    if (title == null) {
      return;
    }
    TeamTask teamTask =
        teamTaskRepository
            .all()
            .filter(
                "self.relatedProcessInstance.instanceId = ?1 and self.wkfTaskConfig.name =  ?2 and self.status != ?3",
                processInstance.getProcessInstanceId(),
                wkfTaskConfig.getName(),
                "canceled")
            .fetchOne();
    if (teamTask == null) {
      return;
    }
    HistoricTaskInstance task =
        processEngine
            .getHistoryService()
            .createHistoricTaskInstanceQuery()
            .taskId(taskId)
            .processInstanceId(processInstance.getProcessInstanceId())
            .singleResult();
    teamTask.setStatus("closed");
    teamTask.setTaskDuration((int) (task.getDurationInMillis() / 1000));
    teamTaskRepository.save(teamTask);
  }

  @Override
  public String processTitle(String title, FullContext wkfContext) {

    Matcher machMatcher = FIELD_PATTERN.matcher(title);

    while (machMatcher.find()) {
      String field = machMatcher.group();
      Object value = wkfService.evalExpression(wkfContext, field);
      if (value == null) {
        value = "";
      }
      title = title.replace(field, value.toString());
    }

    return title;
  }

  @SuppressWarnings("unchecked")
  @Override
  public FullContext getModelCtx(WkfTaskConfig wkfTaskConfig, DelegateExecution execution)
      throws ClassNotFoundException {

    String modelName = null;
    Class<? extends Model> modelClass = null;
    if (wkfTaskConfig.getModelName() != null) {
      modelName = wkfTaskConfig.getModelName();
      modelClass =
          (Class<? extends Model>)
              Class.forName(metaModelRepository.findByName(modelName).getFullName());
    } else if (wkfTaskConfig.getJsonModelName() != null) {
      modelName = wkfTaskConfig.getJsonModelName();
      modelClass = MetaJsonRecord.class;
    } else {
      return null;
    }

    String varName = wkfService.getVarName(modelName);
    return (FullContext) execution.getVariable(varName);
  }

  protected LocalDate getDeadLineDate(String deadLineFieldPath, FullContext wkfContext) {

    LocalDate date = null;
    if (deadLineFieldPath.equals("today")) {
      date = LocalDate.now();
    } else if (wkfContext != null) {
      date = (LocalDate) wkfService.evalExpression(wkfContext, deadLineFieldPath);
    }

    return date;
  }

  public Role getRole(String rolePath, FullContext wkfContext) {
    Role role = null;
    if (wkfContext != null) {
      FullContext roleCtx = (FullContext) wkfService.evalExpression(wkfContext, rolePath);
      if (roleCtx != null) {
        role = (Role) roleCtx.getTarget();
        if (role != null) {
          role = roleRepo.find(role.getId());
        }
      }
    } else {
      role = roleRepo.findByName(rolePath);
    }

    return role;
  }

  @Override
  public User getUser(String userPath, FullContext wkfContext) {

    User user = null;
    if (userPath.equals("currentUser")) {
      user = AuthUtils.getUser();
    } else if (wkfContext != null) {
      FullContext userCtx = (FullContext) wkfService.evalExpression(wkfContext, userPath);
      if (userCtx != null) {
        user = (User) userCtx.getTarget();
        if (user != null) {
          user = userRepository.find(user.getId());
        }
      }
    } else {
      user = userRepository.findByCode(userPath);
    }

    return user;
  }

  protected String getUserPath(WkfTaskConfig wkfTaskConfig, String processDefinitionId) {

    String userPath = wkfTaskConfig.getUserPath();
    if (userPath == null) {
      WkfProcessConfig processConfig =
          wkfProcessConfigRepository
              .all()
              .filter(
                  "self.wkfProcess.processId = ?1 "
                      + "AND self.wkfProcess.wkfModel.id = ?2 "
                      + "AND ((?3 != '' OR ?3 is not null) AND self.metaModel.fullName = ?3) "
                      + "OR ((?4 != '' OR ?4 is not null) AND self.metaJsonModel.name = ?4)",
                  processDefinitionId,
                  wkfTaskConfig.getWkfModel().getId(),
                  wkfTaskConfig.getModelName(),
                  wkfTaskConfig.getJsonModelName())
              .fetchOne();
      if (processConfig != null) {
        userPath = processConfig.getUserDefaultPath();
      }
    }

    return userPath;
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public void migrateTeamTaskOnProcessMigration(
      Task task, WkfTaskConfig wkfTaskConfig, String processInstanceId, ProcessEngine processEngine)
      throws ClassNotFoundException {

    if (wkfTaskConfig == null) {
      return;
    }

    log.debug(
        "Migrating TeamTask for task '{}' (config id={}) in process instance '{}'",
        wkfTaskConfig.getName(),
        wkfTaskConfig.getId(),
        processInstanceId);

    Map<String, Object> contextVariables =
        buildMigrationContextVariables(wkfTaskConfig, processInstanceId, processEngine);

    cancelExistingTask(wkfTaskConfig, processInstanceId);

    FullContext wkfContext = extractWkfContextFromVariables(wkfTaskConfig, contextVariables);

    TeamTask newTeamTask =
        buildTeamTask(
            wkfContext,
            wkfTaskConfig,
            contextVariables,
            processInstanceId,
            task.getProcessDefinitionId(),
            task.getName());

    if (newTeamTask != null) {
      teamTaskRepository.save(newTeamTask);
      log.info(
          "Successfully migrated TeamTask for task '{}' (new TeamTask id={})",
          wkfTaskConfig.getName(),
          newTeamTask.getId());
    } else {
      log.warn("buildTeamTask returned null for task '{}'", wkfTaskConfig.getName());
    }
  }

  protected Map<String, Object> buildMigrationContextVariables(
      WkfTaskConfig wkfTaskConfig, String processInstanceId, ProcessEngine processEngine)
      throws ClassNotFoundException {

    FullContext wkfContext = createFullContext(processInstanceId);

    String modelName =
        wkfTaskConfig.getModelName() != null
            ? wkfTaskConfig.getModelName()
            : wkfTaskConfig.getJsonModelName();

    String varModelName = wkfService.getVarName(modelName);

    Map<String, Object> contextVariables = new HashMap<>();
    contextVariables.put(varModelName, wkfContext);

    Map<String, Object> processVariables =
        processEngine.getRuntimeService().getVariables(processInstanceId);

    processVariables.entrySet().removeIf(entry -> Strings.isNullOrEmpty(entry.getKey()));
    contextVariables.putAll(processVariables);

    return contextVariables;
  }

  protected FullContext extractWkfContextFromVariables(
      WkfTaskConfig wkfTaskConfig, Map<String, Object> contextVariables) {

    String modelName =
        wkfTaskConfig.getModelName() != null
            ? wkfTaskConfig.getModelName()
            : wkfTaskConfig.getJsonModelName();

    String varName = wkfService.getVarName(modelName);
    Object contextValue = contextVariables.get(varName);

    if (contextValue instanceof FullContext) {
      return (FullContext) contextValue;
    }

    return null;
  }

  private FullContext createFullContext(String processInstanceId) throws ClassNotFoundException {

    WkfInstance instance =
        Beans.get(WkfInstanceRepository.class)
            .all()
            .filter("self.instanceId = ?", processInstanceId)
            .fetchOne();

    if (instance == null) {
      throw new IllegalArgumentException(
          String.format(I18n.get(BpmExceptionMessage.NO_WFK_INSTANCE_FOUND), processInstanceId));
    }

    List<WkfProcessConfig> wkfProcessConfigs = instance.getWkfProcess().getWkfProcessConfigList();
    if (wkfProcessConfigs == null || wkfProcessConfigs.isEmpty()) {
      throw new IllegalStateException(
          String.format(
              I18n.get(BpmExceptionMessage.NO_PROCESS_CONFIGURATION_FOUND), processInstanceId));
    }

    WkfProcessConfig firstConfig = wkfProcessConfigs.get(0);

    String classFullName;
    if (firstConfig.getMetaModel() != null) {
      classFullName = firstConfig.getMetaModel().getFullName();
    } else if (firstConfig.getMetaJsonModel() != null) {
      classFullName = MetaJsonRecord.class.getName();
    } else {
      throw new IllegalStateException(
          String.format(
              I18n.get(BpmExceptionMessage.NO_PROCESS_CONFIGURATION_FOUND), processInstanceId));
    }

    Class<? extends Model> klass = Class.forName(classFullName).asSubclass(Model.class);

    Model model =
        Query.of(klass)
            .filter("self.processInstanceId = :instanceId")
            .bind("instanceId", instance.getInstanceId())
            .fetchOne();

    if (model == null) {
      throw new RuntimeException(
          String.format(
              I18n.get(BpmExceptionMessage.MODEL_NOT_FOUND), processInstanceId, classFullName));
    }

    return WkfContextHelper.create(model);
  }
}
