/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.db.repo;

import com.axelor.inject.Beans;
import com.axelor.meta.MetaStore;
import com.axelor.meta.db.MetaMenu;
import com.axelor.studio.db.StudioAction;
import com.axelor.studio.db.StudioMenu;
import com.axelor.studio.service.StudioMetaService;
import com.axelor.studio.service.constructor.components.StudioMenuService;
import com.axelor.utils.helpers.ExceptionHelper;
import java.io.IOException;

public class StudioMenuRepo extends StudioMenuRepository {

  @Override
  public StudioMenu save(StudioMenu studioMenu) {
    if (studioMenu.getStudioAction() != null) {
      studioMenu.getStudioAction().setMenuAction(true);
    }
    studioMenu = super.save(studioMenu);
    try {
      studioMenu.setMetaMenu(Beans.get(StudioMenuService.class).build(studioMenu));
    } catch (IOException | ClassNotFoundException e) {
      ExceptionHelper.error(e);
    }
    return studioMenu;
  }

  @Override
  public StudioMenu copy(StudioMenu studioMenu, boolean deep) {

    StudioAction studioAction = studioMenu.getStudioAction();
    studioMenu.setStudioAction(null);

    studioMenu = super.copy(studioMenu, deep);

    if (studioAction != null) {
      studioMenu.setStudioAction(Beans.get(StudioActionRepository.class).copy(studioAction, deep));
    }
    studioMenu.setMetaMenu(null);
    return studioMenu;
  }

  @Override
  public void remove(StudioMenu studioMenu) {
    MetaMenu metaMenu = studioMenu.getMetaMenu();
    studioMenu.setMetaMenu(null);

    if (metaMenu != null) {
      Beans.get(StudioMetaService.class).removeMetaMenu(metaMenu);
    }

    StudioAction studioAction = studioMenu.getStudioAction();

    studioMenu.setStudioAction(null);
    if (studioAction != null) {
      Beans.get(StudioActionRepository.class).remove(studioAction);
    }

    MetaStore.clear();

    super.remove(studioMenu);
  }
}
