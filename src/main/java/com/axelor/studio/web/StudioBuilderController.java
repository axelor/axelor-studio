/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.web;

import com.axelor.i18n.I18n;
import com.axelor.inject.Beans;
import com.axelor.meta.schema.actions.ActionView;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.rpc.Context;
import com.axelor.studio.service.StudioMetaService;
import com.axelor.utils.helpers.ExceptionHelper;
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
          Beans.get(StudioMetaService.class).computeStudioBuilderUrl(model, viewName, isJson);

      response.setView(ActionView.define(I18n.get("Studio")).add("html", url).map());
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }
}
