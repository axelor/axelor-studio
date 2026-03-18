/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.db.repo;

import com.axelor.db.JPA;
import com.axelor.inject.Beans;
import com.axelor.studio.bpm.service.execution.WkfInstanceService;
import com.axelor.studio.bpm.service.log.WkfLoggerInitService;
import com.axelor.studio.db.WkfInstance;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class BpmWkfInstanceRepository extends WkfInstanceRepository {

  private static final Logger log = LoggerFactory.getLogger(BpmWkfInstanceRepository.class);

  @Override
  public void remove(WkfInstance instance) {
    if (instance.getInstanceId() != null) {
      Beans.get(WkfInstanceService.class).deleteProcessInstance(instance.getInstanceId());
      Beans.get(WkfLoggerInitService.class).remove(instance.getInstanceId());
    }
    clearProcessInstanceIdOnModel(instance);
    super.remove(instance);
  }

  protected void clearProcessInstanceIdOnModel(WkfInstance instance) {
    String modelName = instance.getModelName();
    Long modelId = instance.getModelId();
    String instanceId = instance.getInstanceId();

    if (modelName == null || modelId == null || modelId == 0L || instanceId == null) {
      return;
    }

    try {
      String simpleTableName = Class.forName(modelName).getSimpleName();
      int updated =
          JPA.em()
              .createQuery(
                  "UPDATE "
                      + simpleTableName
                      + " SET processInstanceId = null WHERE id = :id AND processInstanceId = :instanceId")
              .setParameter("id", modelId)
              .setParameter("instanceId", instanceId)
              .executeUpdate();

      if (updated > 0) {
        log.debug(
            "Cleared processInstanceId on {} (id={})", simpleTableName, modelId);
      }
    } catch (Exception e) {
      log.warn("Could not clear processInstanceId on {} (id={}): {}", modelName, modelId, e.getMessage());
    }
  }
}
