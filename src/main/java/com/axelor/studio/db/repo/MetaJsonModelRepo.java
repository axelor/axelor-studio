/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.db.repo;

import com.axelor.inject.Beans;
import com.axelor.meta.db.MetaJsonModel;
import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.meta.db.repo.MetaJsonModelRepository;
import com.axelor.studio.db.StudioApp;
import com.axelor.studio.db.StudioMenu;
import com.axelor.studio.service.constructor.components.StudioMenuService;

public class MetaJsonModelRepo extends MetaJsonModelRepository {

  @Override
  public MetaJsonModel save(MetaJsonModel jsonModel) {
    jsonModel = super.save(jsonModel);

    if (jsonModel.getMenu() != null) {
      StudioApp studioApp = jsonModel.getStudioApp();
      if (studioApp != null) {
        jsonModel
            .getMenu()
            .setConditionToCheck("__config__.app?.isApp('" + studioApp.getCode() + "')");
      } else {
        jsonModel.getMenu().setConditionToCheck(null);
      }
    }

    if (jsonModel.getIsGenerateMenu()) {
      StudioMenu studioMenu = jsonModel.getStudioMenu();
      if (studioMenu != null) {
        studioMenu =
            Beans.get(StudioMenuService.class)
                .updateStudioMenu(
                    studioMenu,
                    jsonModel.getName(),
                    jsonModel.getName().toLowerCase(),
                    jsonModel.getStudioApp(),
                    MetaJsonRecord.class.getName(),
                    true,
                    null);
      }
    }
    return jsonModel;
  }

  @Override
  public void remove(MetaJsonModel jsonModel) {

    if (jsonModel.getStudioMenu() != null && jsonModel.getStudioMenu().getMetaMenu() != null) {
      Beans.get(StudioMenuRepository.class).remove(jsonModel.getStudioMenu());
    }
    super.remove(jsonModel);
  }
}
