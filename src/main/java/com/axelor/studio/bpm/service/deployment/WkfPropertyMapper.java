/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.deployment;

import java.util.HashMap;
import java.util.Map;

public class WkfPropertyMapper {

  public static final Map<String, String> FIELD_MAP = new HashMap<>();

  static {
    FIELD_MAP.put("createTask", "createUserAction");
    FIELD_MAP.put("roleName", "taskRole");
    FIELD_MAP.put("roleType", "roleType");
    FIELD_MAP.put("roleFieldPath", "roleFieldPath");
    FIELD_MAP.put("taskEmailTitle", "taskName");
    FIELD_MAP.put("taskNameType", "taskNameType");
    FIELD_MAP.put("userPath", "userFieldPath");
    FIELD_MAP.put("userFieldType", "userFieldType");
    FIELD_MAP.put("deadlineFieldPath", "deadlineFieldPath");
    FIELD_MAP.put("deadlineFieldType", "deadlineFieldType");
    FIELD_MAP.put("notificationEmail", "emailNotification");
    FIELD_MAP.put("emailEvent", "emailEvent");
    FIELD_MAP.put("modelName", "metaModel");
    FIELD_MAP.put("jsonModelName", "metaJsonModel");
    FIELD_MAP.put("displayStatus", "displayStatus");
    FIELD_MAP.put("displayOnModels", "displayOnModels");
    FIELD_MAP.put("expression", "completedIf");
    FIELD_MAP.put("button", "buttons");
    FIELD_MAP.put("defaultForm", "defaultForm");
    FIELD_MAP.put("templateName", "template");
    FIELD_MAP.put("helpText", "help");
    FIELD_MAP.put("callModel", "model");
    FIELD_MAP.put("callLink", "parentPath");
    FIELD_MAP.put("callLinkCondition", "condition");
    FIELD_MAP.put("teamPath", "teamFieldPath");
    FIELD_MAP.put("teamFieldType", "teamFieldType");
    FIELD_MAP.put("taskPriority", "taskPriority");
    FIELD_MAP.put("taskPriorityType", "priorityType");
    FIELD_MAP.put("description", "description");
    FIELD_MAP.put("descriptionType", "descriptionType");
    FIELD_MAP.put("duration", "duration");
    FIELD_MAP.put("durationType", "durationType");
  }

  protected static final Map<String, String> PROCESS_DISPLAY_PROPERTIES = new HashMap<>();

  static {
    PROCESS_DISPLAY_PROPERTIES.put("displayStatus", "displayStatus");
    PROCESS_DISPLAY_PROPERTIES.put("displayOnModels", "displayOnModels");
    PROCESS_DISPLAY_PROPERTIES.put("onlyOnClientChange", "onlyOnClientChange");
  }

  protected static final Map<String, String> PROCESS_CONFIG_PROPERTIES = new HashMap<>();

  static {
    PROCESS_CONFIG_PROPERTIES.put("title", "title");
    PROCESS_CONFIG_PROPERTIES.put("metaModel", "metaModel");
    PROCESS_CONFIG_PROPERTIES.put("metaJsonModel", "metaJsonModel");
    PROCESS_CONFIG_PROPERTIES.put("processPath", "processPath");
    PROCESS_CONFIG_PROPERTIES.put("pathCondition", "pathCondition");
    PROCESS_CONFIG_PROPERTIES.put("model", "model");
    PROCESS_CONFIG_PROPERTIES.put("isStartModel", "isStartModel");
    PROCESS_CONFIG_PROPERTIES.put("isDirectCreation", "isDirectCreation");
  }

  protected static final Map<String, String> MENU_PROPERTIES = new HashMap<>();

  static {
    MENU_PROPERTIES.put("menuName", "menuName");
    MENU_PROPERTIES.put("parentMenuName", "menuParent");
    MENU_PROPERTIES.put("menuPosition", "position");
    MENU_PROPERTIES.put("positionMenuName", "positionMenu");
    MENU_PROPERTIES.put("userNewMenu", "isUserMenu");
    MENU_PROPERTIES.put("formView", "formView");
    MENU_PROPERTIES.put("gridView", "gridView");
    MENU_PROPERTIES.put("displayTagCount", "tagCount");
    MENU_PROPERTIES.put("permanentMenu", "permanent");
    MENU_PROPERTIES.put("domain", "domain");
  }
}
