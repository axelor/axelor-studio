/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
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
              .filter("self.logFile IS NOT NULL")
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
                .filter("self.logFile IS NOT NULL AND self.id NOT IN (?1)", processedIdSet)
                .order("id")
                .fetch(FETCH_LIMIT, offset);
      }

    } catch (Exception e) {
      throw new JobExecutionException(e);
    }
  }
}
