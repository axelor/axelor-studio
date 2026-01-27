/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.db.repo;

import com.axelor.meta.db.MetaView;
import com.axelor.meta.db.repo.MetaViewRepository;
import com.axelor.studio.db.StudioDashboard;
import com.axelor.studio.service.constructor.reporting.StudioDashboardService;
import jakarta.inject.Inject;

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
