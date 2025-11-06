/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.exception;

public final class BpmExceptionMessage {

  private BpmExceptionMessage() {}

  public static final String MISSING_INPUT_LABEL = /*$$(*/ "Missing input label" /*)*/;

  public static final String MISSING_OUTPUT_LABEL = /*$$(*/ "Missing output label" /*)*/;

  public static final String INVALID_IMPORT_FILE = /*$$(*/ "Data file must be excel file" /*)*/;

  public static final String INVALID_HEADER = /*$$(*/ "Header is invalid in import file" /*)*/;

  public static final String EMPTY_OUTPUT_COLUMN = /*$$(*/
      "Output columns can't be empty in import file" /*)*/;

  public static final String NO_WKF_MODEL_IMPORTED = /*$$(*/ "No wkf model was imported." /*)*/;

  public static final String NODE_IDS = /*$$(*/ "Node ids" /*)*/;

  public static final String BPM_MODEL = /*$$(*/ "BPM model" /*)*/;

  public static final String PROCESS_INSTANCE_ID = /*$$(*/ "Process instance id" /*)*/;

  public static final String BPM_ERROR = /*$$(*/ "BPM error" /*)*/;

  public static final String MIGRATION_DONE = /*$$(*/ "Migration done successfully" /*)*/;

  public static final String MIGRATION_ERR = /*$$(*/ "Migration error" /*)*/;

  public static final String CANT_RESTART_INACTIVE_PROCESS = /*$$(*/
      "Can't restart inactive process" /*)*/;

  public static final String INFINITE_EXECUTION = /*$$(*/ "Infinite loop execution suspected"; /*)*/

  // BPM studio
  public static final String BPM_STUDIO_TEXT = /*$$(*/ "Text" /*)*/;
  public static final String BPM_STUDIO_ENABLE = /*$$(*/ "Enable" /*)*/;
  public static final String BPM_STUDIO_CONNECTOR_SCRIPT = /*$$(*/ "Connector script" /*)*/;
  public static final String BPM_STUDIO_CONNECTOR = /*$$(*/ "Connector" /*)*/;
  public static final String BPM_STUDIO_REQUEST = /*$$(*/ "Request" /*)*/;
  public static final String BPM_STUDIO_REQUEST_VARIABLE = /*$$(*/ "Request variable" /*)*/;
  public static final String BPM_STUDIO_RESULT_VARIABLE = /*$$(*/ "Result variable" /*)*/;
  public static final String BPM_STUDIO_RETURN_VARIABLE = /*$$(*/ "Return variable" /*)*/;
  public static final String BPM_STUDIO_RETURN_EXPRESSION = /*$$(*/ "Return expression" /*)*/;
  public static final String BPM_STUDIO_KEY = /*$$(*/ "Key" /*)*/;
  public static final String BPM_STUDIO_EXPRESSION = /*$$(*/ "Expression" /*)*/;
  public static final String BPM_STUDIO_VALUE = /*$$(*/ "Value" /*)*/;
  public static final String BPM_STUDIO_ADD_PAYLOAD = /*$$(*/ "Add payload" /*)*/;
  public static final String BPM_STUDIO_OK = /*$$(*/ "OK" /*)*/;
  public static final String BPM_STUDIO_CANCEL = /*$$(*/ "Cancel" /*)*/;
  public static final String BPM_STUDIO_EXPORT = /*$$(*/ "Export" /*)*/;
  public static final String BPM_STUDIO_START_EVENT = /*$$(*/ "Start Event" /*)*/;
  public static final String BPM_STUDIO_INTERMEDIATE_THROW_EVENT = /*$$(*/
      "Intermediate Throw Event" /*)*/;
  public static final String BPM_STUDIO_END_EVENT = /*$$(*/ "End Event" /*)*/;
  public static final String BPM_STUDIO_MESSAGE_START_EVENT = /*$$(*/ "Message Start Event" /*)*/;
  public static final String BPM_STUDIO_TIMER_START_EVENT = /*$$(*/ "Timer Start Event" /*)*/;
  public static final String BPM_STUDIO_CONDITIONAL_START_EVENT = /*$$(*/
      "Conditional Start Event" /*)*/;
  public static final String BPM_STUDIO_SIGNAL_START_EVENT = /*$$(*/ "Signal Start Event" /*)*/;
  public static final String BPM_STUDIO_MESSAGE_INTERMEDIATE_CATCH_EVENT = /*$$(*/
      "Message Intermediate Catch Event" /*)*/;
  public static final String BPM_STUDIO_MESSAGE_INTERMEDIATE_THROW_EVENT = /*$$(*/
      "Message Intermediate Throw Event" /*)*/;
  public static final String BPM_STUDIO_TIMER_INTERMEDIATE_CATCH_EVENT = /*$$(*/
      "Timer Intermediate Catch Event" /*)*/;
  public static final String BPM_STUDIO_ESCALATION_INTERMEDIATE_THROW_EVENT = /*$$(*/
      "Escalation Intermediate Throw Event" /*)*/;
  public static final String BPM_STUDIO_CLOSE = /*$$(*/ "Close" /*)*/;
  public static final String BPM_STUDIO_PROCESS_NAME = /*$$(*/ "Process name" /*)*/;
  public static final String BPM_STUDIO_CONDITIONAL_INTERMEDIATE_CATCH_EVENT = /*$$(*/
      "Conditional Intermediate Catch Event" /*)*/;
  public static final String BPM_STUDIO_LINK_INTERMEDIATE_CATCH_EVENT = /*$$(*/
      "Link Intermediate Catch Event" /*)*/;
  public static final String BPM_STUDIO_LINK_INTERMEDIATE_THROW_EVENT = /*$$(*/
      "Link Intermediate Throw Event" /*)*/;
  public static final String BPM_STUDIO_COMPENSATION_INTERMEDIATE_THROW_EVENT = /*$$(*/
      "Compensation Intermediate Throw Event" /*)*/;
  public static final String BPM_STUDIO_SIGNAL_INTERMEDIATE_CATCH_EVENT = /*$$(*/
      "Signal Intermediate Catch Event" /*)*/;
  public static final String BPM_STUDIO_SIGNAL_INTERMEDIATE_THROW_EVENT = /*$$(*/
      "Signal Intermediate Throw Event" /*)*/;
  public static final String BPM_STUDIO_MESSAGE_END_EVENT = /*$$(*/ "Message End Event" /*)*/;
  public static final String BPM_STUDIO_ESCALATION_END_EVENT = /*$$(*/ "Escalation End Event" /*)*/;
  public static final String BPM_STUDIO_ERROR_END_EVENT = /*$$(*/ "Error End Event" /*)*/;
  public static final String BPM_STUDIO_CANCEL_END_EVENT = /*$$(*/ "Cancel End Event" /*)*/;
  public static final String BPM_STUDIO_COMPENSATION_END_EVENT = /*$$(*/
      "Compensation End Event" /*)*/;
  public static final String BPM_STUDIO_SIGNAL_END_EVENT = /*$$(*/ "Signal End Event" /*)*/;
  public static final String BPM_STUDIO_TERMINATE_END_EVENT = /*$$(*/ "Terminate End Event" /*)*/;
  public static final String BPM_STUDIO_EXCLUSIVE_GATEWAY = /*$$(*/ "Exclusive Gateway" /*)*/;
  public static final String BPM_STUDIO_PARALLEL_GATEWAY = /*$$(*/ "Parallel Gateway" /*)*/;
  public static final String BPM_STUDIO_INCLUSIVE_GATEWAY = /*$$(*/ "Inclusive Gateway" /*)*/;
  public static final String BPM_STUDIO_COMPLEX_GATEWAY = /*$$(*/ "Complex Gateway" /*)*/;
  public static final String BPM_STUDIO_EVENT_BASED_GATEWAY = /*$$(*/ "Event based Gateway" /*)*/;
  public static final String BPM_STUDIO_TRANSACTION = /*$$(*/ "Transaction" /*)*/;
  public static final String BPM_STUDIO_EVENT_SUB_PROCESS = /*$$(*/ "Event Sub Process" /*)*/;
  public static final String BPM_STUDIO_SUB_PROCESS = /*$$(*/ "Sub Process" /*)*/;
  public static final String BPM_STUDIO_TASK = /*$$(*/ "Task" /*)*/;
  public static final String BPM_STUDIO_SEND_TASK = /*$$(*/ "Send Task" /*)*/;
  public static final String BPM_STUDIO_RECEIVE_TASK = /*$$(*/ "Receive Task" /*)*/;
  public static final String BPM_STUDIO_USER_TASK = /*$$(*/ "User Task" /*)*/;
  public static final String BPM_STUDIO_MANUAL_TASK = /*$$(*/ "Manual Task" /*)*/;
  public static final String BPM_STUDIO_BUSINESS_RULE_TASK = /*$$(*/ "Business Rule Task" /*)*/;
  public static final String BPM_STUDIO_SERVICE_TASK = /*$$(*/ "Service Task" /*)*/;
  public static final String BPM_STUDIO_SCRIPT_TASK = /*$$(*/ "Script Task" /*)*/;
  public static final String BPM_STUDIO_CALL_ACTIVITY = /*$$(*/ "Call Activity" /*)*/;
  public static final String BPM_STUDIO_COLLAPSED = /*$$(*/ "collapsed" /*)*/;
  public static final String BPM_STUDIO_EXPANDED = /*$$(*/ "expanded" /*)*/;
  public static final String BPM_STUDIO_DATA_STORE_REFERENCE = /*$$(*/ "Data Store Reference" /*)*/;
  public static final String BPM_STUDIO_DATA_OBJECT_REFERENCE = /*$$(*/
      "Data Object Reference" /*)*/;
  public static final String BPM_STUDIO_MESSAGE_BOUNDARY_EVENT = /*$$(*/
      "Message Boundary Event" /*)*/;
  public static final String BPM_STUDIO_TIMER_BOUNDARY_EVENT = /*$$(*/ "Timer Boundary Event" /*)*/;
  public static final String BPM_STUDIO_ESCALATION_BOUNDARY_EVENT = /*$$(*/
      "Escalation Boundary Event" /*)*/;
  public static final String BPM_STUDIO_CONDITIONAL_BOUNDARY_EVENT = /*$$(*/
      "Conditional Boundary Event" /*)*/;
  public static final String BPM_STUDIO_ERROR_BOUNDARY_EVENT = /*$$(*/ "Error Boundary Event" /*)*/;
  public static final String BPM_STUDIO_CANCEL_BOUNDARY_EVENT = /*$$(*/
      "Cancel Boundary Event" /*)*/;
  public static final String BPM_STUDIO_SIGNAL_BOUNDARY_EVENT = /*$$(*/
      "Signal Boundary Event" /*)*/;
  public static final String BPM_STUDIO_LOCAL = /*$$(*/ "Local" /*)*/;
  public static final String BPM_STUDIO_COMPENSATION_BOUNDARY_EVENT = /*$$(*/
      "Compensation Boundary Event" /*)*/;
  public static final String BPM_STUDIO_NON_INTERRUPTING = /*$$(*/ "non-interrupting" /*)*/;
  public static final String BPM_STUDIO_ERROR_START_EVENT = /*$$(*/ "Error Start Event" /*)*/;
  public static final String BPM_STUDIO_ESCALATION_START_EVENT = /*$$(*/
      "Escalation Start Event" /*)*/;
  public static final String BPM_STUDIO_COMMENT = /*$$(*/ "Comment" /*)*/;
  public static final String BPM_STUDIO_COMPENSATION_START_EVENT = /*$$(*/
      "Compensation Start Event" /*)*/;
  public static final String BPM_STUDIO_SEQUENCE_FLOW = /*$$(*/ "Sequence Flow" /*)*/;
  public static final String BPM_STUDIO_DEFAULT_FLOW = /*$$(*/ "Default Flow" /*)*/;
  public static final String BPM_STUDIO_CONDITIONAL_FLOW = /*$$(*/ "Conditional Flow" /*)*/;
  public static final String BPM_STUDIO_EXPANDED_POOL = /*$$(*/ "Expanded Pool" /*)*/;
  public static final String BPM_STUDIO_ASSIGN_OUTPUT_TO_FIELDS = /*$$(*/
      "Assign output to fields" /*)*/;
  public static final String BPM_STUDIO_RELATIONAL_FIELD_SEARCH = /*$$(*/
      "Relational field search" /*)*/;
  public static final String BPM_STUDIO_SEARCH_WITH = /*$$(*/ "Search with" /*)*/;
  public static final String BPM_STUDIO_EQUAL = /*$$(*/ "Equal" /*)*/;
  public static final String BPM_STUDIO_LIKE = /*$$(*/ "Like" /*)*/;
  public static final String BPM_STUDIO_IF_MULTIPLE = /*$$(*/ "If multiple" /*)*/;
  public static final String BPM_STUDIO_KEEP_EMPTY = /*$$(*/ "Keep empty" /*)*/;
  public static final String BPM_STUDIO_SELECT_FIRST = /*$$(*/ "Select first" /*)*/;
  public static final String BPM_STUDIO_NEW_PROCESS_ADDED_SUCCESSFULLY = /*$$(*/
      "New process added successfully" /*)*/;
  public static final String BPM_STUDIO_BPM_EDITOR = /*$$(*/ "BPM editor" /*)*/;
  public static final String BPM_STUDIO_ERROR = /*$$(*/ "Error" /*)*/;
  public static final String BPM_STUDIO_CALLACTIVITY_TYPE = /*$$(*/ "CallActivity type" /*)*/;
  public static final String BPM_STUDIO_CALLED_ELEMENT = /*$$(*/ "Called element" /*)*/;
  public static final String BPM_STUDIO_MUST_PROVIDE_A_VALUE = /*$$(*/ "Must provide a value" /*)*/;
  public static final String BPM_STUDIO_CASE_REF = /*$$(*/ "Case ref" /*)*/;
  public static final String BPM_STUDIO_CUSTOM = /*$$(*/ "Custom" /*)*/;
  public static final String BPM_STUDIO_CALL_MODEL = /*$$(*/ "Call model" /*)*/;
  public static final String BPM_STUDIO_CALL_LINK = /*$$(*/ "Call link" /*)*/;
  public static final String BPM_STUDIO_PARENT_PATH = /*$$(*/ "Parent path" /*)*/;
  public static final String BPM_STUDIO_CALL_LINK_CONDITION = /*$$(*/ "Call link condition" /*)*/;
  public static final String
      BPM_STUDIO_COMPLETED_IF_CANT_BE_MANAGED_USING_BUILDER_ONCE_CHANGED_MANUALLY = /*$$(*/
          "Completed If can't be managed using builder once changed manually." /*)*/;
  public static final String BPM_STUDIO_WARNING = /*$$(*/ "Warning" /*)*/;
  public static final String BPM_STUDIO_ADD_EXPRESSION = /*$$(*/ "Add expression" /*)*/;
  public static final String BPM_STUDIO_SELECT_BPMN = /*$$(*/ "Select BPMN" /*)*/;
  public static final String BPM_STUDIO_BPMN = /*$$(*/ "BPMN" /*)*/;
  public static final String BPM_STUDIO_COLOR = /*$$(*/ "Color" /*)*/;
  public static final String BPM_STUDIO_COMMENTS = /*$$(*/ "Comments" /*)*/;
  public static final String BPM_STUDIO_ADD_COMMENTS = /*$$(*/ "Add comments" /*)*/;
  public static final String
      BPM_STUDIO_YOU_CAN_ADD_COMMENTS_ABOUT_DIAGRAMS_OR_SPECIFIC_BPMN_ELEMENTS = /*$$(*/
          "You can add comments about diagrams or specific BPMN elements." /*)*/;
  public static final String BPM_STUDIO_UPDATE_COMMENT = /*$$(*/ "Update comment" /*)*/;
  public static final String BPM_STUDIO_REPLY = /*$$(*/ "Reply" /*)*/;
  public static final String BPM_STUDIO_WAIT_FOR_COMPLETION = /*$$(*/ "Wait for completion" /*)*/;
  public static final String BPM_STUDIO_ACTIVITY_REF = /*$$(*/ "Activity ref" /*)*/;
  public static final String BPM_STUDIO_VARIABLE_NAME = /*$$(*/ "Variable name" /*)*/;
  public static final String BPM_STUDIO_VARIABLE_EVENT = /*$$(*/ "Variable event" /*)*/;
  public static final String
      BPM_STUDIO_SPECIFY_MORE_THAN_ONE_VARIABLE_CHANGE_EVENT_AS_A_COMMA_SEPARATED_LIST = /*$$(*/
          "Specify more than one variable change event as a comma separated list." /*)*/;
  public static final String BPM_STUDIO_SCRIPT = /*$$(*/ "Script" /*)*/;
  public static final String
      BPM_STUDIO_SCRIPT_CANT_BE_MANAGED_USING_BUILDER_ONCE_CHANGED_MANUALLY = /*$$(*/
          "Script can't be managed using builder once changed manually." /*)*/;
  public static final String BPM_STUDIO_ADD_ALL_VALUES = /*$$(*/ "Add all values" /*)*/;
  public static final String BPM_STUDIO_SUCCESSFULLY_DRAFTED = /*$$(*/ "Successfully drafted" /*)*/;
  public static final String BPM_STUDIO_TERMINATED = /*$$(*/ "Terminated" /*)*/;
  public static final String BPM_STUDIO_BPM_STATE = /*$$(*/ "BPM State" /*)*/;
  public static final String BPM_STUDIO_CODE = /*$$(*/ "Code" /*)*/;
  public static final String BPM_STUDIO_NAME = /*$$(*/ "Name" /*)*/;
  public static final String BPM_STUDIO_APP = /*$$(*/ "App" /*)*/;
  public static final String BPM_STUDIO_VERSION_TAG = /*$$(*/ "Version tag" /*)*/;
  public static final String BPM_STUDIO_WKF_STATUS_COLOR = /*$$(*/ "Wkf status color" /*)*/;
  public static final String BPM_STUDIO_DESCRIPTION = /*$$(*/ "Description" /*)*/;
  public static final String BPM_STUDIO_PREVIOUS_VERSIONS = /*$$(*/ "Previous versions" /*)*/;
  public static final String BPM_STUDIO_REFRESH = /*$$(*/ "Refresh" /*)*/;
  public static final String BPM_STUDIO_STATUS = /*$$(*/ "Status" /*)*/;
  public static final String BPM_STUDIO_BACK_TO_DRAFT = /*$$(*/ "Back to draft" /*)*/;
  public static final String BPM_STUDIO_NEW_VERSION = /*$$(*/ "New version" /*)*/;
  public static final String BPM_STUDIO_DASHBOARD = /*$$(*/ "Dashboard" /*)*/;
  public static final String BPM_STUDIO_SELECT_PROCESS = /*$$(*/ "Select process" /*)*/;
  public static final String BPM_STUDIO_PROCESS = /*$$(*/ "Process" /*)*/;
  public static final String BPM_STUDIO_SHOW = /*$$(*/ "Show" /*)*/;
  public static final String BPM_STUDIO_NEW = /*$$(*/ "New" /*)*/;
  public static final String BPM_STUDIO_ON_GOING = /*$$(*/ "On going" /*)*/;
  public static final String BPM_STUDIO_ERROR_NAME = /*$$(*/ "Error name" /*)*/;
  public static final String BPM_STUDIO_ERROR_CODE = /*$$(*/ "Error code" /*)*/;
  public static final String BPM_STUDIO_ERROR_MESSAGE = /*$$(*/ "Error message" /*)*/;
  public static final String BPM_STUDIO_ERROR_CODE_VARIABLE = /*$$(*/ "Error code variable" /*)*/;
  public static final String BPM_STUDIO_ERROR_MESSAGE_VARIABLE = /*$$(*/
      "Error message variable" /*)*/;
  public static final String BPM_STUDIO_ESCALATION = /*$$(*/ "Escalation" /*)*/;
  public static final String BPM_STUDIO_ESCALATION_NAME = /*$$(*/ "Escalation name" /*)*/;
  public static final String BPM_STUDIO_ESCALATION_CODE = /*$$(*/ "Escalation code" /*)*/;
  public static final String BPM_STUDIO_ESCALATION_CODE_VARIABLE = /*$$(*/
      "Escalation code variable" /*)*/;
  public static final String BPM_STUDIO_LINK_NAME = /*$$(*/ "Link name" /*)*/;
  public static final String BPM_STUDIO_JAVA_CLASS = /*$$(*/ "Java class" /*)*/;
  public static final String BPM_STUDIO_DELEGATE_EXPRESSION = /*$$(*/ "Delegate expression" /*)*/;
  public static final String BPM_STUDIO_CREATE = /*$$(*/ "create" /*)*/;
  public static final String BPM_STUDIO_ASSIGNMENT = /*$$(*/ "assignment" /*)*/;
  public static final String BPM_STUDIO_COMPLETE = /*$$(*/ "complete" /*)*/;
  public static final String BPM_STUDIO_DELETE = /*$$(*/ "delete" /*)*/;
  public static final String BPM_STUDIO_UPDATE = /*$$(*/ "update" /*)*/;
  public static final String BPM_STUDIO_TIMEOUT = /*$$(*/ "timeout" /*)*/;
  public static final String BPM_STUDIO_DATE = /*$$(*/ "Date" /*)*/;
  public static final String BPM_STUDIO_DURATION = /*$$(*/ "Duration" /*)*/;
  public static final String BPM_STUDIO_CYCLE = /*$$(*/ "Cycle" /*)*/;
  public static final String BPM_STUDIO_TAKE = /*$$(*/ "take" /*)*/;
  public static final String BPM_STUDIO_START = /*$$(*/ "start" /*)*/;
  public static final String BPM_STUDIO_END = /*$$(*/ "end" /*)*/;
  public static final String BPM_STUDIO_EMPTY = /*$$(*/ "empty" /*)*/;
  public static final String BPM_STUDIO_EVENT_TYPE = /*$$(*/ "Event type" /*)*/;
  public static final String BPM_STUDIO_LISTENER_ID = /*$$(*/ "Listener id" /*)*/;
  public static final String BPM_STUDIO_TIMER_DEFINITION_TYPE = /*$$(*/
      "Timer definition type" /*)*/;
  public static final String BPM_STUDIO_TIMER_DEFINITION = /*$$(*/ "Timer definition" /*)*/;
  public static final String BPM_STUDIO_LAST_SUB_FIELD_MUST_BE_USER_FIELD = /*$$(*/
      "Last sub field must be user field" /*)*/;
  public static final String BPM_STUDIO_MENU_NOT_FOUND = /*$$(*/ "Menu not found" /*)*/;
  public static final String BPM_STUDIO_MENU_ITEM = /*$$(*/ "Menu Item" /*)*/;
  public static final String BPM_STUDIO_CREATE_USER_ACTION = /*$$(*/ "Create user action" /*)*/;
  public static final String BPM_STUDIO_ROLE = /*$$(*/ "Role" /*)*/;
  public static final String BPM_STUDIO_EMAIL_NOTIFICATION = /*$$(*/ "Email notification" /*)*/;
  public static final String BPM_STUDIO_TEMPLATE = /*$$(*/ "Template" /*)*/;
  public static final String BPM_STUDIO_EMAIL_EVENT = /*$$(*/ "Email event" /*)*/;
  public static final String BPM_STUDIO_ACTION_EMAIL_TITLE = /*$$(*/ "Action/Email title" /*)*/;
  public static final String BPM_STUDIO_USER_FIELD_PATH = /*$$(*/ "User field path" /*)*/;
  public static final String BPM_STUDIO_TEAM_FIELD_PATH = /*$$(*/ "Team field path" /*)*/;
  public static final String BPM_STUDIO_DEADLINE_FIELD_PATH = /*$$(*/ "Deadline field path" /*)*/;
  public static final String BPM_STUDIO_ADD_MENUS = /*$$(*/ "Add menus" /*)*/;
  public static final String BPM_STUDIO_MENU_NAME = /*$$(*/ "Menu name" /*)*/;
  public static final String BPM_STUDIO_MENU_PARENT = /*$$(*/ "Menu parent" /*)*/;
  public static final String BPM_STUDIO_POSITION = /*$$(*/ "Position" /*)*/;
  public static final String BPM_STUDIO_BEFORE = /*$$(*/ "Before" /*)*/;
  public static final String BPM_STUDIO_AFTER = /*$$(*/ "After" /*)*/;
  public static final String BPM_STUDIO_POSITION_MENU = /*$$(*/ "Position menu" /*)*/;
  public static final String BPM_STUDIO_DOMAIN = /*$$(*/ "Domain" /*)*/;
  public static final String BPM_STUDIO_ROLES = /*$$(*/ "Roles" /*)*/;
  public static final String BPM_STUDIO_IS_PERMANENT = /*$$(*/ "Permanent ?" /*)*/;
  public static final String BPM_STUDIO_DISPLAY_TAG_COUNT = /*$$(*/ "Display tag count ?" /*)*/;
  public static final String BPM_STUDIO_USER_MENU = /*$$(*/ "User menu ?" /*)*/;
  public static final String BPM_STUDIO_GRID_VIEW = /*$$(*/ "Grid view" /*)*/;
  public static final String BPM_STUDIO_FORM_VIEW = /*$$(*/ "Form view" /*)*/;
  public static final String BPM_STUDIO_ADD_CONTEXT_MENU = /*$$(*/ "Add context menu" /*)*/;
  public static final String BPM_STUDIO_LAST_SUBFIELD_SHOULD_BE_RELATED_TO_TEAM = /*$$(*/
      "Last subfield should be related to team" /*)*/;
  public static final String BPM_STUDIO_FIELD_SHOULD_BE_DATE_FIELD = /*$$(*/
      "Field should be date field" /*)*/;
  public static final String BPM_STUDIO_MESSAGE = /*$$(*/ "Message" /*)*/;
  public static final String BPM_STUDIO_MESSAGE_NAME = /*$$(*/ "Message name" /*)*/;
  public static final String BPM_STUDIO_CUSTOM_MODEL = /*$$(*/ "Custom model" /*)*/;
  public static final String BPM_STUDIO_MODEL = /*$$(*/ "Model" /*)*/;
  public static final String BPM_STUDIO_DEFAULT_FORM = /*$$(*/ "Default form" /*)*/;
  public static final String BPM_STUDIO_DISPLAY_STATUS = /*$$(*/ "Display status" /*)*/;
  public static final String BPM_STUDIO_DISPLAY_ON_MODELS = /*$$(*/ "Display on models" /*)*/;
  public static final String BPM_STUDIO_HELP = /*$$(*/ "Help" /*)*/;
  public static final String BPM_STUDIO_WHITE = /*$$(*/ "White" /*)*/;
  public static final String BPM_STUDIO_YELLOW = /*$$(*/ "Yellow" /*)*/;
  public static final String BPM_STUDIO_PURPLE = /*$$(*/ "Purple" /*)*/;
  public static final String BPM_STUDIO_DEEP_PURPLE = /*$$(*/ "Deep Purple" /*)*/;
  public static final String BPM_STUDIO_PINK = /*$$(*/ "Pink" /*)*/;
  public static final String BPM_STUDIO_RED = /*$$(*/ "Red" /*)*/;
  public static final String BPM_STUDIO_GREEN = /*$$(*/ "Green" /*)*/;
  public static final String BPM_STUDIO_GREY = /*$$(*/ "Grey" /*)*/;
  public static final String BPM_STUDIO_HILITE = /*$$(*/ "hilite" /*)*/;
  public static final String BPM_STUDIO_INDIGO = /*$$(*/ "Indigo" /*)*/;
  public static final String BPM_STUDIO_LIGHT_BLUE = /*$$(*/ "Light Blue" /*)*/;
  public static final String BPM_STUDIO_LIGHT_GREEN = /*$$(*/ "Light Green" /*)*/;
  public static final String BPM_STUDIO_ORANGE = /*$$(*/ "Orange" /*)*/;
  public static final String BPM_STUDIO_LIME = /*$$(*/ "Lime" /*)*/;
  public static final String BPM_STUDIO_CYAN = /*$$(*/ "Cyan" /*)*/;
  public static final String BPM_STUDIO_DEEP_ORANGE = /*$$(*/ "Deep Orange" /*)*/;
  public static final String BPM_STUDIO_TEAL = /*$$(*/ "Teal" /*)*/;
  public static final String BPM_STUDIO_BLACK = /*$$(*/ "Black" /*)*/;
  public static final String BPM_STUDIO_BLUE = /*$$(*/ "Blue" /*)*/;
  public static final String BPM_STUDIO_BLUE_GREY = /*$$(*/ "Blue Grey" /*)*/;
  public static final String BPM_STUDIO_BROWN = /*$$(*/ "Brown" /*)*/;
  public static final String BPM_STUDIO_AMBER = /*$$(*/ "Amber" /*)*/;
  public static final String BPM_STUDIO_MUST_PROVIDE_EITHER_LOOP_CARDINALITY_OR_COLLECTION = /*$$(*/
      "Must provide either loop cardinality or collection" /*)*/;
  public static final String BPM_STUDIO_LOOP_CARDINALITY = /*$$(*/ "Loop cardinality" /*)*/;
  public static final String BPM_STUDIO_COLLECTION = /*$$(*/ "Collection" /*)*/;
  public static final String
      BPM_STUDIO_LAST_SUBFIELD_SHOULD_BE_MANY_TO_MANY_OR_ONE_TO_MANY_FIELD = /*$$(*/
          "Last subfield should be many to many or one to many field" /*)*/;
  public static final String BPM_STUDIO_ELEMENT_VARIABLE = /*$$(*/ "Element variable" /*)*/;
  public static final String BPM_STUDIO_COMPLETION_CONDITION = /*$$(*/ "Completion condition" /*)*/;
  public static final String BPM_STUDIO_TRANSLATION = /*$$(*/ "Translation" /*)*/;
  public static final String BPM_STUDIO_LANGUAGE = /*$$(*/ "Language" /*)*/;
  public static final String BPM_STUDIO_HINT = /*$$(*/ "Hint" /*)*/;
  public static final String BPM_STUDIO_MUST_PROVIDE_META_MODEL_OR_CUSTOM_MODEL = /*$$(*/
      "Must provide meta model or custom model" /*)*/;
  public static final String BPM_STUDIO_START_MODEL = /*$$(*/ "Start model ?" /*)*/;
  public static final String BPM_STUDIO_DIRECT_CREATION = /*$$(*/ "Direct creation ?" /*)*/;
  public static final String BPM_STUDIO_TITLE = /*$$(*/ "Title" /*)*/;
  public static final String BPM_STUDIO_PROCESS_PATH = /*$$(*/ "Process path" /*)*/;
  public static final String BPM_STUDIO_CONDITION = /*$$(*/ "Condition" /*)*/;
  public static final String
      BPM_STUDIO_PATH_CONDITION_CANT_BE_MANAGED_USING_BUILDER_ONCE_CHANGED_MANUALLY = /*$$(*/
          "Path condition can't be managed using builder once changed manually." /*)*/;
  public static final String BPM_STUDIO_USER_DEFAULT_PATH = /*$$(*/ "User default path" /*)*/;
  public static final String BPM_STUDIO_LAST_SUBFIELD_SHOULD_BE_RELATED_TO_START_MODEL = /*$$(*/
      "Last subfield should be related to start model" /*)*/;
  public static final String BPM_STUDIO_LAST_SUBFIELD_SHOULD_BE_RELATED_TO_USER = /*$$(*/
      "Last subfield should be related to user" /*)*/;
  public static final String BPM_STUDIO_TRANSLATIONS = /*$$(*/ "Translations" /*)*/;
  public static final String BPM_STUDIO_QUERY = /*$$(*/ "Query" /*)*/;
  public static final String BPM_STUDIO_ADD_QUERY = /*$$(*/ "Add query" /*)*/;
  public static final String BPM_STUDIO_LATEST = /*$$(*/ "latest" /*)*/;
  public static final String BPM_STUDIO_DEPLOYMENT = /*$$(*/ "deployment" /*)*/;
  public static final String BPM_STUDIO_VERSIONTAG = /*$$(*/ "versionTag" /*)*/;
  public static final String BPM_STUDIO_EXTERNAL = /*$$(*/ "External" /*)*/;
  public static final String BPM_STUDIO_DMN = /*$$(*/ "DMN" /*)*/;
  public static final String BPM_STUDIO_IMPLEMENTATION = /*$$(*/ "Implementation" /*)*/;
  public static final String BPM_STUDIO_DECISION_REF = /*$$(*/ "Decision ref" /*)*/;
  public static final String BPM_STUDIO_DMN_EDITOR = /*$$(*/ "DMN editor" /*)*/;
  public static final String BPM_STUDIO_DECISION_NAME = /*$$(*/ "Decision name" /*)*/;
  public static final String BPM_STUDIO_BINDING = /*$$(*/ "Binding" /*)*/;
  public static final String BPM_STUDIO_VERSION = /*$$(*/ "Version" /*)*/;
  public static final String BPM_STUDIO_TENANT_ID = /*$$(*/ "Tenant id" /*)*/;
  public static final String BPM_STUDIO_COMPULSORY = /*$$(*/ "Compulsory" /*)*/;
  public static final String BPM_STUDIO_TOPIC = /*$$(*/ "Topic" /*)*/;
  public static final String BPM_STUDIO_EXTERNAL_TASK_CONFIGURATION = /*$$(*/
      "External task configuration" /*)*/;
  public static final String BPM_STUDIO_TASK_PRIORITY = /*$$(*/ "Task priority" /*)*/;
  public static final String BPM_STUDIO_SELECT_DMN = /*$$(*/ "Select DMN" /*)*/;
  public static final String BPM_STUDIO_SIGNAL = /*$$(*/ "Signal" /*)*/;
  public static final String BPM_STUDIO_SIGNAL_NAME = /*$$(*/ "Signal name" /*)*/;
  public static final String BPM_STUDIO_INITIATOR = /*$$(*/ "Initiator" /*)*/;
  public static final String
      BPM_STUDIO_EXPRESSION_CANT_BE_MANAGED_USING_BUILDER_ONCE_CHANGED_MANUALLY = /*$$(*/
          "Expression can't be managed using builder once changed manually." /*)*/;
  public static final String BPM_STUDIO_COMPLETED_IF = /*$$(*/ "Completed if" /*)*/;
  public static final String BPM_STUDIO_ADD_TRANSLATIONS = /*$$(*/ "Add translations" /*)*/;
  public static final String BPM_STUDIO_BUTTONS = /*$$(*/ "Buttons" /*)*/;
  public static final String BPM_STUDIO_SOURCE = /*$$(*/ "Source" /*)*/;
  public static final String BPM_STUDIO_SOURCE_EXPRESSION = /*$$(*/ "Source expression" /*)*/;
  public static final String BPM_STUDIO_ALL = /*$$(*/ "All" /*)*/;
  public static final String BPM_STUDIO_IN_MAPPING = /*$$(*/ "In mapping" /*)*/;
  public static final String BPM_STUDIO_OUT_MAPPING = /*$$(*/ "Out mapping" /*)*/;
  public static final String BPM_STUDIO_TYPE = /*$$(*/ "Type" /*)*/;
  public static final String BPM_STUDIO_TARGET = /*$$(*/ "Target" /*)*/;
  public static final String BPM_STUDIO_MAPPING_MUST_HAVE_A_TARGET = /*$$(*/
      "Mapping must have a target" /*)*/;
  public static final String BPM_STUDIO_VIEW = /*$$(*/ "View" /*)*/;
  public static final String BPM_STUDIO_RELATED_FIELD = /*$$(*/ "Related field" /*)*/;
  public static final String BPM_STUDIO_MUST_PROVIDE_ATTRIBUTES = /*$$(*/
      "Must provide attributes" /*)*/;
  public static final String BPM_STUDIO_ATTRIBUTES = /*$$(*/ "Attributes" /*)*/;
  public static final String BPM_STUDIO_ITEM = /*$$(*/ "Item" /*)*/;
  public static final String BPM_STUDIO_PERMANENT = /*$$(*/ "Permanent" /*)*/;
  public static final String BPM_STUDIO_ATTRIBUTE_VALUE = /*$$(*/ "Attribute value" /*)*/;
  public static final String BPM_STUDIO_HISTORY_TIME_TO_LIVE = /*$$(*/ "History time to live" /*)*/;
  public static final String BPM_STUDIO_JOB_PRIORITY = /*$$(*/ "Job priority" /*)*/;
  public static final String BPM_STUDIO_RETRY_TIME_CYCLE = /*$$(*/ "Retry time cycle" /*)*/;
  public static final String BPM_STUDIO_STARTABLE = /*$$(*/ "Startable" /*)*/;
  public static final String BPM_STUDIO_EXECUTABLE = /*$$(*/ "Executable" /*)*/;
  public static final String BPM_STUDIO_ID = /*$$(*/ "Id" /*)*/;
  public static final String BPM_STUDIO_CATEGORY_VALUE = /*$$(*/ "Category value" /*)*/;
  public static final String BPM_STUDIO_PROCESS_ID = /*$$(*/ "Process id" /*)*/;
  public static final String BPM_STUDIO_VIEW_ATTRIBUTES = /*$$(*/ "View attributes" /*)*/;
  public static final String BPM_STUDIO_MENU_ACTION = /*$$(*/ "Menu/Action" /*)*/;
  public static final String BPM_STUDIO_PROCESS_CONFIGS = /*$$(*/ "Process configs" /*)*/;
  public static final String BPM_STUDIO_NODE_MAPPING = /*$$(*/ "Node mapping" /*)*/;
  public static final String BPM_STUDIO_DEFINITIONS = /*$$(*/ "Definitions" /*)*/;
  public static final String BPM_STUDIO_MIGRATE_PREVIOUS_VERSION_RECORDS = /*$$(*/
      "Migrate previous version records?" /*)*/;
  public static final String BPM_STUDIO_OLD_NODE = /*$$(*/ "Old node" /*)*/;
  public static final String BPM_STUDIO_CURRENT_NODE = /*$$(*/ "Current node" /*)*/;
  public static final String BPM_STUDIO_ITEM_IS_REQUIRED = /*$$(*/ "Item is required." /*)*/;
  public static final String BPM_STUDIO_ERROR_CANT_IMPORT_XML = /*$$(*/
      "Error! Can't import XML" /*)*/;
  public static final String BPM_STUDIO_UPLOAD_BPMN_FILES_ONLY = /*$$(*/
      "Upload Bpmn files only" /*)*/;
  public static final String BPM_STUDIO_MUST_PROVIDE_A_VALUE_FOR_TIMEOUT_TASK_LISTENER = /*$$(*/
      "Must provide a value for timeout task listener" /*)*/;
  public static final String BPM_STUDIO_UPDATE_KEY = /*$$(*/ "Update" /*)*/;
  public static final String BPM_STUDIO_NAME_AND_CODE_ARE_REQUIRED = /*$$(*/
      "Name and code are required." /*)*/;
  public static final String BPM_STUDIO_NAME_IS_REQUIRED = /*$$(*/ "Name is required." /*)*/;
  public static final String BPM_STUDIO_CODE_IS_REQUIRED = /*$$(*/ "Code is required." /*)*/;
  public static final String BPM_STUDIO_TIMER_EVENTS_ARE_NOT_SUPPORTED = /*$$(*/
      "Timer events are not supported." /*)*/;
  public static final String BPM_STUDIO_ID_IS_REQUIRED_IN = /*$$(*/ "Id is required in" /*)*/;
  public static final String BPM_STUDIO_RELATED_FIELD_IS_REQUIRED_IN = /*$$(*/
      "Related field is required in" /*)*/;
  public static final String BPM_STUDIO_ITEM_IS_REQUIRED_IN = /*$$(*/ "Item is required in" /*)*/;
  public static final String BPM_STUDIO_ITEM_NAME_IS_REQUIRED_IN = /*$$(*/
      "Item name is required in" /*)*/;
  public static final String BPM_STUDIO_ITEM_VALUE_IS_REQUIRED_IN = /*$$(*/
      "Item value is required in" /*)*/;
  public static final String BPM_STUDIO_SAVED_SUCCESSFULLY = /*$$(*/ "Saved Successfully" /*)*/;
  public static final String BPM_STUDIO_DEPLOYED_SUCCESSFULLY = /*$$(*/
      "Deployed Successfully" /*)*/;
  public static final String BPM_STUDIO_PLEASE_PROVIDE_UNIQUE_PROCESS_ID = /*$$(*/
      "Please provide unique process id" /*)*/;
  public static final String BPM_STUDIO_DELETED_SUCCESSFULLY = /*$$(*/ "Deleted Successfully" /*)*/;
  public static final String BPM_STUDIO_ARE_YOU_SURE_YOU_WANT_TO_DELETE_THIS_RECORD = /*$$(*/
      "Are you sure you want to delete this record?" /*)*/;
  public static final String BPM_STUDIO_QUESTION = /*$$(*/ "Question" /*)*/;
  public static final String BPM_STUDIO_IMAGE = /*$$(*/ "Image" /*)*/;
  public static final String BPM_STUDIO_SAVE = /*$$(*/ "Save" /*)*/;
  public static final String BPM_STUDIO_DELETE_KEY = /*$$(*/ "Delete" /*)*/;
  public static final String BPM_STUDIO_UPLOAD_KEY = /*$$(*/ "Upload" /*)*/;
  public static final String BPM_STUDIO_DOWNLOAD = /*$$(*/ "Download" /*)*/;
  public static final String BPM_STUDIO_START_TXT = /*$$(*/ "Start" /*)*/;
  public static final String BPM_STUDIO_DEPLOY = /*$$(*/ "Deploy" /*)*/;
  public static final String BPM_STUDIO_SHOW_DIAGRAM_PROPERTIES = /*$$(*/
      "Show diagram properties" /*)*/;
  public static final String BPM_STUDIO_ARE_YOU_SURE_YOU_WANT_TO_CLOSE_THE_TAB = /*$$(*/
      "Are you sure you want to close the tab?" /*)*/;
  public static final String
      BPM_STUDIO_CURRENT_CHANGES_WILL_BE_LOST_DO_YOU_REALLY_WANT_TO_PROCEED = /*$$(*/
          "Current changes will be lost. Do you really want to proceed?" /*)*/;
  public static final String BPM_STUDIO_BPM_MODEL = /*$$(*/ "BPM model" /*)*/;
  public static final String BPM_STUDIO_PROPERTIES_PANEL = /*$$(*/ "Properties panel" /*)*/;
  public static final String BPM_STUDIO_DOWNLOAD_SVG = /*$$(*/ "Download SVG" /*)*/;
  public static final String BPM_STUDIO_ZOOM_IN = /*$$(*/ "Zoom in" /*)*/;
  public static final String BPM_STUDIO_ZOOM_OUT = /*$$(*/ "Zoom out" /*)*/;
  public static final String BPM_STUDIO_RESET_ZOOM = /*$$(*/ "Reset zoom" /*)*/;
  public static final String BPM_STUDIO_RESTARTED_SUCCESSFULLY = /*$$(*/
      "Restarted successfully" /*)*/;
  public static final String BPM_STUDIO_CANCELLED_SUCCESSFULLY = /*$$(*/
      "Cancelled successfully" /*)*/;
  public static final String BPM_STUDIO_RESTART = /*$$(*/ "Restart" /*)*/;
  public static final String BPM_STUDIO_CANCEL_NODE = /*$$(*/ "Cancel node" /*)*/;
  public static final String BPM_STUDIO_FIELD_NAME = /*$$(*/ "Field name" /*)*/;
  public static final String BPM_STUDIO_REMOVE_SUB_FIELD = /*$$(*/ "Remove sub field" /*)*/;
  public static final String BPM_STUDIO_ADD_SUB_FIELD = /*$$(*/ "Add sub field" /*)*/;
  public static final String BPM_STUDIO_POWERED_BY_AXELOR = /*$$(*/ "Powered by Axelor" /*)*/;
  public static final String BPM_STUDIO_POWERED_BY_BPMN_IO = /*$$(*/ "Powered by bpmn.io" /*)*/;
  public static final String
      BPM_STUDIO_WEB_BASED_TOOLING_FOR_BPMN_DMN_AND_CMMN_DIAGRAMS_POWERED_BY_BPMN_IO = /*$$(*/
          "Web-based tooling for BPMN, DMN and CMMN diagrams powered by bpmn.io" /*)*/;
  public static final String
      BPM_STUDIO_WEB_BASED_TOOLING_FOR_NO_CODE_BPM_APPS_POWERED_BY_AXELOR = /*$$(*/
          "Web-based tooling for no-code BPM apps powered by Axelor" /*)*/;
  public static final String BPM_STUDIO_REQUIRED = /*$$(*/ "Required" /*)*/;
  public static final String BPM_STUDIO_EXECUTION_LISTENER = /*$$(*/ "Execution listener" /*)*/;
  public static final String BPM_STUDIO_TASK_LISTENER = /*$$(*/ "Task listener" /*)*/;
  public static final String BPM_STUDIO_THIS_MAPS_TO_THE_PROCESS_DEFINITION_KEY = /*$$(*/
      "This maps to the process definition key." /*)*/;
  public static final String BPM_STUDIO_THIS_MAPS_TO_THE_TASK_DEFINITION_KEY = /*$$(*/
      "This maps to the task definition key." /*)*/;
  public static final String BPM_STUDIO_GENERAL = /*$$(*/ "General" /*)*/;
  public static final String BPM_STUDIO_DETAILS = /*$$(*/ "Details" /*)*/;
  public static final String BPM_STUDIO_MULTI_INSTANCE = /*$$(*/ "Multi instance" /*)*/;
  public static final String BPM_STUDIO_JOB_CONFIGURATION = /*$$(*/ "Job configuration" /*)*/;
  public static final String BPM_STUDIO_HISTORY_CONFIGURATION = /*$$(*/
      "History configuration" /*)*/;
  public static final String BPM_STUDIO_VARIABLES = /*$$(*/ "Variables" /*)*/;
  public static final String BPM_STUDIO_LISTENERS = /*$$(*/ "Listeners" /*)*/;
  public static final String BPM_STUDIO_PARALLEL_MULTI_INSTANCE = /*$$(*/
      "Parallel multi instance" /*)*/;
  public static final String BPM_STUDIO_SEQUENTIAL_MULTI_INSTANCE = /*$$(*/
      "Sequential multi instance" /*)*/;
  public static final String BPM_STUDIO_LOOP = /*$$(*/ "Loop" /*)*/;
  public static final String BPM_STUDIO_PARTICIPANT_MULTIPLICITY = /*$$(*/
      "Participant multiplicity" /*)*/;
  public static final String BPM_STUDIO_AD_HOC = /*$$(*/ "Ad-hoc" /*)*/;
  public static final String BPM_STUDIO_CANDIDATE_STARTER_GROUPS = /*$$(*/
      "Candidate starter groups" /*)*/;
  public static final String
      BPM_STUDIO_SPECIFY_MORE_THAN_ONE_GROUP_AS_A_COMMA_SEPARATED_LIST = /*$$(*/
          "Specify more than one group as a comma separated list." /*)*/;
  public static final String BPM_STUDIO_CANDIDATE_STARTER_USERS = /*$$(*/
      "Candidate starter users" /*)*/;
  public static final String
      BPM_STUDIO_SPECIFY_MORE_THAN_ONE_USER_AS_A_COMMA_SEPARATED_LIST = /*$$(*/
          "Specify more than one user as a comma separated list." /*)*/;
  public static final String BPM_STUDIO_CONFIGURATION = /*$$(*/ "Configuration" /*)*/;

  // DMN Studio
  public static final String STUDIO_DMN_INPUT_EXPRESSION = /*$$(*/ "Input Expression" /*)*/;
  public static final String STUDIO_DMN_INPUT_LABEL = /*$$(*/ "Input Label" /*)*/;
  public static final String STUDIO_DMN_WHEN = /*$$(*/ "When" /*)*/;
  public static final String STUDIO_DMN_AND = /*$$(*/ "And" /*)*/;
  public static final String STUDIO_DMN_INPUT_VALUES = /*$$(*/ "Input Values" /*)*/;
  public static final String STUDIO_DMN_INPUT_TYPE = /*$$(*/ "Input Type" /*)*/;
  public static final String STUDIO_DMN_INPUT = /*$$(*/ "Input" /*)*/;
  public static final String STUDIO_DMN_THEN = /*$$(*/ "Then" /*)*/;
  public static final String STUDIO_DMN_OUTPUT_LABEL = /*$$(*/ "Output Label" /*)*/;
  public static final String STUDIO_DMN_OUTPUT_NAME_CAPS = /*$$(*/ "Output Name" /*)*/;
  public static final String STUDIO_DMN_OUTPUT_VALUES = /*$$(*/ "Output Values" /*)*/;
  public static final String STUDIO_DMN_OUTPUT_TYPE = /*$$(*/ "Output Type" /*)*/;
  public static final String STUDIO_DMN_OUTPUT = /*$$(*/ "Output" /*)*/;
  public static final String STUDIO_DMN_FIRST = /*$$(*/ "First" /*)*/;
  public static final String
      STUDIO_DMN_RULES_MAY_OVERLAP_THE_FIRST_MATCHING_RULE_WILL_BE_CHOSEN = /*$$(*/
          "Rules may overlap. The first matching rule will be chosen" /*)*/;
  public static final String STUDIO_DMN_EDIT = /*$$(*/ "Edit" /*)*/;
  public static final String STUDIO_DMN_EDITING_NOT_SUPPORTED_FOR_SET_EXPRESSION_LANGUAGE = /*$$(*/
      "Editing not supported for set expression language" /*)*/;
  public static final String STUDIO_DMN_ACTIVATE_THE_HAND_TOOL = /*$$(*/
      "Activate the hand tool" /*)*/;
  public static final String STUDIO_DMN_ACTIVATE_THE_LASSO_TOOL = /*$$(*/
      "Activate the lasso tool" /*)*/;
  public static final String STUDIO_DMN_CREATE_DECISION_TABLE = /*$$(*/
      "Create Decision Table" /*)*/;
  public static final String STUDIO_DMN_CREATE_INPUT_DATA = /*$$(*/ "Create Input Data" /*)*/;
  public static final String STUDIO_DMN_CREATE_KNOWLEDGE_SOURCE = /*$$(*/
      "Create Knowledge Source" /*)*/;
  public static final String STUDIO_DMN_CREATE_KNOWLEDGE_MODEL = /*$$(*/
      "Create Knowledge Model" /*)*/;
  public static final String STUDIO_DMN_VALUE = /*$$(*/ "Value" /*)*/;
  public static final String STUDIO_DMN_NAME = /*$$(*/ "Name" /*)*/;
  public static final String STUDIO_DMN_HISTORY_TIME_TO_LIVE = /*$$(*/ "History time to live" /*)*/;
  public static final String STUDIO_DMN_ID = /*$$(*/ "Id" /*)*/;
  public static final String STUDIO_DMN_CUSTOM = /*$$(*/ "Custom" /*)*/;
  public static final String STUDIO_DMN_MODEL = /*$$(*/ "Model" /*)*/;
  public static final String STUDIO_DMN_CUSTOM_MODEL = /*$$(*/ "Custom model" /*)*/;
  public static final String STUDIO_DMN_VERSION_TAG = /*$$(*/ "Version tag" /*)*/;
  public static final String STUDIO_DMN_LABEL = /*$$(*/ "Label" /*)*/;
  public static final String STUDIO_DMN_EXPRESSION = /*$$(*/ "Expression" /*)*/;
  public static final String STUDIO_DMN_ENABLE = /*$$(*/ "Enable" /*)*/;
  public static final String STUDIO_DMN_EXPRESSION_LANGUAGE = /*$$(*/ "Expression language" /*)*/;
  public static final String STUDIO_DMN_INPUT_VARIABLE = /*$$(*/ "Input variable" /*)*/;
  public static final String STUDIO_DMN_TYPE = /*$$(*/ "Type" /*)*/;
  public static final String STUDIO_DMN_DEFAULT_VALUE = /*$$(*/ "Default value" /*)*/;
  public static final String
      STUDIO_DMN_SCRIPT_CANT_BE_MANAGED_USING_BUILDER_ONCE_CHANGED_MANUALLY = /*$$(*/
          "Script can't be managed using builder once changed manually." /*)*/;
  public static final String STUDIO_DMN_WARNING = /*$$(*/ "Warning" /*)*/;
  public static final String STUDIO_DMN_CONTEXT = /*$$(*/ "Context" /*)*/;
  public static final String STUDIO_DMN_CONTEXT_MODEL = /*$$(*/ "Context model" /*)*/;
  public static final String STUDIO_DMN_OUTPUT_NAME = /*$$(*/ "Output name" /*)*/;
  public static final String STUDIO_DMN_THIS_MAPS_TO_THE_DECISION_DEFINITION_KEY = /*$$(*/
      "This maps to the decision definition key." /*)*/;
  public static final String STUDIO_DMN_GENERAL = /*$$(*/ "General" /*)*/;
  public static final String STUDIO_DMN_DETAILS = /*$$(*/ "Details" /*)*/;
  public static final String STUDIO_DMN_HISTORY_CONFIGURATION = /*$$(*/
      "History configuration" /*)*/;
  public static final String STUDIO_DMN_SELECT_VALUE = /*$$(*/ "Select value" /*)*/;
  public static final String STUDIO_DMN_EDIT_STRING = /*$$(*/ "Edit string" /*)*/;
  public static final String STUDIO_DMN_MATCH_ONE = /*$$(*/ "Match one" /*)*/;
  public static final String STUDIO_DMN_MATCH_NONE = /*$$(*/ "Match none" /*)*/;
  public static final String STUDIO_DMN_YES = /*$$(*/ "Yes" /*)*/;
  public static final String STUDIO_DMN_NO = /*$$(*/ "No" /*)*/;
  public static final String STUDIO_DMN_COMPARISON = /*$$(*/ "Comparison" /*)*/;
  public static final String STUDIO_DMN_RANGE = /*$$(*/ "Range" /*)*/;
  public static final String STUDIO_DMN_EQUALS = /*$$(*/ "Equals" /*)*/;
  public static final String STUDIO_DMN_LESS = /*$$(*/ "Less" /*)*/;
  public static final String STUDIO_DMN_LESS_OR_EQUALS = /*$$(*/ "Less or equals" /*)*/;
  public static final String STUDIO_DMN_GREATER = /*$$(*/ "Greater" /*)*/;
  public static final String STUDIO_DMN_GREATER_OR_EQUALS = /*$$(*/ "Greater or equals" /*)*/;
  public static final String STUDIO_DMN_INCLUDE = /*$$(*/ "Include" /*)*/;
  public static final String STUDIO_DMN_EXCLUDE = /*$$(*/ "Exclude" /*)*/;
  public static final String STUDIO_DMN_EXACTLY = /*$$(*/ "Exactly" /*)*/;
  public static final String STUDIO_DMN_BEFORE = /*$$(*/ "Before" /*)*/;
  public static final String STUDIO_DMN_AFTER = /*$$(*/ "After" /*)*/;
  public static final String STUDIO_DMN_BETWEEN = /*$$(*/ "Between" /*)*/;
  public static final String
      STUDIO_DMN_STRINGS_MUST_BE_IN_DOUBLE_QUOTES_ADD_MULTIPLE_STRINGS_WITH_COMMA = /*$$(*/
          "Strings must be in double quotes. Add multiple strings with comma." /*)*/;
  public static final String STUDIO_DMN_EDIT_NUMBER = /*$$(*/ "Edit number" /*)*/;
  public static final String STUDIO_DMN_START_VALUE = /*$$(*/ "Start value" /*)*/;
  public static final String STUDIO_DMN_END_VALUE = /*$$(*/ "End value" /*)*/;
  public static final String STUDIO_DMN_IMPORT_FAILED = /*$$(*/ "Import failed" /*)*/;
  public static final String STUDIO_DMN_IMPORTED_SUCCESSFULLY = /*$$(*/
      "Imported successfully" /*)*/;
  public static final String STUDIO_DMN_UPLOAD_DMN_FILES_ONLY = /*$$(*/
      "Upload dmn files only" /*)*/;
  public static final String STUDIO_DMN_SAVED_SUCCESSFULLY = /*$$(*/ "Saved Successfully" /*)*/;
  public static final String STUDIO_DMN_PLEASE_PROVIDE_UNIQUE_PROCESS_ID = /*$$(*/
      "Please provide unique process id" /*)*/;
  public static final String STUDIO_DMN_DEPLOYED_SUCCESSFULLY = /*$$(*/
      "Deployed Successfully" /*)*/;
  public static final String STUDIO_DMN_ERROR = /*$$(*/ "Error" /*)*/;
  public static final String STUDIO_DMN_SAVE = /*$$(*/ "Save" /*)*/;
  public static final String STUDIO_DMN_UPLOAD = /*$$(*/ "Upload" /*)*/;
  public static final String STUDIO_DMN_DOWNLOAD = /*$$(*/ "Download" /*)*/;
  public static final String STUDIO_DMN_DEPLOY = /*$$(*/ "Deploy" /*)*/;
  public static final String STUDIO_DMN_REFRESH = /*$$(*/ "Refresh" /*)*/;
  public static final String STUDIO_DMN_EXPORT = /*$$(*/ "Export" /*)*/;
  public static final String STUDIO_DMN_IMPORT = /*$$(*/ "Import" /*)*/;
  public static final String STUDIO_DMN_VIEW_DRD = /*$$(*/ "View DRD" /*)*/;
  public static final String STUDIO_DMN_DMN_MODEL = /*$$(*/ "DMN model" /*)*/;
  public static final String
      STUDIO_DMN_CURRENT_CHANGES_WILL_BE_LOST_DO_YOU_REALLY_WANT_TO_PROCEED = /*$$(*/
          "Current changes will be lost. Do you really want to proceed?" /*)*/;
  public static final String BPM_YAML_INVALID_FILE = /*$$(*/ "Invalid File" /*)*/;
  public static final String BPM_YAML_UNSUPPORTED_OPERATION = /*$$(*/
      "Unsupported operation: %s" /*)*/;
  public static final String BPM_YAML_NOT_FOUND_FILE = /*$$(*/ "File not found" /*)*/;
  public static final String BPM_LOG_INVALID_DATES = /*$$(*/
      "Invalid date: start date is after end date" /*)*/;
  public static final String BPM_MODEL_REQUIRED_NUMBER_TO_PERFORM_MERGE_OPERATION =
      /*$$(*/ "At least 2 models are required to perform the merge operation." /*)*/;
  public static final String BPM_MISSING_PROCESS_CONFIGURATION =
      /*$$(*/ "Missing process configuration. Ensure that the required configuration for all the process is provided." /*)*/;
  public static final String BPM_WKF_MODEL_EXPECTED = /*$$(*/
      "Ensure providing a valid WKF model before proceeding." /*)*/;

  public static final String BPM_WKF_MODEL_UNIQUE_CODE = /*$$(*/
      "The code %s is already in use. Please choose a different code." /*)*/;

  public static final String BPM_VARIABLE_UNSUPPORTED_TYPE = /*$$(*/
      "Unsupported variable type or empty map" /*)*/;
  public static final String BPM_VARIABLE_NULL_VALUE = /*$$(*/
      "Cannot create object: input value is null" /*)*/;
  public static final String BPM_WKF_INSTANCE_NOT_FOUND = /*$$(*/
      "Process instance not found: %s" /*)*/;
  public static final String MIGRATION_IS_ALREADY_ONGOING = /*$$(*/
      "Migration is already ongoing."; /*)*/
  public static final String NO_WFK_INSTANCE_FOUND = /*$$(*/
      "No WkfInstance found for processInstanceId: %s" /*)*/;
  public static final String NO_PROCESS_CONFIGURATION_FOUND = /*$$(*/
      "No process configuration found for process instance: %s" /*)*/;
  public static final String MODEL_NOT_FOUND = /*$$(*/
      "Model not found for processInstanceId: %s (class: %s)" /*)*/;
}
