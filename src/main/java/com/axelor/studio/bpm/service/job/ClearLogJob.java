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
package com.axelor.studio.bpm.service.job;

import com.axelor.db.JPA;
import com.axelor.studio.bpm.service.log.WkfLogService;
import com.axelor.studio.db.WkfInstance;
import com.axelor.studio.db.repo.WkfInstanceRepository;
import com.google.inject.Inject;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;

public class ClearLogJob implements Job {

  protected WkfInstanceRepository wkfInstanceRepo;
  protected WkfLogService logService;

  @Inject
  public ClearLogJob(WkfInstanceRepository wkfInstanceRepo, WkfLogService logService) {
    this.wkfInstanceRepo = wkfInstanceRepo;
    this.logService = logService;
  }

  protected static final int FETCH_LIMIT = 10;

  @Override
  public void execute(JobExecutionContext context) throws JobExecutionException {
    try {
      List<WkfInstance> wkfInstanceList;
      Set<Long> processedIdSet = new HashSet<>();
      int offset = 0;
      wkfInstanceList =
          wkfInstanceRepo
              .all()
              .filter("self.logText IS NOT NULL AND self.logText != ''")
              .order("id")
              .fetch(FETCH_LIMIT, offset);
      while (!wkfInstanceList.isEmpty()) {
        for (WkfInstance instance : wkfInstanceList) {
          processedIdSet.add(instance.getId());
          logService.clearLog(instance.getInstanceId());
          offset++;
        }
        JPA.clear();
        wkfInstanceList =
            wkfInstanceRepo
                .all()
                .filter(
                    "self.logText IS NOT NULL AND self.logText != '' AND self.id NOT IN (?1)",
                    processedIdSet)
                .order("id")
                .fetch(FETCH_LIMIT, offset);
      }

    } catch (Exception e) {
      throw new JobExecutionException(e);
    }
  }
}
