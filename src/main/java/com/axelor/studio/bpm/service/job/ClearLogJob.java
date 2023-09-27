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
import java.util.List;
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
      int offset = 0;
      while (!(wkfInstanceList = wkfInstanceRepo.all().fetch(FETCH_LIMIT, offset)).isEmpty()) {
        for (WkfInstance instance : wkfInstanceList) {
          logService.clearLog(instance.getInstanceId());
          offset++;
        }
        JPA.clear();
      }

    } catch (Exception e) {
      throw new JobExecutionException(e);
    }
  }
}
