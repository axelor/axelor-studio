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
import com.axelor.db.JPA;
import com.axelor.db.Model;
import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.meta.db.repo.MetaModelRepository;
import com.axelor.studio.bpm.service.WkfCommonService;
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
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.commons.lang3.StringUtils;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.history.HistoricTaskInstance;
import org.camunda.bpm.engine.runtime.ProcessInstance;

public class WkfUserActionServiceImpl implements WkfUserActionService {

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
      String modelName = null;
      if (wkfTaskConfig.getModelName() != null) {
        modelName = wkfTaskConfig.getModelName();
      } else {
        modelName = wkfTaskConfig.getJsonModelName();
      }
      String varModelName = wkfService.getVarName(modelName);
      Map<String, Object> contextVariables = new HashMap<>();
      contextVariables.put(varModelName, wkfContext);
      Map<String, Object> processVariables =
          execution
              .getProcessEngine()
              .getRuntimeService()
              .getVariables(execution.getProcessInstance().getId());
      processVariables.entrySet().removeIf(it -> Strings.isNullOrEmpty(it.getKey()));
      contextVariables.putAll(processVariables);
      switch (wkfTaskConfig.getTaskNameType()) {
        case "Value":
          if (wkfContext != null) {
            title = processTitle(title, wkfContext);
          }
          break;
        case "Script":
          title =
              templates.fromText(wkfTaskConfig.getTaskEmailTitle()).make(contextVariables).render();
          break;
      }
      TeamTask teamTask = new TeamTask(title);
      teamTask.setRelatedProcessInstance(
          wkfInstanceRepository.findByInstanceId(execution.getProcessInstanceId()));
      teamTask.setStatus("new");
      if (!StringUtils.isEmpty(wkfTaskConfig.getRoleType())) {
        switch (wkfTaskConfig.getRoleType()) {
          case "Value":
            teamTask.setRole(roleRepo.findByName(wkfTaskConfig.getRoleName()));
            break;
          case "Field":
            teamTask.setRole(getRole(wkfTaskConfig.getRoleFieldPath(), wkfContext));
            break;
          case "Script":
            FullContext roleContext =
                (FullContext)
                    wkfService.evalExpression(contextVariables, wkfTaskConfig.getRoleFieldPath());
            if (roleContext != null) {
              Role role = (Role) roleContext.getTarget();
              if (role != null) {
                teamTask.setRole(role);
              }
            }
            break;
        }
      }
      if (wkfTaskConfig.getDeadlineType() != null) {
        switch (wkfTaskConfig.getDeadlineType()) {
          case "Field":
            teamTask.setTaskDeadline(
                getDeadLineDate(wkfTaskConfig.getDeadlineFieldPath(), wkfContext));
            break;
          case "Script":
            LocalDate deadline =
                (LocalDate)
                    wkfService.evalExpression(
                        contextVariables, wkfTaskConfig.getDeadlineFieldPath());
            teamTask.setTaskDeadline(deadline);
            break;
        }
      }
      if (teamTask.getTaskDate() == null) {
        teamTask.setTaskDate(LocalDate.now());
      }
      String userPath = getUserPath(wkfTaskConfig, execution.getProcessDefinitionId());
      if (userPath != null) {
        switch (wkfTaskConfig.getUserFieldType()) {
          case "Field":
            teamTask.setAssignedTo(getUser(userPath, wkfContext));
            break;
          case "Script":
            FullContext userCtx =
                (FullContext)
                    wkfService.evalExpression(contextVariables, wkfTaskConfig.getUserPath());
            if (userCtx != null) {
              User user = (User) userCtx.getTarget();
              if (user != null) {
                teamTask.setAssignedTo(user);
              }
            }
            break;
        }
      }
      String teamPath = wkfTaskConfig.getTeamPath();
      if (teamPath != null) {
        switch (wkfTaskConfig.getTeamFieldType()) {
          case "Field":
            teamTask.setTeam(getTeam(teamPath, wkfContext));
            break;
          case "Script":
            FullContext teamCtx =
                (FullContext)
                    wkfService.evalExpression(contextVariables, wkfTaskConfig.getTeamPath());
            if (teamCtx != null) {
              Team team = (Team) teamCtx.getTarget();
              if (team != null) {
                teamTask.setTeam(team);
              }
            }
            break;
        }
      }
      if (wkfTaskConfig.getTaskPriority() != null) {
        switch (wkfTaskConfig.getTaskPriorityType()) {
          case "Value":
            teamTask.setPriority(wkfTaskConfig.getTaskPriority());
            break;
          case "Script":
            teamTask.setPriority(
                templates
                    .fromText(wkfTaskConfig.getTaskPriority())
                    .make(contextVariables)
                    .render());
            break;
        }
      }
      if (wkfTaskConfig.getDuration() != null) {
        teamTask.setTaskDuration(Integer.parseInt(wkfTaskConfig.getDuration()));
      }
      String url = wkfEmailService.createUrl(wkfContext, wkfTaskConfig.getDefaultForm());
      if (wkfTaskConfig.getDescriptionType() == "Script") {
        teamTask.setDescription(
            templates.fromText(wkfTaskConfig.getDescription()).make(contextVariables).render());
      } else {
        teamTask.setDescription(
            String.format(DESCRIPTION, execution.getCurrentActivityName(), url, url));
      }
      teamTaskRepository.save(teamTask);
    } catch (ClassNotFoundException e) {
      ExceptionHelper.trace(e);
    }
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

  @Override
  @Transactional(rollbackOn = Exception.class)
  public void migrateUserAction(WkfTaskConfig wkfTaskConfig, String oldProcessId) {
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
                "self.relatedProcessInstance.name = ?1 and self.name =  ?2",
                String.format("%s : %s", wkfTaskConfig.getProcessId(), oldProcessId),
                title)
            .fetchOne();
    teamTask.setStatus("canceled");
    teamTaskRepository.save(teamTask);
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
                "self.relatedProcessInstance.name = ?1 and self.name =  ?2",
                String.format(
                    "%s : %s",
                    processInstance.getProcessDefinitionId(),
                    processInstance.getProcessInstanceId()),
                title)
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
    Object id = execution.getVariable(varName + "Id");
    FullContext wkfContext = null;
    if (id != null && id instanceof Long) {
      Model record = JPA.find(modelClass, Long.parseLong(id.toString()));
      wkfContext = new FullContext(record);
    }
    return wkfContext;
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
}
