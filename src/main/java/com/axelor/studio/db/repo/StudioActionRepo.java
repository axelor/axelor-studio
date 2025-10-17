/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.db.repo;

import com.axelor.meta.MetaStore;
import com.axelor.studio.db.StudioAction;
import com.axelor.studio.service.StudioMetaService;
import com.axelor.studio.service.constructor.components.actions.StudioActionService;
import com.axelor.utils.helpers.ExceptionHelper;
import com.google.inject.Inject;
import java.io.IOException;

public class StudioActionRepo extends StudioActionRepository {

  protected StudioMetaService metaService;

  protected StudioActionService studioActionService;

  @Inject
  public StudioActionRepo(StudioMetaService metaService, StudioActionService studioActionService) {
    this.metaService = metaService;
    this.studioActionService = studioActionService;
  }

  @Override
  public StudioAction save(StudioAction studioAction) {

    studioAction = super.save(studioAction);

    try {
      studioActionService.build(studioAction);
    } catch (IOException | ClassNotFoundException e) {
      ExceptionHelper.error(e);
    }

    return studioAction;
  }

  @Override
  public void remove(StudioAction studioAction) {

    metaService.removeMetaActions(studioAction.getXmlId());

    MetaStore.clear();

    super.remove(studioAction);
  }
}
