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

import com.axelor.meta.db.MetaView;
import com.axelor.meta.db.repo.MetaViewRepository;
import com.axelor.studio.db.StudioDashboard;
import com.axelor.studio.service.constructor.reporting.StudioDashboardService;
import com.google.inject.Inject;

public class StudioDashboardRepo extends StudioDashboardRepository {

  protected StudioDashboardService studioDashboardService;

  protected MetaViewRepository metaViewRepo;

  @Inject
  public StudioDashboardRepo(
      StudioDashboardService studioDashboardService, MetaViewRepository metaViewRepo) {
    this.studioDashboardService = studioDashboardService;
    this.metaViewRepo = metaViewRepo;
  }

  @Override
  public StudioDashboard save(StudioDashboard studioDashboard) {

    studioDashboard = super.save(studioDashboard);

    MetaView metaView = studioDashboardService.build(studioDashboard);
    if (metaView != null) {
      studioDashboard.setMetaViewGenerated(metaView);
    } else {
      metaView = studioDashboard.getMetaViewGenerated();
      if (metaView != null) {
        metaViewRepo.remove(metaView);
      }
    }
    return studioDashboard;
  }

  @Override
  public void remove(StudioDashboard studioDashboard) {

    MetaView metaView = studioDashboard.getMetaViewGenerated();
    if (metaView != null) {
      metaViewRepo.remove(metaView);
    }

    super.remove(studioDashboard);
  }
}
