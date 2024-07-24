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
import com.axelor.studio.db.StudioSelection;
import com.axelor.studio.service.constructor.components.StudioSelectionService;

public class StudioSelectionRepo extends StudioSelectionRepository {

  @Override
  public StudioSelection save(StudioSelection studioSelection) {

    Beans.get(StudioSelectionService.class).build(studioSelection);

    return super.save(studioSelection);
  }

  @Override
  public void remove(StudioSelection studioSelection) {

    Beans.get(StudioSelectionService.class)
        .removeSelection(
            null,
            StudioSelectionService.SELECTION_PREFIX + studioSelection.getName().replace(" ", "-"));

    super.remove(studioSelection);
  }
}
