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
