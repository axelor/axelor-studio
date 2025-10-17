/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.db.repo;

import com.axelor.meta.db.MetaView;
import com.axelor.meta.db.repo.MetaViewRepository;
import com.axelor.studio.db.StudioChart;
import com.axelor.studio.service.constructor.reporting.StudioChartService;
import com.google.inject.Inject;
import jakarta.validation.ValidationException;
import java.util.List;

public class StudioChartRepo extends StudioChartRepository {

  protected MetaViewRepository metaViewRepo;

  protected StudioChartService studioChartService;

  @Inject
  public StudioChartRepo(MetaViewRepository metaViewRepo, StudioChartService studioChartService) {
    this.metaViewRepo = metaViewRepo;
    this.studioChartService = studioChartService;
  }

  @Override
  public StudioChart save(StudioChart studioChart) throws ValidationException {

    try {
      studioChartService.build(studioChart);
    } catch (Exception e) {
      // refresh(studioChart);
      throw new ValidationException(e);
    }

    return super.save(studioChart);
  }

  @Override
  public void remove(StudioChart studioChart) {

    MetaView metaView = studioChart.getMetaViewGenerated();
    List<StudioChart> studioCharts =
        all()
            .filter("self.metaViewGenerated = ?1 and self.id != ?2", metaView, studioChart.getId())
            .fetch();
    studioCharts.forEach(chart -> chart.setMetaViewGenerated(null));

    if (metaView != null) {
      metaViewRepo.remove(metaView);
    }

    super.remove(studioChart);
  }
}
