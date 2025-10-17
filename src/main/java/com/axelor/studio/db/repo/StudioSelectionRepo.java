/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
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
