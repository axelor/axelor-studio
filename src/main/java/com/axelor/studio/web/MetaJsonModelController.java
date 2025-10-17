/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
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
