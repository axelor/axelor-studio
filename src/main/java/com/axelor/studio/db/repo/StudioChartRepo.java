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
import com.axelor.studio.db.StudioChart;
import com.axelor.studio.service.builder.StudioChartService;
import com.google.inject.Inject;
import java.util.List;
import javax.validation.ValidationException;

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
