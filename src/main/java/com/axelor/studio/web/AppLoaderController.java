/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.web;

import com.axelor.inject.Beans;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.studio.db.AppLoader;
import com.axelor.studio.db.repo.AppLoaderRepository;
import com.axelor.studio.service.loader.AppLoaderExportService;
import com.axelor.studio.service.loader.AppLoaderImportService;
import com.axelor.utils.helpers.ExceptionHelper;

public class AppLoaderController {

  public void exportApps(ActionRequest request, ActionResponse response) {
    try {
      AppLoader appLoader = request.getContext().asType(AppLoader.class);
      appLoader = Beans.get(AppLoaderRepository.class).find(appLoader.getId());
      Beans.get(AppLoaderExportService.class).exportApps(appLoader);
      response.setReload(true);
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void importApps(ActionRequest request, ActionResponse response) {
    try {
      AppLoader appLoader = request.getContext().asType(AppLoader.class);
      appLoader = Beans.get(AppLoaderRepository.class).find(appLoader.getId());
      Beans.get(AppLoaderImportService.class).importApps(appLoader);
      response.setReload(true);
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }
}
