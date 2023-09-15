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
package com.axelor.studio.web;

import com.axelor.i18n.I18n;
import com.axelor.inject.Beans;
import com.axelor.meta.schema.actions.ActionView;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.rpc.Context;
import com.axelor.studio.service.StudioMetaServiceImpl;
import com.axelor.utils.ExceptionTool;
import org.apache.commons.lang3.StringUtils;

public class StudioBuilderController {

  public void openStudioBuilder(ActionRequest request, ActionResponse response) {
    try {
      Context context = request.getContext();
      boolean isJson = context.containsKey("jsonModel");
      String model =
          isJson
              ? (String) context.get("jsonModel")
              : StringUtils.substringAfterLast((String) context.get("_model"), ".");
      String viewName = (String) context.get("_viewName");
      String url =
          Beans.get(StudioMetaServiceImpl.class).computeStudioBuilderUrl(model, viewName, isJson);

      response.setView(ActionView.define(I18n.get("Studio")).add("html", url).map());
    } catch (Exception e) {
      ExceptionTool.trace(response, e);
    }
  }
}
