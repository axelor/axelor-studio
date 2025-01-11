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
package com.axelor.studio.exception;

public final class StudioExceptionMessage {

  private StudioExceptionMessage() {}

  /** Check if studio app code is not conflicting with existing app. */
  public static final String STUDIO_APP_1 = /*$$(*/
      "Please provide unique code. The code '%s' is already used" /*)*/;

  /** Check if chart name doesn't contain any space. */
  public static final String STUDIO_CHART_1 = /*$$(*/ "The name must not contain spaces" /*)*/;

  public static final String CANNOT_ALTER_NODES = /*$$(*/
      "Can't alter nodes for real existing selection field" /*)*/;

  public static final String DEMO_DATA_SUCCESS = /*$$(*/ "Demo data loaded successfully" /*)*/;

  public static final String NO_CONFIG_REQUIRED = /*$$(*/ "No configuration required" /*)*/;

  public static final String BULK_INSTALL_SUCCESS = /*$$(*/ "Apps installed successfully" /*)*/;

  public static final String REFRESH_APP_SUCCESS = /*$$(*/ "Apps refreshed successfully" /*)*/;

  public static final String REFRESH_APP_ERROR = /*$$(*/ "Error in refreshing app" /*)*/;

  public static final String ROLE_IMPORT_SUCCESS = /*$$(*/ "Roles imported successfully" /*)*/;

  public static final String NO_LANGUAGE_SELECTED = /*$$(*/
      "No application language set. Please set 'application.locale' property." /*)*/;

  public static final String FILE_UPLOAD_DIR_ERROR = /*$$(*/
      "File upload path not configured" /*)*/;

  public static final String APP_IN_USE = /*$$(*/
      "This app is used by %s. Please deactivate them before continue." /*)*/;

  public static final String DATA_EXPORT_DIR_ERROR = /*$$(*/ "Export path not configured" /*)*/;

  public static final String SELECT_STUDIO_APP_EXPORT = /*$$(*/
      "Please select the App(s) to export" /*)*/;

  public static final String SUCCESS_STUDIO_APP_IMPORT = /*$$(*/ "Apps imported successfully" /*)*/;

  public static final String STUDIO_APP_IN_REF = /*$$(*/
      "This App is in referenced. Please unlink it before continue." /*)*/;

  // Studio
  public static final String STUDIO_TAB_PANEL = /*$$(*/ "Tab panel" /*)*/;
  public static final String STUDIO_SPACER = /*$$(*/ "Spacer" /*)*/;
  public static final String STUDIO_MANY_TO_MANY = /*$$(*/ "Many to many" /*)*/;
  public static final String STUDIO_ONE_TO_MANY = /*$$(*/ "One to many" /*)*/;
  public static final String STUDIO_MANY_TO_ONE = /*$$(*/ "Many to one" /*)*/;
  public static final String STUDIO_TIME = /*$$(*/ "Time" /*)*/;
  public static final String STUDIO_DATE = /*$$(*/ "Date" /*)*/;
  public static final String STUDIO_DATE_TIME = /*$$(*/ "Date time" /*)*/;
  public static final String STUDIO_BOOLEAN = /*$$(*/ "Boolean" /*)*/;
  public static final String STUDIO_DECIMAL = /*$$(*/ "Decimal" /*)*/;
  public static final String STUDIO_INTEGER = /*$$(*/ "Integer" /*)*/;
  public static final String STUDIO_STRING = /*$$(*/ "String" /*)*/;
  public static final String STUDIO_TABS = /*$$(*/ "Tabs" /*)*/;
  public static final String STUDIO_SELECTION_OR_SELECTION_OPTIONS_ARE_REQUIRED = /*$$(*/
      "Selection or selection options are required" /*)*/;
  public static final String STUDIO_ADD_TAB = /*$$(*/ "Add tab" /*)*/;
  public static final String STUDIO_ALERT = /*$$(*/ "Alert" /*)*/;
  public static final String STUDIO_ALL_OPTIONS_AND_SELECTION_WILL_BE_LOST_ARE_YOU_SURE = /*$$(*/
      "All options and selection will be lost. Are you sure ?" /*)*/;
  public static final String STUDIO_ARE_YOU_SURE_YOU_WANT_TO_CLOSE_THE_TAB = /*$$(*/
      "Are you sure you want to close the tab?" /*)*/;
  public static final String STUDIO_ARE_YOU_SURE_DO_YOU_WANT_TO_DELETE_TRANSLATIONS = /*$$(*/
      "Are you sure, do you want to delete translations?" /*)*/;
  public static final String STUDIO_ARE_YOU_SURE_DO_YOU_WANT_TO_DELETE_IT = /*$$(*/
      "Are you sure? Do you want to delete it?" /*)*/;
  public static final String STUDIO_AT_LEAST_ONE_CHILDREN_REQUIRED = /*$$(*/
      "At least one children required" /*)*/;
  public static final String STUDIO_AT_LEAST_ONE_MENU_ITEM_REQUIRED = /*$$(*/
      "At least one menu item required" /*)*/;
  public static final String STUDIO_CLOSE = /*$$(*/ "Close" /*)*/;
  public static final String STUDIO_CONFIRM = /*$$(*/ "Confirm" /*)*/;
  public static final String
      STUDIO_CURRENT_CHANGES_WILL_BE_LOST_DO_YOU_REALLY_WANT_TO_PROCEED = /*$$(*/
          "Current changes will be lost. Do you really want to proceed?" /*)*/;
  public static final String STUDIO_CUSTOM = /*$$(*/ "Custom" /*)*/;
  public static final String STUDIO_CUSTOM_FIELDS = /*$$(*/ "Custom fields" /*)*/;
  public static final String STUDIO_DELETE_CONFIRMATION = /*$$(*/ "Delete Confirmation" /*)*/;
  public static final String STUDIO_FIELD_NAME_SHOULD_BE_UNIQUE = /*$$(*/
      "Field name should be unique" /*)*/;
  public static final String STUDIO_FORM_WIDTH = /*$$(*/ "Form width" /*)*/;
  public static final String STUDIO_MODEL_NAME_SHOULD_BE_UNIQUE = /*$$(*/
      "Model name should be unique" /*)*/;
  public static final String STUDIO_NO_DATA_FOUND = /*$$(*/ "No data found" /*)*/;
  public static final String STUDIO_NEW = /*$$(*/ "New" /*)*/;
  public static final String STUDIO_NEW_SELECTION = /*$$(*/ "New selection" /*)*/;
  public static final String STUDIO_NO_FIELDS_AVAILABLE = /*$$(*/ "No fields available" /*)*/;
  public static final String STUDIO_OK = /*$$(*/ "OK" /*)*/;
  public static final String STUDIO_ON_CLICK = /*$$(*/ "On click" /*)*/;
  public static final String STUDIO_ON_NEW = /*$$(*/ "On new" /*)*/;
  public static final String STUDIO_ON_SAVE = /*$$(*/ "On save" /*)*/;
  public static final String STUDIO_ORDER_BY = /*$$(*/ "Order by" /*)*/;
  public static final String STUDIO_COMPUTED = /*$$(*/ "Computed" /*)*/;
  public static final String STUDIO_EXTENSION = /*$$(*/ "Extension" /*)*/;
  public static final String STUDIO_CANCEL = /*$$(*/ "Cancel" /*)*/;
  public static final String STUDIO_PLEASE_ENTER_FORM_NAME_AND_TITLE = /*$$(*/
      "Please enter form name and title" /*)*/;
  public static final String STUDIO_PRECISION = /*$$(*/ "Precision" /*)*/;
  public static final String STUDIO_PROPERTIES = /*$$(*/ "Properties" /*)*/;
  public static final String STUDIO_REMOVE_WIDGET = /*$$(*/ "Remove widget" /*)*/;
  public static final String STUDIO_REQUIRED = /*$$(*/ "required" /*)*/;
  public static final String STUDIO_SEARCH = /*$$(*/ "Search" /*)*/;
  public static final String STUDIO_SELECTION_ITEMS = /*$$(*/ "Selection items" /*)*/;
  public static final String STUDIO_SHOW_MORE = /*$$(*/ "Show more..." /*)*/;
  public static final String STUDIO_SOME_ERROR_OCCURRED = /*$$(*/ "Some error occurred" /*)*/;
  public static final String STUDIO_REALLY_WANT_TO_DELETE = /*$$(*/
      "Do you really want to delete?" /*)*/;
  public static final String STUDIO_TAB = /*$$(*/ "Tab" /*)*/;
  public static final String STUDIO_TABS_SHOULD_HAVE_AT_LEAST_ONE_PANEL = /*$$(*/
      "Tabs should have at least one panel" /*)*/;
  public static final String STUDIO_SCALE = /*$$(*/ "Scale" /*)*/;
  public static final String STUDIO_VALUE_IS_REQUIRED = /*$$(*/ "Value is required" /*)*/;
  public static final String STUDIO_VIEW = /*$$(*/ "View" /*)*/;
  public static final String STUDIO_VIEW_NAME_ALREADY_EXISTS = /*$$(*/
      "View name already exists" /*)*/;
  public static final String STUDIO_NO = /*$$(*/ "No" /*)*/;
  public static final String STUDIO_YES = /*$$(*/ "Yes" /*)*/;
  public static final String STUDIO_SELECTION = /*$$(*/ "Selection" /*)*/;
  public static final String STUDIO_UNIQUE_CONSTRAINT_VIOLATION = /*$$(*/
      "Unique constraint violation" /*)*/;
  public static final String STUDIO_FIELD_NAME_SHOULD_BE_UNIQUE_CHECK = /*$$(*/
      "Field name should be unique. Check" /*)*/;
  public static final String STUDIO_ITEM = /*$$(*/ "item" /*)*/;
  public static final String STUDIO_MODEL_ACTIONS = /*$$(*/ "Model actions" /*)*/;
  public static final String STUDIO_GLOBAL_ACTIONS = /*$$(*/ "Global actions" /*)*/;
  public static final String STUDIO_OTHER_ACTIONS = /*$$(*/ "Other actions" /*)*/;
  public static final String STUDIO_WHITE = /*$$(*/ "White" /*)*/;
  public static final String STUDIO_YELLOW = /*$$(*/ "Yellow" /*)*/;
  public static final String STUDIO_PURPLE = /*$$(*/ "Purple" /*)*/;
  public static final String STUDIO_DEEP_PURPLE = /*$$(*/ "Deep Purple" /*)*/;
  public static final String STUDIO_PINK = /*$$(*/ "Pink" /*)*/;
  public static final String STUDIO_RED = /*$$(*/ "Red" /*)*/;
  public static final String STUDIO_GREEN = /*$$(*/ "Green" /*)*/;
  public static final String STUDIO_GREY = /*$$(*/ "Grey" /*)*/;
  public static final String STUDIO_HILITE = /*$$(*/ "hilite" /*)*/;
  public static final String STUDIO_INDIGO = /*$$(*/ "Indigo" /*)*/;
  public static final String STUDIO_LIGHT_BLUE = /*$$(*/ "Light Blue" /*)*/;
  public static final String STUDIO_LIGHT_GREEN = /*$$(*/ "Light Green" /*)*/;
  public static final String STUDIO_ORANGE = /*$$(*/ "Orange" /*)*/;
  public static final String STUDIO_LIME = /*$$(*/ "Lime" /*)*/;
  public static final String STUDIO_CYAN = /*$$(*/ "Cyan" /*)*/;
  public static final String STUDIO_DEEP_ORANGE = /*$$(*/ "Deep Orange" /*)*/;
  public static final String STUDIO_TEAL = /*$$(*/ "Teal" /*)*/;
  public static final String STUDIO_BLACK = /*$$(*/ "Black" /*)*/;
  public static final String STUDIO_BLUE = /*$$(*/ "Blue" /*)*/;
  public static final String STUDIO_BLUE_GREY = /*$$(*/ "Blue Grey" /*)*/;
  public static final String STUDIO_BROWN = /*$$(*/ "Brown" /*)*/;
  public static final String STUDIO_AMBER = /*$$(*/ "Amber" /*)*/;
  public static final String STUDIO_UNIQUE = /*$$(*/ "unique" /*)*/;
  public static final String STUDIO_ARE_YOU_SURE = /*$$(*/ "Are you sure?" /*)*/;
  public static final String STUDIO_NAME_COLUMN = /*$$(*/ "Name column" /*)*/;
  public static final String STUDIO_ICON = /*$$(*/ "Icon" /*)*/;
  public static final String STUDIO_CAN_COLLAPSE = /*$$(*/ "Can Collapse" /*)*/;
  public static final String STUDIO_COLLAPSE_IF = /*$$(*/ "Collapse If" /*)*/;
  public static final String STUDIO_GENERATE_MENU = /*$$(*/ "Generate menu" /*)*/;
  public static final String STUDIO_NAME = /*$$(*/ "Name" /*)*/;
  public static final String STUDIO_FIRST_LETTER_OF_THE_NAME_SHOULD_ALWAYS_BE_ALPHABET = /*$$(*/
      "First Letter of the name should always be alphabet" /*)*/;
  public static final String STUDIO_TYPE = /*$$(*/ "Type" /*)*/;
  public static final String STUDIO_TITLE = /*$$(*/ "Title" /*)*/;
  public static final String STUDIO_DEFAULT_VALUE = /*$$(*/ "Default value" /*)*/;
  public static final String STUDIO_APP_NAME = /*$$(*/ "App name" /*)*/;
  public static final String STUDIO_HELP = /*$$(*/ "Help" /*)*/;
  public static final String STUDIO_SEQUENCE = /*$$(*/ "Sequence" /*)*/;
  public static final String STUDIO_ROLES = /*$$(*/ "Roles" /*)*/;
  public static final String STUDIO_VALUE_EXPR = /*$$(*/ "Value expr" /*)*/;
  public static final String STUDIO_WIDGET = /*$$(*/ "Widget" /*)*/;
  public static final String STUDIO_ON_CHANGE = /*$$(*/ "On change" /*)*/;
  public static final String STUDIO_ON_LOAD = /*$$(*/ "On load" /*)*/;
  public static final String STUDIO_MIN = /*$$(*/ "Min" /*)*/;
  public static final String STUDIO_MAX = /*$$(*/ "Max" /*)*/;
  public static final String STUDIO_IS_JSON_RELATIONAL_FIELD = /*$$(*/
      "Is json relational field" /*)*/;
  public static final String STUDIO_DOMAIN = /*$$(*/ "Domain" /*)*/;
  public static final String STUDIO_PROMPT = /*$$(*/ "Prompt" /*)*/;
  public static final String STUDIO_SELECTION_IN = /*$$(*/ "Selection in" /*)*/;
  public static final String STUDIO_VALUE = /*$$(*/ "Value" /*)*/;
  public static final String STUDIO_VALUE_ADD = /*$$(*/ "Value:add" /*)*/;
  public static final String STUDIO_VALUE_DEL = /*$$(*/ "Value:del" /*)*/;
  public static final String STUDIO_REFRESH = /*$$(*/ "Refresh" /*)*/;
  public static final String STUDIO_ACTIVE = /*$$(*/ "Active" /*)*/;
  public static final String STUDIO_TARGET_JSON_MODEL = /*$$(*/ "Target json model" /*)*/;
  public static final String STUDIO_TARGET_MODEL = /*$$(*/ "Target model" /*)*/;
  public static final String STUDIO_GRID_VIEW = /*$$(*/ "Grid view" /*)*/;
  public static final String STUDIO_FORM_VIEW = /*$$(*/ "Form view" /*)*/;
  public static final String STUDIO_REQUIRED_CAPS = /*$$(*/ "Required" /*)*/;
  public static final String STUDIO_COLUMN_SEQUENCE = /*$$(*/ "Column sequence" /*)*/;
  public static final String STUDIO_READONLY = /*$$(*/ "Readonly" /*)*/;
  public static final String STUDIO_HIDDEN = /*$$(*/ "Hidden" /*)*/;
  public static final String STUDIO_VISIBLE_IN_GRID = /*$$(*/ "Visible in grid" /*)*/;
  public static final String STUDIO_SHOW_IF = /*$$(*/ "Show if" /*)*/;
  public static final String STUDIO_HIDE_IF = /*$$(*/ "Hide if" /*)*/;
  public static final String STUDIO_IF = /*$$(*/ "If" /*)*/;
  public static final String STUDIO_REQUIRED_IF = /*$$(*/ "Required if" /*)*/;
  public static final String STUDIO_READONLY_IF = /*$$(*/ "Readonly if" /*)*/;
  public static final String STUDIO_INCLUDE_IF = /*$$(*/ "Include if" /*)*/;
  public static final String STUDIO_VALID_IF = /*$$(*/ "Valid if" /*)*/;
  public static final String STUDIO_ONLY_IF = /*$$(*/ "Only if" /*)*/;
  public static final String STUDIO_CAN_SAVE = /*$$(*/ "Can save" /*)*/;
  public static final String STUDIO_CSS = /*$$(*/ "Css" /*)*/;
  public static final String STUDIO_EDITABLE = /*$$(*/ "Editable" /*)*/;
  public static final String STUDIO_COLSPAN = /*$$(*/ "Colspan" /*)*/;
  public static final String STUDIO_ITEMSPAN = /*$$(*/ "Itemspan" /*)*/;
  public static final String STUDIO_MENU_TITLE = /*$$(*/ "Menu title" /*)*/;
  public static final String STUDIO_PARENT = /*$$(*/ "Parent" /*)*/;
  public static final String STUDIO_SHOW_TITLE = /*$$(*/ "Show title" /*)*/;
  public static final String STUDIO_CAN_SEARCH = /*$$(*/ "Can search" /*)*/;
  public static final String STUDIO_IF_MODULE = /*$$(*/ "If-module" /*)*/;
  public static final String STUDIO_HEIGHT = /*$$(*/ "Height" /*)*/;
  public static final String STUDIO_ACTION = /*$$(*/ "Action" /*)*/;
  public static final String STUDIO_FIELD = /*$$(*/ "Field" /*)*/;
  public static final String STUDIO_CAN_MOVE = /*$$(*/ "Can move" /*)*/;
  public static final String STUDIO_FROM = /*$$(*/ "From" /*)*/;
  public static final String STUDIO_SIDEBAR = /*$$(*/ "Sidebar" /*)*/;
  public static final String STUDIO_PASSWORD = /*$$(*/ "Password" /*)*/;
  public static final String STUDIO_MODEL = /*$$(*/ "Model" /*)*/;
  public static final String STUDIO_COLOR = /*$$(*/ "Color" /*)*/;
  public static final String STUDIO_BACKGROUND = /*$$(*/ "Background" /*)*/;
  public static final String STUDIO_STRONG = /*$$(*/ "Strong" /*)*/;
  public static final String STUDIO_MAIN_PANEL_IS_REQUIRED_TO_HAVE_SIDE_PANELS = /*$$(*/
      "Main panel is required to have side panels" /*)*/;
  public static final String STUDIO_QUESTION = /*$$(*/ "Question" /*)*/;
  public static final String STUDIO_LABEL = /*$$(*/ "Label" /*)*/;
  public static final String STUDIO_BUTTON = /*$$(*/ "Button" /*)*/;
  public static final String STUDIO_SEPARATOR = /*$$(*/ "Separator" /*)*/;
  public static final String STUDIO_PANEL = /*$$(*/ "Panel" /*)*/;
  public static final String STUDIO_ADD = /*$$(*/ "Add" /*)*/;
  public static final String STUDIO_ADD_NEW = /*$$(*/ "Add new" /*)*/;
  public static final String STUDIO_TOOLBAR = /*$$(*/ "Toolbar" /*)*/;
  public static final String STUDIO_MENUBAR = /*$$(*/ "Menubar" /*)*/;
  public static final String STUDIO_BPM_SOURCE_IMPORT_NOT_ALLOWED = /*$$(*/
      "Bpm import from sources is not allowed" /*)*/;
  public static final String STUDIO_MULTIPLE_BPM_FILES = /*$$(*/
      "Multiple BPM files with the code %s are defined in sources" /*)*/;
  public static final String STUDIO_NO_BPM_FILE = /*$$(*/
      "No BPM files with the code %s is defined in sources" /*)*/;
}
