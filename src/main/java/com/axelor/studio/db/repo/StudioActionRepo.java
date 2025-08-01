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
