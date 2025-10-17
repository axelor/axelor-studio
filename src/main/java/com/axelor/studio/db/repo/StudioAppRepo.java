/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.db.repo;

import com.axelor.inject.Beans;
import com.axelor.studio.db.StudioApp;
import com.axelor.studio.service.constructor.StudioAppService;
import jakarta.validation.ValidationException;

public class StudioAppRepo extends StudioAppRepository {

  @Override
  public StudioApp save(StudioApp studioApp) {

    try {
      Beans.get(StudioAppService.class).build(studioApp);
    } catch (Exception e) {
      throw new ValidationException(e);
    }

    return super.save(studioApp);
  }

  @Override
  public void remove(StudioApp studioApp) {

    Beans.get(StudioAppService.class).clean(studioApp);

    super.remove(studioApp);
  }
}
