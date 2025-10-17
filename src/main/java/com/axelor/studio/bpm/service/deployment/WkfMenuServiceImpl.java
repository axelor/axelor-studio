/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.deployment;

import com.axelor.auth.db.Group;
import com.axelor.auth.db.Role;
import com.axelor.auth.db.User;
import com.axelor.common.Inflector;
import com.axelor.db.mapper.Mapper;
import com.axelor.db.mapper.Property;
import com.axelor.meta.CallMethod;
import com.axelor.meta.db.MetaAction;
import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.meta.db.MetaMenu;
import com.axelor.meta.db.MetaModel;
import com.axelor.meta.db.repo.MetaActionRepository;
import com.axelor.meta.db.repo.MetaMenuRepository;
import com.axelor.meta.db.repo.MetaModelRepository;
import com.axelor.studio.bpm.service.execution.WkfInstanceService;
import com.axelor.studio.db.WkfTaskConfig;
import com.axelor.studio.db.WkfTaskMenu;
import com.axelor.studio.db.WkfTaskMenuContext;
import com.axelor.team.db.Team;
import com.axelor.team.db.repo.TeamRepository;
import com.axelor.utils.helpers.ExceptionHelper;
import com.google.common.base.Strings;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;

public class WkfMenuServiceImpl implements WkfMenuService {

  protected MetaMenuRepository metaMenuRepository;

  protected MetaActionRepository metaActionRepository;

  protected MetaModelRepository metaModelRepository;

  protected TeamRepository teamRepo;

  @Inject
  public WkfMenuServiceImpl(
      MetaMenuRepository metaMenuRepository,
      MetaActionRepository metaActionRepository,
      MetaModelRepository metaModelRepository,
      TeamRepository teamRepo) {
    this.metaMenuRepository = metaMenuRepository;
    this.metaActionRepository = metaActionRepository;
    this.metaModelRepository = metaModelRepository;
    this.teamRepo = teamRepo;
  }

  protected Inflector inflector = Inflector.getInstance();

  @Override
  @Transactional(rollbackOn = Exception.class)
  public void createOrUpdateMenu(WkfTaskConfig wkfTaskConfig) {

    List<WkfTaskMenu> taskMenuList = wkfTaskConfig.getWkfTaskMenuList();
    if (CollectionUtils.isEmpty(taskMenuList)) {
      return;
    }

    for (WkfTaskMenu taskMenu : taskMenuList) {
      String name = taskMenu.getMenuId();

      MetaMenu metaMenu = findOrCreateMenu(name);
      metaMenu.setTitle(taskMenu.getMenuName());
      MetaAction action = createOrUpdateAction(metaMenu, wkfTaskConfig, taskMenu);
      if (action == null) {
        if (metaMenu.getId() != null) {
          metaMenuRepository.remove(metaMenu);
        }
        return;
      }
      metaMenu.setAction(action);
      metaMenu.setParent(null);
      metaMenu.setTagCount(taskMenu.getDisplayTagCount());
      if (taskMenu.getParentMenuName() != null) {
        metaMenu.setParent(metaMenuRepository.findByName(taskMenu.getParentMenuName()));
      }
      if (taskMenu.getPositionMenuName() != null) {
        MetaMenu positionMenu = metaMenuRepository.findByName(taskMenu.getPositionMenuName());
        if (positionMenu != null) {
          if (taskMenu.getMenuPosition() != null && taskMenu.getMenuPosition().equals("before")) {
            metaMenu.setOrder(positionMenu.getOrder() - 1);
          } else {
            metaMenu.setOrder(positionMenu.getOrder() + 1);
          }
        }
      }
      Set<Role> roleSet = null;
      if (CollectionUtils.isNotEmpty(taskMenu.getRoleSet())) {
        roleSet = new HashSet<>(taskMenu.getRoleSet());
      }
      metaMenu.setRoles(roleSet);
      metaMenuRepository.save(metaMenu);
    }
  }

  @Override
  public MetaMenu findOrCreateMenu(String name) {

    MetaMenu menu = metaMenuRepository.findByName(name);
    if (menu == null) {
      menu = new MetaMenu(name);
    }
    return menu;
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public MetaAction createOrUpdateAction(
      MetaMenu metaMenu, WkfTaskConfig wkfTaskConfig, WkfTaskMenu taskMenu) {

    if (wkfTaskConfig.getModelName() == null && wkfTaskConfig.getJsonModelName() == null) {
      return null;
    }

    boolean userMenu = taskMenu.getUserNewMenu();
    String name = metaMenu.getName().replace("-", ".");
    MetaAction metaAction = metaActionRepository.findByName(name);

    if (metaAction == null) {
      metaAction = new MetaAction(name);
    }
    metaAction.setType("action-view");
    String model = getModelName(wkfTaskConfig);
    metaAction.setModel(model);
    boolean isJson = model.equals(MetaJsonRecord.class.getName());
    String query = createQuery(wkfTaskConfig, taskMenu, userMenu, isJson);
    Map<String, String> viewMap = getViewNames(wkfTaskConfig, taskMenu, isJson);
    boolean permanent = taskMenu.getPermanentMenu();

    if (userMenu && query == null) {
      if (metaAction.getId() != null) {
        metaActionRepository.remove(metaAction);
      }
      return null;
    }

    metaAction.setXml(
        buildActionViewXml(
            name,
            model,
            metaMenu,
            viewMap,
            query,
            wkfTaskConfig,
            userMenu,
            permanent,
            isJson,
            taskMenu));

    return metaActionRepository.save(metaAction);
  }

  protected String buildActionViewXml(
      String name,
      String model,
      MetaMenu metaMenu,
      Map<String, String> viewMap,
      String domain,
      WkfTaskConfig wkfTaskConfig,
      boolean userMenu,
      boolean permanent,
      boolean isJson,
      WkfTaskMenu taskMenu) {

    String context = computeContext(permanent, wkfTaskConfig, userMenu, isJson, taskMenu);

    // Base view structure
    return """
        <action-view name="%s" model="%s" title="%s">
            <view type="grid" name="%s" />
            <view type="form" name="%s" />
            <domain>%s</domain>
            %s
        </action-view>
        """
        .formatted(
            name,
            model,
            metaMenu.getTitle(),
            viewMap.get("grid"),
            viewMap.get("form"),
            domain,
            context);
  }

  protected String computeContext(
      boolean permanent,
      WkfTaskConfig wkfTaskConfig,
      boolean userMenu,
      boolean isJson,
      WkfTaskMenu taskMenu) {

    String processInstanceIdsExpr =
        "call:%s:findProcessInstanceByNode('%s','%s','%s',%s)"
            .formatted(
                WkfInstanceService.class.getName(),
                wkfTaskConfig.getName(),
                wkfTaskConfig.getProcessId(),
                wkfTaskConfig.getType(),
                permanent);

    StringBuilder xml =
        new StringBuilder(
            """
          <context name="processInstanceIds" expr="%s" />
        """
                .formatted(processInstanceIdsExpr));

    // Add user context if needed
    if (userMenu && !Strings.isNullOrEmpty(wkfTaskConfig.getUserPath())) {
      xml.append(
          """
            <context name="currentUserId" expr="eval:__user__.id" />
          """);
    }

    // Add team context if needed
    if (userMenu && !Strings.isNullOrEmpty(wkfTaskConfig.getTeamPath())) {
      xml.append(
          """
            <context name="teamIds" expr="call:com.axelor.studio.bpm.service.deployment.WkfMenuService:getTeamIds(__user__)" />
          """);
    }

    // Add script context if needed
    if ("script".equals(wkfTaskConfig.getUserFieldType())) {
      xml.append(
          """
            <context name="userPath" expr="eval:%s?.id" />
          """
              .formatted(wkfTaskConfig.getUserPath()));
    }

    // Add JSON model context if needed
    if (isJson) {
      xml.append(
          """
            <context name="jsonModel" expr="%s" />
          """
              .formatted(wkfTaskConfig.getJsonModelName()));
    }

    // Add additional contexts
    if (CollectionUtils.isNotEmpty(taskMenu.getWkfTaskMenuContextList())) {
      String additionalContext =
          """
            <context name="%s" expr="%s" />
          """;
      for (WkfTaskMenuContext context : taskMenu.getWkfTaskMenuContextList()) {
        if (!StringUtils.isBlank(context.getKey()) && !StringUtils.isBlank(context.getValue())) {
          String formatted = additionalContext.formatted(context.getKey(), context.getValue());
          xml.append(formatted);
        }
      }
    }

    return xml.toString();
  }

  @Override
  public Map<String, String> getViewNames(
      WkfTaskConfig wkfTaskConfig, WkfTaskMenu taskMenu, boolean isJson) {
    String viewPrefix = getViewPrefix(wkfTaskConfig, isJson);

    String form = viewPrefix + "-form";
    String grid = viewPrefix + "-grid";

    if (taskMenu.getFormView() != null) {
      form = taskMenu.getFormView();
    }
    if (taskMenu.getGridView() != null) {
      grid = taskMenu.getGridView();
    }

    Map<String, String> viewMap = new HashMap<>();
    viewMap.put("form", form);
    viewMap.put("grid", grid);

    return viewMap;
  }

  @Override
  public String createQuery(
      WkfTaskConfig wkfTaskConfig, WkfTaskMenu taskMenu, boolean userMenu, boolean isJson) {

    Property property = null;
    String query = "self.processInstanceId in (:processInstanceIds)";
    if (isJson) {
      query += " AND self.jsonModel = :jsonModel";
    }
    if (StringUtils.isNotBlank(taskMenu.getDomain())) {
      query += " AND (" + taskMenu.getDomain() + ")";
    }

    if (userMenu) {
      String path = wkfTaskConfig.getUserPath();
      String param = ":currentUserId";
      if (Strings.isNullOrEmpty(path)) {
        path = wkfTaskConfig.getTeamPath();
        if (Strings.isNullOrEmpty(path)) {
          return null;
        }
        param = ":teamIds";
      }
      if (!"script".equals(wkfTaskConfig.getUserFieldType())) {
        if (!isJson) {
          String model = getModelName(wkfTaskConfig);
          try {
            property = Mapper.of(Class.forName(model)).getProperty(path.split("\\.")[0]);
          } catch (ClassNotFoundException e) {
            ExceptionHelper.error(e);
          }
        }

        if (property == null) {
          path = "attrs." + path;
        }
        query += " AND self." + path + ".id in (" + param + ")";
      } else {
        query += " AND :userPath in (" + param + ")";
      }
    }

    return query;
  }

  @Override
  public String getViewPrefix(WkfTaskConfig wkfTaskConfig, boolean isJson) {

    if (isJson) {
      return "custom-model-" + wkfTaskConfig.getJsonModelName();
    }

    return inflector.dasherize(wkfTaskConfig.getModelName());
  }

  @Override
  public String getModelName(WkfTaskConfig wkfTaskConfig) {

    if (wkfTaskConfig.getModelName() != null) {
      MetaModel metaModel = metaModelRepository.findByName(wkfTaskConfig.getModelName());
      if (metaModel != null) {
        return metaModel.getFullName();
      }
    } else if (wkfTaskConfig.getJsonModelName() != null) {
      return MetaJsonRecord.class.getName();
    }

    return null;
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public void removeMenu(WkfTaskConfig wkfTaskConfig) {

    List<WkfTaskMenu> taskMenuList = wkfTaskConfig.getWkfTaskMenuList();
    if (CollectionUtils.isEmpty(taskMenuList)) {
      return;
    }

    for (WkfTaskMenu taskMenu : taskMenuList) {
      String name = taskMenu.getMenuId();

      MetaMenu metaMenu = metaMenuRepository.findByName(name);
      if (metaMenu != null) {
        metaMenuRepository.remove(metaMenu);
      }

      removeAction(name);
    }
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public void removeMenu(WkfTaskMenu taskMenu) {
    String name = taskMenu.getMenuId();

    MetaMenu metaMenu = metaMenuRepository.findByName(name);
    if (metaMenu != null) {
      metaMenuRepository.remove(metaMenu);
    }

    removeAction(name);
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public void removeAction(String menuName) {

    MetaAction metaAction = metaActionRepository.findByName(menuName.replace("-", "."));

    if (metaAction != null) {
      metaActionRepository.remove(metaAction);
    }
  }

  @Override
  @CallMethod
  public List<Long> getTeamIds(User user) {
    Set<Role> userRoles = user.getRoles();
    Group userGroup = user.getGroup();

    List<Team> teams =
        teamRepo
            .all()
            .filter(
                "?1 MEMBER OF self.members OR self IN "
                    + "(SELECT team FROM Team team INNER JOIN team.roles role "
                    + "WHERE role IN (?2) OR role IN (?3))",
                user,
                userGroup != null
                    ? CollectionUtils.isNotEmpty(userGroup.getRoles()) ? userGroup.getRoles() : null
                    : null,
                CollectionUtils.isNotEmpty(userRoles) ? userRoles : null)
            .fetch();

    if (CollectionUtils.isEmpty(teams)) {
      return Collections.emptyList();
    }

    return teams.stream().map(Team::getId).toList();
  }
}
