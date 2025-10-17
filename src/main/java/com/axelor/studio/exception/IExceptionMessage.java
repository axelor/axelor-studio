/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.exception;

/**
 * @deprecated Replaced by {@link StudioExceptionMessage}
 */
@Deprecated
public interface IExceptionMessage {

  /** Check if studio app code is not conflicting with existing app. */
  String STUDIO_APP_1 = /*$$(*/ "Please provide unique code. The code '%s' is already used" /*)*/;

  /** Check if chart name doesn't contains any space. */
  String STUDIO_CHART_1 = /*$$(*/ "The name must not contain spaces" /*)*/;

  String CANNOT_ALTER_NODES = /*$$(*/ "Can't alter nodes for real existing selection field" /*)*/;

  String DEMO_DATA_SUCCESS = /*$$(*/ "Demo data loaded successfully" /*)*/;

  String NO_CONFIG_REQUIRED = /*$$(*/ "No configuration required" /*)*/;

  String BULK_INSTALL_SUCCESS = /*$$(*/ "Apps installed successfully" /*)*/;

  String REFRESH_APP_SUCCESS = /*$$(*/ "Apps refreshed successfully" /*)*/;

  String REFRESH_APP_ERROR = /*$$(*/ "Error in refreshing app" /*)*/;

  String ROLE_IMPORT_SUCCESS = /*$$(*/ "Roles imported successfully" /*)*/;

  String ACCESS_CONFIG_IMPORTED = /*$$(*/ "Access config imported successfully" /*)*/;

  String NO_LANGUAGE_SELECTED = /*$$(*/
      "No application language set. Please set 'application.locale' property." /*)*/;

  String FILE_UPLOAD_DIR_ERROR = /*$$(*/ "File upload path not configured" /*)*/;

  String APP_IN_USE = /*$$(*/
      "This app is used by %s. Please deactivate them before continue." /*)*/;

  String DATA_EXPORT_DIR_ERROR = /*$$(*/ "Export path not configured" /*)*/;
}
