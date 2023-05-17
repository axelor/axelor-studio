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
package com.axelor.studio.db.repo;

import com.axelor.inject.Beans;
import com.axelor.meta.db.MetaJsonModel;
import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.meta.db.repo.MetaJsonModelRepository;
import com.axelor.studio.db.StudioApp;
import com.axelor.studio.db.StudioMenu;
import com.axelor.studio.service.builder.StudioMenuService;

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
      Beans.get(StudioMenuRepo.class).remove(jsonModel.getStudioMenu());
    }
    super.remove(jsonModel);
  }
}
