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

import com.axelor.auth.db.Role;
import com.axelor.auth.db.repo.RoleRepository;
import com.axelor.inject.Beans;
import com.axelor.meta.db.MetaAttrs;
import com.axelor.studio.bpm.service.WkfCommonService;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.WkfTaskConfig;
import com.axelor.studio.db.WkfTaskMenu;
import com.axelor.studio.db.WkfTaskMenuContext;
import com.axelor.studio.db.repo.WkfTaskConfigRepository;
import com.axelor.studio.db.repo.WkfTaskMenuContextRepository;
import com.axelor.studio.db.repo.WkfTaskMenuRepository;
import com.google.inject.Inject;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.camunda.bpm.engine.impl.bpmn.parser.BpmnParser;
import org.camunda.bpm.model.bpmn.BpmnModelInstance;
import org.camunda.bpm.model.bpmn.instance.Activity;
import org.camunda.bpm.model.bpmn.instance.CatchEvent;
import org.camunda.bpm.model.bpmn.instance.ConditionalEventDefinition;
import org.camunda.bpm.model.bpmn.instance.EndEvent;
import org.camunda.bpm.model.bpmn.instance.ExtensionElements;
import org.camunda.bpm.model.bpmn.instance.FlowNode;
import org.camunda.bpm.model.bpmn.instance.Process;
import org.camunda.bpm.model.xml.impl.ModelBuilderImpl;
import org.camunda.bpm.model.xml.instance.ModelElementInstance;
import org.camunda.bpm.model.xml.type.ModelElementType;

public class WkfNodeService {

  @Inject protected MetaAttrsService metaAttrsService;

  @Inject protected WkfTaskConfigRepository wkfConfigRepository;

  @Inject protected WkfTaskMenuRepository wkfTaskMenuRepo;

  @Inject protected WkfMenuService wkfMenuService;

  @Inject protected RoleRepository roleRepo;

  @Inject protected WkfTaskMenuContextRepository taskMenuContextRepo;

  public List<MetaAttrs> extractNodes(
      WkfModel wkfModel, BpmnModelInstance bpmInstance, Map<String, String> processMap) {

    Map<String, WkfTaskConfig> configMap = new HashMap<>();
    if (wkfModel.getWkfTaskConfigList() != null) {
      for (WkfTaskConfig config : wkfModel.getWkfTaskConfigList()) {
        configMap.put(config.getName(), config);
      }
    }

    List<MetaAttrs> metaAttrsList = new ArrayList<MetaAttrs>();

    Collection<FlowNode> activities = new ArrayList<FlowNode>();
    activities.addAll(bpmInstance.getModelElementsByType(Activity.class));
    activities.addAll(bpmInstance.getModelElementsByType(CatchEvent.class));
    activities.addAll(bpmInstance.getModelElementsByType(EndEvent.class));

    if (activities != null) {
      for (FlowNode activity : activities) {
        WkfTaskConfig config = updateTaskConfig(wkfModel, configMap, metaAttrsList, activity);
        Process process = findProcess(activity);
        if (process != null) {
          config.setProcessId(processMap.get(process.getId()));
        }
        updateMenus(config, false);
        wkfModel.addWkfTaskConfigListItem(config);
      }
    }

    for (String name : configMap.keySet()) {
      updateMenus(configMap.get(name), true);
      wkfModel.removeWkfTaskConfigListItem(configMap.get(name));
    }

    return metaAttrsList;
  }

  private Process findProcess(FlowNode activity) {

    ModelElementInstance modelElementInstance = activity.getParentElement();

    while (modelElementInstance != null) {
      if (modelElementInstance instanceof Process) {
        return (Process) modelElementInstance;
      }
      modelElementInstance = modelElementInstance.getParentElement();
    }

    return null;
  }

  public WkfTaskConfig updateTaskConfig(
      WkfModel wkfModel,
      Map<String, WkfTaskConfig> configMap,
      List<MetaAttrs> metaAttrsList,
      FlowNode activity) {

    WkfTaskConfig config;

    if (configMap.containsKey(activity.getId())) {
      config = configMap.get(activity.getId());
      configMap.remove(activity.getId());
    } else {
      config = new WkfTaskConfig();
      config.setName(activity.getId());
      wkfConfigRepository.save(config);
    }
    config.setDescription(activity.getName());
    config.setType(activity.getElementType().getTypeName());
    config.setButton(null);
    config.setExpression(null);
    config =
        (WkfTaskConfig)
            Beans.get(WkfCommonService.class)
                .addProperties(WkfPropertyMapper.FIELD_MAP, config, activity);

    Collection<ConditionalEventDefinition> childConditionalEvents =
        activity.getChildElementsByType(ConditionalEventDefinition.class);
    if (childConditionalEvents != null && !childConditionalEvents.isEmpty()) {
      ConditionalEventDefinition conditionalEventDefinition =
          childConditionalEvents.iterator().next();
      String variable = conditionalEventDefinition.getCamundaVariableName();
      if (variable != null) {
        config.setButton(variable);
      }
    }

    ExtensionElements extensionElements = activity.getExtensionElements();
    if (extensionElements != null) {
      computeTaskMenu(extensionElements, config);

      for (ModelElementInstance modelElementInstance : extensionElements.getElements()) {
        metaAttrsList.addAll(
            metaAttrsService.createMetaAttrs(
                activity.getId(), modelElementInstance, config, wkfModel.getId().toString()));
      }
    }

    return config;
  }

  private void computeTaskMenu(ExtensionElements extensionElements, WkfTaskConfig config) {

    Map<String, WkfTaskMenu> menuMap = new HashMap<>();
    if (CollectionUtils.isNotEmpty(config.getWkfTaskMenuList())) {
      for (WkfTaskMenu menu : config.getWkfTaskMenuList()) {
        menuMap.put(menu.getMenuId(), menu);
      }
    }

    ModelElementInstance menusElement =
        extensionElements.getUniqueChildElementByNameNs(
            BpmnParser.CAMUNDA_BPMN_EXTENSIONS_NS, "menus");

    if (menusElement != null) {
      ModelBuilderImpl builderImpl = new ModelBuilderImpl(null);
      ModelElementType menuElementType =
          builderImpl.defineGenericType("menu", BpmnParser.CAMUNDA_BPMN_EXTENSIONS_NS);

      Collection<ModelElementInstance> menuElements =
          menusElement.getChildElementsByType(menuElementType);

      for (ModelElementInstance menu : menuElements) {
        WkfTaskMenu wkfTaskMenu = updateTaskMenu(menu, menuMap, builderImpl);
        config.addWkfTaskMenuListItem(wkfTaskMenu);
      }
    }

    for (String menuId : menuMap.keySet()) {
      wkfMenuService.removeMenu(menuMap.get(menuId));
      config.removeWkfTaskMenuListItem(menuMap.get(menuId));
    }
  }

  private WkfTaskMenu updateTaskMenu(
      ModelElementInstance menu, Map<String, WkfTaskMenu> menuMap, ModelBuilderImpl builderImpl) {

    WkfTaskMenu taskMenu;

    String menuId = menu.getAttributeValueNs(BpmnParser.CAMUNDA_BPMN_EXTENSIONS_NS, "menuId");
    String isUserMenu =
        menu.getAttributeValueNs(BpmnParser.CAMUNDA_BPMN_EXTENSIONS_NS, "isUserMenu");

    menuId =
        StringUtils.isNotEmpty(menuId)
                && StringUtils.isNotEmpty(isUserMenu)
                && isUserMenu.equals("true")
            ? WkfMenuService.USER_MENU_PREFIX + menuId
            : WkfMenuService.MENU_PREFIX + menuId;

    if (menuMap.containsKey(menuId)) {
      taskMenu = menuMap.get(menuId);
      menuMap.remove(menuId);
    } else {
      String menuName = menu.getAttributeValueNs(BpmnParser.CAMUNDA_BPMN_EXTENSIONS_NS, "menuName");
      taskMenu = new WkfTaskMenu();
      taskMenu.setMenuId(menuId);
      taskMenu.setMenuName(menuName);
      wkfTaskMenuRepo.save(taskMenu);
    }

    taskMenu =
        (WkfTaskMenu)
            Beans.get(WkfCommonService.class)
                .addProperties(WkfPropertyMapper.MENU_PROPERTIES, taskMenu, menu);

    Set<Role> roleSet = null;
    String roles = menu.getAttributeValueNs(BpmnParser.CAMUNDA_BPMN_EXTENSIONS_NS, "roles");
    if (!StringUtils.isEmpty(roles)) {
      roleSet = new HashSet<>();
      String[] roleArr = roles.split(",");
      for (String roleName : roleArr) {
        Role role = roleRepo.findByName(roleName);
        if (role == null) {
          continue;
        }
        roleSet.add(role);
      }
    }
    taskMenu.setRoleSet(roleSet);

    computeMenuContext(menu, taskMenu, builderImpl);

    return taskMenu;
  }

  private void computeMenuContext(
      ModelElementInstance menu, WkfTaskMenu taskMenu, ModelBuilderImpl builderImpl) {

    Map<String, WkfTaskMenuContext> contextMap = new HashMap<>();
    if (CollectionUtils.isNotEmpty(taskMenu.getWkfTaskMenuContextList())) {
      for (WkfTaskMenuContext context : taskMenu.getWkfTaskMenuContextList()) {
        contextMap.put(context.getKey(), context);
      }
    }

    ModelElementType menuContextType =
        builderImpl.defineGenericType("context", BpmnParser.CAMUNDA_BPMN_EXTENSIONS_NS);

    Collection<ModelElementInstance> menuContexts = menu.getChildElementsByType(menuContextType);

    if (menuContexts != null && menuContexts.size() > 0) {
      taskMenu.clearWkfTaskMenuContextList();
      for (ModelElementInstance context : menuContexts) {
        WkfTaskMenuContext menuContext = updateMenuContext(context, contextMap);
        taskMenu.addWkfTaskMenuContextListItem(menuContext);
      }
    }

    for (String key : contextMap.keySet()) {
      taskMenu.removeWkfTaskMenuContextListItem(contextMap.get(key));
    }
  }

  private WkfTaskMenuContext updateMenuContext(
      ModelElementInstance context, Map<String, WkfTaskMenuContext> contextMap) {
    WkfTaskMenuContext menuContext = null;

    String key = context.getAttributeValueNs(BpmnParser.CAMUNDA_BPMN_EXTENSIONS_NS, "key");
    if (contextMap.containsKey(key)) {
      menuContext = contextMap.get(key);
      contextMap.remove(key);
    } else {
      menuContext = new WkfTaskMenuContext();
      menuContext.setKey(key);
      taskMenuContextRepo.save(menuContext);
    }

    String value = context.getTextContent();
    menuContext.setValue(value);

    return menuContext;
  }

  private void updateMenus(WkfTaskConfig taskConfig, boolean remove) {

    if (!remove) {
      wkfMenuService.createOrUpdateMenu(taskConfig);
    } else {
      wkfMenuService.removeMenu(taskConfig);
    }
  }
}
