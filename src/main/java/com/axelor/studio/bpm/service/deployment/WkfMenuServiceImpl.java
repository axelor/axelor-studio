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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
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

    String xml =
        "<action-view name=\""
            + name
            + "\" model=\""
            + model
            + "\" title=\""
            + metaMenu.getTitle()
            + "\">\n"
            + "\t<view type=\"grid\" name=\""
            + viewMap.get("grid")
            + "\" />\n"
            + "\t<view type=\"form\" name=\""
            + viewMap.get("form")
            + "\" />\n"
            + "\t<domain>"
            + query
            + "</domain>\n"
            + "\t<context name=\"processInstanceIds\" expr=\"call:"
            + WkfInstanceService.class.getName()
            + ":findProcessInstanceByNode('"
            + wkfTaskConfig.getName()
            + "','"
            + wkfTaskConfig.getProcessId()
            + "','"
            + wkfTaskConfig.getType()
            + "',"
            + permanent
            + ")\" />\n"
            + (userMenu && !Strings.isNullOrEmpty(wkfTaskConfig.getUserPath())
                ? "\t<context name=\"currentUserId\" expr=\"eval:__user__.id\" />\n"
                : "")
            + (userMenu && !Strings.isNullOrEmpty(wkfTaskConfig.getTeamPath())
                ? "\t<context name=\"teamIds\" expr=\"call:com.axelor.studio.bpm.service.deployment.WkfMenuService:getTeamIds(__user__)\" />\n"
                : "")
            + ("script".equals(wkfTaskConfig.getUserFieldType())
                ? "\t<context name=\"userPath\" expr=\"eval:"
                    + wkfTaskConfig.getUserPath()
                    + "?.id\" />\n"
                : "")
            + (isJson
                ? "\t<context name=\"jsonModel\" expr=\""
                    + wkfTaskConfig.getJsonModelName()
                    + "\" />\n"
                : "");

    if (CollectionUtils.isNotEmpty(taskMenu.getWkfTaskMenuContextList())) {
      for (WkfTaskMenuContext context : taskMenu.getWkfTaskMenuContextList()) {
        String key = context.getKey();
        String value = context.getValue();
        if (StringUtils.isBlank(key) || StringUtils.isBlank(value)) {
          continue;
        }
        xml += "\t<context name=\"" + key + "\" expr=\"" + value + "\" />\n";
      }
    }

    xml += "</action-view>";
    metaAction.setXml(xml);

    return metaActionRepository.save(metaAction);
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

    Map<String, String> viewMap = new HashMap<String, String>();
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
            ExceptionHelper.trace(e);
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
    List<Long> teamIds = new ArrayList<>();

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
      return teamIds;
    }

    teamIds = teams.stream().map(team -> team.getId()).collect(Collectors.toList());
    return teamIds;
  }
}
