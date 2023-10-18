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

import com.axelor.common.Inflector;
import com.axelor.inject.Beans;
import com.axelor.meta.db.MetaView;
import com.axelor.meta.db.repo.MetaViewRepository;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.studio.db.StudioAction;
import com.axelor.studio.db.StudioActionView;
import com.axelor.studio.db.repo.StudioActionRepository;
import com.axelor.studio.service.mapper.MapperScriptGeneratorService;
import com.axelor.utils.helpers.ExceptionHelper;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class StudioActionController {

  protected Inflector inflector;

  public void setViews(ActionRequest request, ActionResponse response) {
    try {
      inflector = Inflector.getInstance();

      StudioAction studioAction = request.getContext().asType(StudioAction.class);
      String model = studioAction.getModel();

      boolean isJson = false;
      if (studioAction.getIsJson() != null) {
        isJson = studioAction.getIsJson();
      }
      if (studioAction.getTypeSelect() == StudioActionRepository.TYPE_SELECT_VIEW
          && model != null) {
        if (!isJson) {
          model = model.substring(model.lastIndexOf('.') + 1);
          model = inflector.dasherize(model);
        }
        List<StudioActionView> views = new ArrayList<>();
        addStudioActionView(views, model, "grid", isJson, 0);
        addStudioActionView(views, model, "form", isJson, 1);
        response.setValue("studioActionViews", views);
      }
    } catch (Exception e) {
      ExceptionHelper.trace(response, e);
    }
  }

  protected void addStudioActionView(
      List<StudioActionView> views, String model, String type, boolean isJson, int sequence) {

    String viewName = model + "-" + type;
    if (isJson) {
      viewName = "custom-model-" + model + "-" + type;
    }

    MetaView view = Beans.get(MetaViewRepository.class).findByName(viewName);
    if (view == null) {
      return;
    }

    StudioActionView actionView = new StudioActionView();
    actionView.setViewName(view.getName());
    actionView.setViewType(view.getType());
    actionView.setSequence(sequence);

    views.add(actionView);
  }

  @SuppressWarnings("unchecked")
  public void createMapperScript(ActionRequest request, ActionResponse response) {
    try {
      Map<String, Object> ctx = (Map<String, Object>) request.getData().get("context");
      String jsonString = (String) ctx.get("_jsonString");

      if (jsonString != null) {
        String scriptString = Beans.get(MapperScriptGeneratorService.class).generate(jsonString);
        response.setValue("_scriptString", scriptString);
      }
    } catch (Exception e) {
      ExceptionHelper.trace(response, e);
    }
  }
}
