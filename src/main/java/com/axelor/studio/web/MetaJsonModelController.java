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

import com.axelor.inject.Beans;
import com.axelor.meta.db.MetaJsonModel;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.studio.db.StudioMenu;
import com.axelor.studio.db.repo.MetaJsonModelRepo;
import com.axelor.studio.db.repo.StudioMenuRepo;
import com.axelor.studio.db.repo.StudioMenuRepository;
import com.axelor.utils.helpers.ExceptionHelper;
import com.google.inject.persist.Transactional;

public class MetaJsonModelController {

  @Transactional
  public void removeStudioMenu(ActionRequest request, ActionResponse response) {
    try {
      MetaJsonModel metaJsonModel = request.getContext().asType(MetaJsonModel.class);
      if (metaJsonModel.getStudioMenu() != null
          && metaJsonModel.getStudioMenu().getId() != null
          && metaJsonModel.getStudioMenu().getMetaMenu() != null) {
        StudioMenu studioMenu =
            Beans.get(StudioMenuRepository.class).find(metaJsonModel.getStudioMenu().getId());

        metaJsonModel = Beans.get(MetaJsonModelRepo.class).find(metaJsonModel.getId());
        metaJsonModel.setStudioMenu(null);
        Beans.get(MetaJsonModelRepo.class).save(metaJsonModel);
        Beans.get(StudioMenuRepo.class).remove(studioMenu);
        response.setReload(true);
      }
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }
}
