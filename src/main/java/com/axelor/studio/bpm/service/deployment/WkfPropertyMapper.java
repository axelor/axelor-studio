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

import java.util.HashMap;
import java.util.Map;

public class WkfPropertyMapper {

  public static final Map<String, String> FIELD_MAP = new HashMap<String, String>();

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
    FIELD_MAP.put("deadlineType", "deadlineType");
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

  protected static final Map<String, String> PROCESS_DISPLAY_PROPERTIES =
      new HashMap<String, String>();

  static {
    PROCESS_DISPLAY_PROPERTIES.put("displayStatus", "displayStatus");
    PROCESS_DISPLAY_PROPERTIES.put("displayOnModels", "displayOnModels");
  }

  protected static final Map<String, String> PROCESS_CONFIG_PROPERTIES =
      new HashMap<String, String>();

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

  protected static final Map<String, String> MENU_PROPERTIES = new HashMap<String, String>();

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
