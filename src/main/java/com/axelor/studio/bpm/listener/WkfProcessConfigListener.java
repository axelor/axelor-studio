/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.listener;

import com.axelor.studio.bpm.context.WkfCache;
import com.axelor.studio.bpm.utils.BpmTools;
import com.axelor.studio.db.WkfProcessConfig;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostRemove;
import jakarta.persistence.PostUpdate;
import java.util.HashMap;

public class WkfProcessConfigListener {

  @PostPersist
  @PostUpdate
  public void onSave(WkfProcessConfig config) {

    String tenantId = BpmTools.getCurrentTenant();

    if (!WkfCache.WKF_MODEL_CACHE.containsKey(tenantId)) {
      WkfCache.WKF_MODEL_CACHE.put(tenantId, new HashMap<>());
    }

    String modelName = config.getModel();

    if (config.getMetaJsonModel() != null) {
      modelName = config.getMetaJsonModel().getName();
    }
    WkfCache.WKF_MODEL_CACHE.get(tenantId).put(config.getId(), modelName);
  }

  @PostRemove
  public void onRemove(WkfProcessConfig config) {

    String tenantId = BpmTools.getCurrentTenant();

    if (WkfCache.WKF_MODEL_CACHE.containsKey(tenantId)) {
      WkfCache.WKF_MODEL_CACHE.get(tenantId).remove(config.getId());
    }
  }
}
