/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.web;

import com.axelor.inject.Beans;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.studio.service.constructor.components.expressions.GroovyScriptBuilderService;
import com.axelor.utils.helpers.ExceptionHelper;
import java.util.Map;

public class GroovyExpressionBuilderController {
  public void buildScript(ActionRequest request, ActionResponse response) {
    try {
      Map<String, Object> data = request.getData();
      response.setData(Beans.get(GroovyScriptBuilderService.class).build(data));
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void buildExpression(ActionRequest request, ActionResponse response) {
    try {
      Map<String, Object> data = request.getData();
      response.setData(Beans.get(GroovyScriptBuilderService.class).buildExpression(data));
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }
}
