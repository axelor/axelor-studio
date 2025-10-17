/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.db.repo;

import com.axelor.inject.Beans;
import com.axelor.studio.bpm.service.execution.WkfInstanceService;
import com.axelor.studio.bpm.service.log.WkfLoggerInitService;
import com.axelor.studio.db.WkfInstance;

public class BpmWkfInstanceRepository extends WkfInstanceRepository {

  @Override
  public void remove(WkfInstance instance) {
    if (instance.getInstanceId() != null) {
      Beans.get(WkfInstanceService.class).deleteProcessInstance(instance.getInstanceId());
      Beans.get(WkfLoggerInitService.class).remove(instance.getInstanceId());
    }
    super.remove(instance);
  }
}
