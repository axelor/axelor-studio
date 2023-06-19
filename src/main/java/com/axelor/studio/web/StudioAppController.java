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

import com.axelor.common.ObjectUtils;
import com.axelor.i18n.I18n;
import com.axelor.inject.Beans;
import com.axelor.meta.db.MetaFile;
import com.axelor.meta.schema.actions.ActionView;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.rpc.Context;
import com.axelor.studio.app.service.AppService;
import com.axelor.studio.db.App;
import com.axelor.studio.db.StudioApp;
import com.axelor.studio.db.repo.StudioAppRepository;
import com.axelor.studio.exception.StudioExceptionMessage;
import com.axelor.studio.service.builder.StudioAppService;
import com.axelor.utils.ExceptionTool;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class StudioAppController {

  public void installApp(ActionRequest request, ActionResponse response) throws IOException {
    try {
      StudioApp studioApp = request.getContext().asType(StudioApp.class);
      studioApp = Beans.get(StudioAppRepository.class).find(studioApp.getId());

      App app = studioApp.getGeneratedApp();
      Beans.get(AppService.class).installApp(app, null);

      response.setSignal("refresh-app", true);
    } catch (Exception e) {
      ExceptionTool.trace(response, e);
    }
  }

  public void uninstallApp(ActionRequest request, ActionResponse response) {
    try {
      StudioApp studioApp = request.getContext().asType(StudioApp.class);
      studioApp = Beans.get(StudioAppRepository.class).find(studioApp.getId());

      App app = studioApp.getGeneratedApp();
      Beans.get(AppService.class).unInstallApp(app);

      response.setSignal("refresh-app", true);
    } catch (Exception e) {
      ExceptionTool.trace(response, e);
    }
  }

  public void importApp(ActionRequest request, ActionResponse response) throws IOException {
    try {
      Context context = request.getContext();
      if (!context.containsKey("dataFile")) {
        return;
      }

      @SuppressWarnings("unchecked")
      Map<String, Object> dataFileMap = (Map<String, Object>) request.getContext().get("dataFile");
      MetaFile logFile = Beans.get(StudioAppService.class).importApp(dataFileMap);
      if (logFile == null) {
        response.setCanClose(true);
        response.setNotify(I18n.get(StudioExceptionMessage.SUCCESS_STUDIO_APP_IMPORT));
        return;
      }

      response.setCanClose(true);
      response.setView(
          ActionView.define(I18n.get("Log file"))
              .model(App.class.getName())
              .add(
                  "html",
                  "ws/rest/com.axelor.meta.db.MetaFile/"
                      + logFile.getId()
                      + "/content/download?v="
                      + logFile.getVersion())
              .param("download", "true")
              .map());
    } catch (Exception e) {
      ExceptionTool.trace(response, e);
    }
  }

  @SuppressWarnings("unchecked")
  public void exportApp(ActionRequest request, ActionResponse response) throws IOException {
    try {
      Context context = request.getContext();
      MetaFile exportFile = null;

      Object ids = null;
      boolean isExportData = false;
      if (context.containsKey("ids") && ObjectUtils.notEmpty(context.get("ids"))) {
        ids = context.get("ids");
      }

      if (context.containsKey("isExportData")) {
        isExportData = (boolean) context.get("isExportData");
      }

      if (ObjectUtils.isEmpty(ids)) {
        return;
      }

      if (ids.getClass().isAssignableFrom(ArrayList.class)) {
        exportFile =
            Beans.get(StudioAppService.class).exportApps((List<Integer>) ids, isExportData);
      } else if (ids.getClass().isAssignableFrom(Integer.class)) {
        StudioApp studioApp = Beans.get(StudioAppRepository.class).find(Long.parseLong(ids + ""));
        exportFile = Beans.get(StudioAppService.class).exportApp(studioApp, isExportData);
      }

      if (exportFile == null) {
        response.setCanClose(true);
        return;
      }

      response.setCanClose(true);
      response.setView(
          ActionView.define(I18n.get("Export file"))
              .model(App.class.getName())
              .add(
                  "html",
                  "ws/rest/com.axelor.meta.db.MetaFile/"
                      + exportFile.getId()
                      + "/content/download?v="
                      + exportFile.getVersion())
              .param("download", "true")
              .map());
    } catch (Exception e) {
      ExceptionTool.trace(response, e);
    }
  }

  public void deleteApp(ActionRequest request, ActionResponse response) throws IOException {
    try {
      StudioApp studioApp = request.getContext().asType(StudioApp.class);
      studioApp = Beans.get(StudioAppRepository.class).find(studioApp.getId());
      Beans.get(StudioAppService.class).deleteApp(studioApp);
      response.setSignal("refresh-app", true);
    } catch (Exception e) {
      ExceptionTool.trace(response, I18n.get(StudioExceptionMessage.STUDIO_APP_IN_REF));
    }
  }
}
